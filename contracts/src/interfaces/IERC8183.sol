// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IERC8183 — Agentic Commerce Protocol
 * @notice Minimal escrow interface for AI-agent jobs with evaluator attestation.
 * @dev    EIP-8183 (Draft, March 2026) — Virtuals Protocol + Ethereum dAI team.
 *         Lifecycle: Open → Funded → Submitted → Completed | Rejected | Expired
 */
interface IERC8183 {
    // ──────────────────────────── Enums ────────────────────────────

    enum JobStatus {
        Open,       // 0 — job created, awaiting funding
        Funded,     // 1 — client funded escrow
        Submitted,  // 2 — provider submitted deliverable
        Completed,  // 3 — evaluator attested completion
        Rejected,   // 4 — client/evaluator rejected
        Expired     // 5 — past expiredAt, client refunded
    }

    // ──────────────────────────── Events ───────────────────────────

    /// @notice Emitted when a new job is created.
    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address provider,
        address evaluator,
        address paymentToken,
        uint256 expiredAt
    );

    /// @notice Emitted when a provider is assigned to an open job.
    event ProviderSet(uint256 indexed jobId, address indexed provider);

    /// @notice Emitted when the budget is set or updated.
    event BudgetSet(uint256 indexed jobId, uint256 amount);

    /// @notice Emitted when the client funds the escrow.
    event JobFunded(uint256 indexed jobId, address indexed client, uint256 amount);

    /// @notice Emitted when the provider submits a deliverable.
    event JobSubmitted(uint256 indexed jobId, address indexed provider, bytes32 deliverable);

    /// @notice Emitted when the evaluator marks the job complete.
    event JobCompleted(uint256 indexed jobId, address indexed evaluator, bytes32 reason);

    /// @notice Emitted when a job is rejected.
    event JobRejected(uint256 indexed jobId, address indexed rejector, bytes32 reason);

    /// @notice Emitted when a funded/submitted job expires and is refunded.
    event JobExpired(uint256 indexed jobId);

    /// @notice Emitted when payment is released to the provider.
    event PaymentReleased(uint256 indexed jobId, address indexed provider, uint256 amount);

    /// @notice Emitted when a refund is issued to the client.
    event Refunded(uint256 indexed jobId, address indexed client, uint256 amount);

    // ──────────────────────── Core Functions ──────────────────────

    /**
     * @notice Create a new job in Open state.
     * @param provider     Provider address (may be address(0) for later assignment).
     * @param evaluator    Evaluator address (MUST NOT be zero).
     * @param paymentToken ERC-20 token address for payment.
     * @param expiredAt    Unix timestamp after which the job can be refunded.
     * @param description  Human-readable job brief / scope reference.
     * @param hook         Optional hook contract (address(0) = no hook).
     * @return jobId       The ID of the newly created job.
     */
    function createJob(
        address provider,
        address evaluator,
        address paymentToken,
        uint256 expiredAt,
        string calldata description,
        address hook
    ) external returns (uint256 jobId);

    /**
     * @notice Assign a provider to an open job that was created without one.
     * @param jobId     Job ID.
     * @param provider  Provider address (MUST NOT be zero).
     * @param optParams Opaque bytes forwarded to hook (if any).
     */
    function setProvider(uint256 jobId, address provider, bytes calldata optParams) external;

    /**
     * @notice Set or update the budget for an open job.
     * @param jobId     Job ID.
     * @param amount    Budget amount in payment-token units.
     * @param optParams Opaque bytes forwarded to hook (if any).
     */
    function setBudget(uint256 jobId, uint256 amount, bytes calldata optParams) external;

    /**
     * @notice Fund the escrow. Transitions Open → Funded.
     * @param jobId          Job ID.
     * @param expectedBudget Must equal job.budget (front-running protection).
     * @param optParams      Opaque bytes forwarded to hook (if any).
     */
    function fund(uint256 jobId, uint256 expectedBudget, bytes calldata optParams) external;

    /**
     * @notice Provider submits work. Transitions Funded → Submitted.
     * @param jobId       Job ID.
     * @param deliverable Hash/reference to off-chain deliverable.
     * @param optParams   Opaque bytes forwarded to hook (if any).
     */
    function submit(uint256 jobId, bytes32 deliverable, bytes calldata optParams) external;

    /**
     * @notice Evaluator completes a submitted job. Transitions Submitted → Completed.
     * @param jobId     Job ID.
     * @param reason    Optional attestation hash / commitment.
     * @param optParams Opaque bytes forwarded to hook (if any).
     */
    function complete(uint256 jobId, bytes32 reason, bytes calldata optParams) external;

    /**
     * @notice Reject a job. Client rejects Open; evaluator rejects Funded/Submitted.
     * @param jobId     Job ID.
     * @param reason    Optional reason hash.
     * @param optParams Opaque bytes forwarded to hook (if any).
     */
    function reject(uint256 jobId, bytes32 reason, bytes calldata optParams) external;

    /**
     * @notice Claim refund after expiry (block.timestamp >= expiredAt).
     * @param jobId Job ID (must be Funded or Submitted and expired).
     */
    function claimRefund(uint256 jobId) external;
}
