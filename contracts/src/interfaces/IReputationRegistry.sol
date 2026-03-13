// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IReputationRegistry — Minimal ERC-8004 Reputation Hook
 * @notice Called by the escrow on job completion to update provider reputation.
 * @dev    Placeholder aligned with ERC-8004 Trustless Agents Standard draft.
 *         Will be upgraded when ERC-8004 Solidity interface is finalized.
 */
interface IReputationRegistry {
    /**
     * @notice Record a job completion for a provider.
     * @param provider The provider whose reputation should be updated.
     * @param jobId    The completed job ID (for audit trail).
     * @param escrow   The escrow contract address (for cross-escrow tracking).
     */
    function recordCompletion(address provider, uint256 jobId, address escrow) external;

    /**
     * @notice Get the total completed jobs for a provider.
     * @param provider The provider address.
     * @return count   Number of completed jobs.
     */
    function getCompletedJobs(address provider) external view returns (uint256 count);
}
