// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

import {IERC8183} from "./interfaces/IERC8183.sol";
import {IACPHook} from "./interfaces/IACPHook.sol";
import {IReputationRegistry} from "./interfaces/IReputationRegistry.sol";

/**
 * @title  ERC8183Escrow — Agentic Commerce Escrow Contract
 * @author 8183Escrow
 * @notice Fully ERC-8183 compliant escrow for AI-agent jobs. All payments use
 *         a single ERC-20 token hard-coded at deployment.
 *
 * @dev    Key design decisions:
 *         • Uses OpenZeppelin SafeERC20 for all token transfers (handles non-reverting tokens).
 *         • ReentrancyGuard on every state-changing function that touches tokens.
 *         • Hook gas capped at 500 000 to bound callback execution cost.
 *         • `_msgSender()` override via Context — ERC-2771 ready. Swap `Context`
 *           for `ERC2771Context` + trusted forwarder to enable gasless txs.
 *         • `claimRefund` is deliberately NOT hookable (per ERC-8183 spec) so
 *           malicious hooks cannot block refunds.
 *         • Platform fee (basis points) deducted only on completion, never on refund.
 *         • Optional IReputationRegistry call on completion for ERC-8004 integration.
 */
contract ERC8183Escrow is IERC8183, ReentrancyGuard, Context {
    using SafeERC20 for IERC20;

    // ═══════════════════════════ Constants ═══════════════════════════

    /// @dev Maximum hook gas to prevent unbounded callback execution.
    uint256 private constant HOOK_GAS_LIMIT = 500_000;

    /// @dev Maximum fee in basis points (2%).
    uint256 private constant MAX_FEE_BPS = 200;

    /// @dev Basis points denominator.
    uint256 private constant BPS_DENOMINATOR = 10_000;

    // ═══════════════════════════ Storage ═════════════════════════════

    /// @notice The ERC-20 token used for ALL payments in this escrow.
    IERC20 public immutable paymentToken;

    /// @notice Platform fee recipient.
    address public treasury;

    /// @notice Platform fee in basis points (0–200 → 0%–2%).
    uint256 public feeBps;

    /// @notice Optional reputation registry for ERC-8004 integration.
    IReputationRegistry public reputationRegistry;

    /// @notice Address that deployed this escrow (from the Factory).
    address public immutable deployer;

    /// @notice Auto-incrementing job counter.
    uint256 public nextJobId;

    /// @dev Job storage.
    struct Job {
        address client;
        address provider;
        address evaluator;
        address hook;
        uint256 budget;
        uint256 expiredAt;
        string  description;
        bytes32 deliverable;
        JobStatus status;
    }

    /// @notice jobId → Job data.
    mapping(uint256 => Job) public jobs;

    // ═══════════════════════════ Errors ══════════════════════════════

    error ZeroAddress();
    error InvalidExpiry();
    error InvalidStatus(JobStatus expected, JobStatus actual);
    error Unauthorized();
    error ProviderAlreadySet();
    error ProviderNotSet();
    error BudgetMismatch(uint256 expected, uint256 actual);
    error ZeroBudget();
    error NotExpired();
    error FeeTooHigh();

    // ═══════════════════════════ Constructor ═════════════════════════

    /**
     * @param _paymentToken ERC-20 token for all escrow payments.
     * @param _treasury     Address to receive platform fees.
     * @param _feeBps       Platform fee in basis points (0–200).
     * @param _deployer     Address that triggered Factory.createEscrow().
     */
    constructor(
        address _paymentToken,
        address _treasury,
        uint256 _feeBps,
        address _deployer
    ) {
        if (_paymentToken == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();

        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;
        feeBps = _feeBps;
        deployer = _deployer;
    }

    // ═══════════════════════════ Modifiers ═══════════════════════════

    modifier onlyDeployer() {
        if (_msgSender() != deployer) revert Unauthorized();
        _;
    }

    // ═══════════════════════════ Admin ═══════════════════════════════

    /**
     * @notice Update the optional reputation registry (ERC-8004).
     * @param _registry New registry address (address(0) to disable).
     */
    function setReputationRegistry(address _registry) external onlyDeployer {
        reputationRegistry = IReputationRegistry(_registry);
    }

    /**
     * @notice Update platform fee (onlyDeployer).
     * @param _feeBps New fee in basis points (0–200).
     */
    function updateFee(uint256 _feeBps) external onlyDeployer {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeBps = _feeBps;
    }

    /**
     * @notice Update treasury address (onlyDeployer).
     * @param _treasury New treasury address.
     */
    function updateTreasury(address _treasury) external onlyDeployer {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
    }

    // ═══════════════════════════ ERC-8183 Core ═══════════════════════

    /// @inheritdoc IERC8183
    function createJob(
        address provider,
        address evaluator,
        address _paymentToken,
        uint256 expiredAt,
        string calldata description,
        address hook
    ) external override returns (uint256 jobId) {
        if (evaluator == address(0)) revert ZeroAddress();
        if (expiredAt <= block.timestamp) revert InvalidExpiry();

        jobId = nextJobId++;

        jobs[jobId] = Job({
            client:      _msgSender(),
            provider:    provider,
            evaluator:   evaluator,
            hook:        hook,
            budget:      0,
            expiredAt:   expiredAt,
            description: description,
            deliverable: bytes32(0),
            status:      JobStatus.Open
        });

        emit JobCreated(jobId, _msgSender(), provider, evaluator, _paymentToken, expiredAt);
    }

    /// @inheritdoc IERC8183
    function setProvider(
        uint256 jobId,
        address provider,
        bytes calldata optParams
    ) external override {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Open) revert InvalidStatus(JobStatus.Open, job.status);
        if (_msgSender() != job.client) revert Unauthorized();
        if (job.provider != address(0)) revert ProviderAlreadySet();
        if (provider == address(0)) revert ZeroAddress();

        // Hook — before
        _hookBefore(job.hook, jobId, this.setProvider.selector,
            abi.encode(provider, optParams));

        job.provider = provider;

        emit ProviderSet(jobId, provider);

        // Hook — after
        _hookAfter(job.hook, jobId, this.setProvider.selector,
            abi.encode(provider, optParams));
    }

    /// @inheritdoc IERC8183
    function setBudget(
        uint256 jobId,
        uint256 amount,
        bytes calldata optParams
    ) external override {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Open) revert InvalidStatus(JobStatus.Open, job.status);

        address sender = _msgSender();
        if (sender != job.client && sender != job.provider) revert Unauthorized();

        // Hook — before
        _hookBefore(job.hook, jobId, this.setBudget.selector,
            abi.encode(amount, optParams));

        job.budget = amount;

        emit BudgetSet(jobId, amount);

        // Hook — after
        _hookAfter(job.hook, jobId, this.setBudget.selector,
            abi.encode(amount, optParams));
    }

    /// @inheritdoc IERC8183
    function fund(
        uint256 jobId,
        uint256 expectedBudget,
        bytes calldata optParams
    ) external override nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Open) revert InvalidStatus(JobStatus.Open, job.status);
        if (_msgSender() != job.client) revert Unauthorized();
        if (job.provider == address(0)) revert ProviderNotSet();
        if (job.budget == 0) revert ZeroBudget();
        if (job.budget != expectedBudget) revert BudgetMismatch(job.budget, expectedBudget);

        // Hook — before
        _hookBefore(job.hook, jobId, this.fund.selector, optParams);

        // Effects
        job.status = JobStatus.Funded;

        // Interactions — pull tokens from client into escrow
        paymentToken.safeTransferFrom(_msgSender(), address(this), job.budget);

        emit JobFunded(jobId, _msgSender(), job.budget);

        // Hook — after
        _hookAfter(job.hook, jobId, this.fund.selector, optParams);
    }

    /// @inheritdoc IERC8183
    function submit(
        uint256 jobId,
        bytes32 deliverable,
        bytes calldata optParams
    ) external override {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Funded) revert InvalidStatus(JobStatus.Funded, job.status);
        if (_msgSender() != job.provider) revert Unauthorized();

        // Hook — before
        _hookBefore(job.hook, jobId, this.submit.selector,
            abi.encode(deliverable, optParams));

        job.status = JobStatus.Submitted;
        job.deliverable = deliverable;

        emit JobSubmitted(jobId, _msgSender(), deliverable);

        // Hook — after
        _hookAfter(job.hook, jobId, this.submit.selector,
            abi.encode(deliverable, optParams));
    }

    /// @inheritdoc IERC8183
    function complete(
        uint256 jobId,
        bytes32 reason,
        bytes calldata optParams
    ) external override nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Submitted) revert InvalidStatus(JobStatus.Submitted, job.status);
        if (_msgSender() != job.evaluator) revert Unauthorized();

        // Hook — before
        _hookBefore(job.hook, jobId, this.complete.selector,
            abi.encode(reason, optParams));

        // Effects
        job.status = JobStatus.Completed;

        // Calculate fee
        uint256 fee = (job.budget * feeBps) / BPS_DENOMINATOR;
        uint256 payout = job.budget - fee;

        // Interactions — pay provider
        paymentToken.safeTransfer(job.provider, payout);

        // Pay fee to treasury (if any)
        if (fee > 0) {
            paymentToken.safeTransfer(treasury, fee);
        }

        emit JobCompleted(jobId, _msgSender(), reason);
        emit PaymentReleased(jobId, job.provider, payout);

        // ERC-8004 reputation update (optional, non-reverting)
        _updateReputation(job.provider, jobId);

        // Hook — after
        _hookAfter(job.hook, jobId, this.complete.selector,
            abi.encode(reason, optParams));
    }

    /// @inheritdoc IERC8183
    function reject(
        uint256 jobId,
        bytes32 reason,
        bytes calldata optParams
    ) external override nonReentrant {
        Job storage job = jobs[jobId];
        address sender = _msgSender();

        // Open → client can reject
        // Funded/Submitted → evaluator can reject
        if (job.status == JobStatus.Open) {
            if (sender != job.client) revert Unauthorized();
        } else if (job.status == JobStatus.Funded || job.status == JobStatus.Submitted) {
            if (sender != job.evaluator) revert Unauthorized();
        } else {
            revert InvalidStatus(JobStatus.Open, job.status); // terminal — no reject
        }

        // Hook — before
        _hookBefore(job.hook, jobId, this.reject.selector,
            abi.encode(reason, optParams));

        // Effects
        bool shouldRefund = job.status == JobStatus.Funded || job.status == JobStatus.Submitted;
        job.status = JobStatus.Rejected;

        // Interactions — refund if was funded or submitted
        if (shouldRefund) {
            paymentToken.safeTransfer(job.client, job.budget);
            emit Refunded(jobId, job.client, job.budget);
        }

        emit JobRejected(jobId, sender, reason);

        // Hook — after
        _hookAfter(job.hook, jobId, this.reject.selector,
            abi.encode(reason, optParams));
    }

    /**
     * @inheritdoc IERC8183
     * @dev Deliberately NOT hookable (per ERC-8183 spec) — refunds cannot
     *      be blocked by a malicious hook.
     */
    function claimRefund(uint256 jobId) external override nonReentrant {
        Job storage job = jobs[jobId];

        if (job.status != JobStatus.Funded && job.status != JobStatus.Submitted) {
            revert InvalidStatus(JobStatus.Funded, job.status);
        }
        if (block.timestamp < job.expiredAt) revert NotExpired();

        // Effects
        job.status = JobStatus.Expired;

        // Interactions — refund client
        paymentToken.safeTransfer(job.client, job.budget);

        emit JobExpired(jobId);
        emit Refunded(jobId, job.client, job.budget);
    }

    // ═══════════════════════════ View Helpers ════════════════════════

    /**
     * @notice Get full job details.
     * @param jobId The job ID.
     * @return client        Job client address.
     * @return provider      Job provider address.
     * @return evaluator     Job evaluator address.
     * @return hook          Hook contract address.
     * @return _paymentToken Payment token address (same as immutable paymentToken).
     * @return budget        Job budget.
     * @return expiredAt     Expiry timestamp.
     * @return description   Job description.
     * @return deliverable   Provider deliverable hash.
     * @return status        Current job status.
     */
    function getJob(uint256 jobId) external view returns (
        address client,
        address provider,
        address evaluator,
        address hook,
        address _paymentToken,
        uint256 budget,
        uint256 expiredAt,
        string memory description,
        bytes32 deliverable,
        JobStatus status
    ) {
        Job storage job = jobs[jobId];
        return (
            job.client,
            job.provider,
            job.evaluator,
            job.hook,
            address(paymentToken),
            job.budget,
            job.expiredAt,
            job.description,
            job.deliverable,
            job.status
        );
    }

    // ═══════════════════════════ Internal ════════════════════════════

    /**
     * @dev Call hook.beforeAction with gas cap. Skips if hook == address(0).
     */
    function _hookBefore(
        address hook,
        uint256 jobId,
        bytes4 selector,
        bytes memory data
    ) internal {
        if (hook == address(0)) return;
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory ret) = hook.call{gas: HOOK_GAS_LIMIT}(
            abi.encodeWithSelector(
                IACPHook.beforeAction.selector,
                jobId,
                selector,
                data
            )
        );
        if (!success) {
            // Bubble up revert reason
            assembly {
                revert(add(ret, 32), mload(ret))
            }
        }
    }

    /**
     * @dev Call hook.afterAction with gas cap. Skips if hook == address(0).
     */
    function _hookAfter(
        address hook,
        uint256 jobId,
        bytes4 selector,
        bytes memory data
    ) internal {
        if (hook == address(0)) return;
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory ret) = hook.call{gas: HOOK_GAS_LIMIT}(
            abi.encodeWithSelector(
                IACPHook.afterAction.selector,
                jobId,
                selector,
                data
            )
        );
        if (!success) {
            assembly {
                revert(add(ret, 32), mload(ret))
            }
        }
    }

    /**
     * @dev Update reputation via ERC-8004 registry (if configured).
     *      Non-reverting — reputation failure should not block payment.
     */
    function _updateReputation(address provider, uint256 jobId) internal {
        IReputationRegistry reg = reputationRegistry;
        if (address(reg) == address(0)) return;

        // solhint-disable-next-line no-empty-blocks
        try reg.recordCompletion(provider, jobId, address(this)) {} catch {}
    }
}
