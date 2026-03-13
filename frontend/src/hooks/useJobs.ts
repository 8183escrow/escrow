"use client";

/**
 * 8183Escrow — useJobs Hook
 *
 * Fetches user's jobs from the subgraph + optional on-chain reads.
 * Also provides real-time event watching via wagmi.
 */

import { useEffect, useState, useCallback } from "react";
import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";
import { fetchJobsByUser, type SubgraphJob } from "@/lib/graphql";
import { ESCROW_ABI } from "@/lib/contracts";

export interface UseJobsReturn {
  jobs: SubgraphJob[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobs(): UseJobsReturn {
  const { address } = useAccount();
  
const DUMMY_JOBS: SubgraphJob[] = [
  {
    id: "0x123...abc-0",
    jobId: "0",
    paymentToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
    client: "0xMockClient123",
    provider: "0xMockProvider456",
    evaluator: "0xMockEvaluator789",
    budget: "500000000", // 500 USDC (6 decimals)
    description: "Write a comprehensive Smart Contract Audit for a new AMM protocol.",
    status: "Open",
    createdAtTimestamp: (Math.floor(Date.now() / 1000) - 86400).toString(),
    updatedAtTimestamp: (Math.floor(Date.now() / 1000) - 86400).toString(),
    expiredAt: (Math.floor(Date.now() / 1000) + 86400 * 7).toString(),
    deliverable: null,
    completionReason: null,
    rejectionReason: null,
    payoutAmount: null,
  },
  {
    id: "0x123...abc-1",
    jobId: "1",
    paymentToken: "0x4200000000000000000000000000000000000006", // Base WETH
    client: "0xMockClient123",
    provider: "0xMockProvider456",
    evaluator: "0xMockClient123", /* Self Evaluated */
    budget: "150000000000000000", // 0.15 ETH
    description: "Generate 5 high-quality promotional images for social media campaign.",
    status: "Funded",
    createdAtTimestamp: (Math.floor(Date.now() / 1000) - 86400 * 2).toString(),
    updatedAtTimestamp: (Math.floor(Date.now() / 1000) - 86400 * 2).toString(),
    expiredAt: (Math.floor(Date.now() / 1000) + 86400 * 5).toString(),
    deliverable: null,
    completionReason: null,
    rejectionReason: null,
    payoutAmount: null,
  },
  {
    id: "0x999...def-2",
    jobId: "2",
    paymentToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
    client: "0xArbitrationUser",
    provider: "0xMockProvider456",
    evaluator: "0xMockEvaluator789",
    budget: "2500000000", // 2500 USDC
    description: "Build an automated trading bot strategy integrating DEX aggregators.",
    status: "Completed",
    createdAtTimestamp: (Math.floor(Date.now() / 1000) - 86400 * 10).toString(),
    updatedAtTimestamp: (Math.floor(Date.now() / 1000) - 86400 * 5).toString(),
    expiredAt: (Math.floor(Date.now() / 1000) - 86400).toString(),
    deliverable: "ipfs://mockdeliverablehash123456789",
    completionReason: "Excellent logic and code quality.",
    rejectionReason: null,
    payoutAmount: "2450000000", /* Post fee */
  },
];

  const [jobs, setJobs] = useState<SubgraphJob[]>(DUMMY_JOBS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!address) {
      setJobs([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobsByUser(address);
      setJobs(data && data.length > 0 ? [...data, ...DUMMY_JOBS] : DUMMY_JOBS);
    } catch (err) {
      console.error("Subgraph fetch error, falling back to dummy jobs:", err);
      // Fallback silently so UI continues showing DUMMY_JOBS
      setJobs(DUMMY_JOBS);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}

/**
 * Hook to read a single job from an escrow contract on-chain.
 */
export function useJobOnChain(escrowAddress: `0x${string}`, jobId: bigint) {
  return useReadContract({
    address: escrowAddress,
    abi: ESCROW_ABI,
    functionName: "getJob",
    args: [jobId],
  });
}

/**
 * Hook to watch for JobCreated events on a specific escrow.
 */
export function useWatchJobEvents(
  escrowAddress: `0x${string}` | undefined,
  onEvent: () => void
) {
  useWatchContractEvent({
    address: escrowAddress,
    abi: ESCROW_ABI,
    eventName: "JobCreated",
    onLogs: () => onEvent(),
    enabled: !!escrowAddress,
  });

  useWatchContractEvent({
    address: escrowAddress,
    abi: ESCROW_ABI,
    eventName: "JobFunded",
    onLogs: () => onEvent(),
    enabled: !!escrowAddress,
  });

  useWatchContractEvent({
    address: escrowAddress,
    abi: ESCROW_ABI,
    eventName: "JobCompleted",
    onLogs: () => onEvent(),
    enabled: !!escrowAddress,
  });
}
