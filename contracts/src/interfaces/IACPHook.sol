// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IACPHook — Agentic Commerce Protocol Hook Interface
 * @notice Optional hook contract called before and after core ERC-8183 functions.
 * @dev    Hooks enable extensibility (milestones, ZK proofs, bidding, reputation)
 *         without modifying the core escrow contract.
 *
 *         Data encoding per selector:
 *           setProvider → abi.encode(address provider, bytes optParams)
 *           setBudget   → abi.encode(uint256 amount, bytes optParams)
 *           fund        → optParams (raw)
 *           submit      → abi.encode(bytes32 deliverable, bytes optParams)
 *           complete    → abi.encode(bytes32 reason, bytes optParams)
 *           reject      → abi.encode(bytes32 reason, bytes optParams)
 */
interface IACPHook {
    /**
     * @notice Called BEFORE the core function executes.
     * @dev    MAY revert to block the action (e.g. custom validation).
     * @param jobId    The job ID.
     * @param selector The 4-byte selector of the core function being called.
     * @param data     ABI-encoded function parameters (see encoding table above).
     */
    function beforeAction(uint256 jobId, bytes4 selector, bytes calldata data) external;

    /**
     * @notice Called AFTER the core function completes (state changes + transfers done).
     * @dev    MAY perform side effects or revert to roll back the entire tx.
     * @param jobId    The job ID.
     * @param selector The 4-byte selector of the core function being called.
     * @param data     ABI-encoded function parameters (see encoding table above).
     */
    function afterAction(uint256 jobId, bytes4 selector, bytes calldata data) external;
}
