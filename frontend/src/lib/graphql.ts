/**
 * 8183Escrow — Subgraph GraphQL Queries
 *
 * Fetches data from The Graph for the unified dashboard.
 */

import { SUBGRAPH_URL } from "./contracts";

// ═══════════════════════════ Types ═════════════════════════════════

// Escrow entity removed in favor of Global Escrow

export interface SubgraphJob {
  id: string;
  jobId: string;
  paymentToken: string;
  client: string;
  provider: string;
  evaluator: string;
  budget: string;
  expiredAt: string;
  description: string;
  status: string;
  createdAtTimestamp: string;
  updatedAtTimestamp: string;
  deliverable: string | null;
  completionReason: string | null;
  rejectionReason: string | null;
  payoutAmount: string | null;
}

export interface SubgraphUserStats {
  id: string;
  totalJobsCreated: string;
  totalJobsFunded: string;
  totalJobsCompleted: string;
  totalJobsRejected: string;
  totalEarnings: string;
  totalSpent: string;
}

// ═══════════════════════════ Fetch Helper ══════════════════════════

async function querySubgraph<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Subgraph query failed: ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Subgraph error: ${json.errors[0].message}`);
  }
  return json.data;
}

// ═══════════════════════════ Queries ═══════════════════════════════

// fetchEscrowsByDeployer removed - no longer applicable in Global Escrow model

/** Fetch all jobs where user is client, provider, or evaluator. */
export async function fetchJobsByUser(
  userAddress: string
): Promise<SubgraphJob[]> {
  const addr = userAddress.toLowerCase();
  const data = await querySubgraph<{
    clientJobs: SubgraphJob[];
    providerJobs: SubgraphJob[];
    evaluatorJobs: SubgraphJob[];
  }>(
    `query ($addr: Bytes!) {
      clientJobs: jobs(where: { client: $addr }, orderBy: createdAtTimestamp, orderDirection: desc, first: 100) {
        ...JobFields
      }
      providerJobs: jobs(where: { provider: $addr }, orderBy: createdAtTimestamp, orderDirection: desc, first: 100) {
        ...JobFields
      }
      evaluatorJobs: jobs(where: { evaluator: $addr }, orderBy: createdAtTimestamp, orderDirection: desc, first: 100) {
        ...JobFields
      }
    }
    fragment JobFields on Job {
      id
      jobId
      paymentToken
      client
      provider
      evaluator
      budget
      expiredAt
      description
      status
      createdAtTimestamp
      updatedAtTimestamp
      deliverable
      completionReason
      rejectionReason
      payoutAmount
    }`,
    { addr }
  );

  // Deduplicate (user might be both client and evaluator)
  const seen = new Set<string>();
  const all: SubgraphJob[] = [];
  const clientJobs = data?.clientJobs || [];
  const providerJobs = data?.providerJobs || [];
  const evaluatorJobs = data?.evaluatorJobs || [];

  for (const job of [...clientJobs, ...providerJobs, ...evaluatorJobs]) {
    if (!seen.has(job.id)) {
      seen.add(job.id);
      all.push(job);
    }
  }
  return all.sort(
    (a, b) => Number(b.createdAtTimestamp) - Number(a.createdAtTimestamp)
  );
}

/** Fetch user stats for reputation badge. */
export async function fetchUserStats(
  userAddress: string
): Promise<SubgraphUserStats | null> {
  const data = await querySubgraph<{ userStats: SubgraphUserStats | null }>(
    `query ($id: ID!) {
      userStats(id: $id) {
        id
        totalJobsCreated
        totalJobsFunded
        totalJobsCompleted
        totalJobsRejected
        totalEarnings
        totalSpent
      }
    }`,
    { id: userAddress.toLowerCase() }
  );
  return data.userStats;
}

/** Fetch a single job by its global ID (escrow-jobId). */
export async function fetchJobById(
  globalJobId: string
): Promise<SubgraphJob | null> {
  const data = await querySubgraph<{ job: SubgraphJob | null }>(
    `query ($id: ID!) {
      job(id: $id) {
        id
        jobId
        paymentToken
        client
        provider
        evaluator
        budget
        expiredAt
        description
        status
        createdAtTimestamp
        updatedAtTimestamp
        deliverable
        completionReason
        rejectionReason
        payoutAmount
      }
    }`,
    { id: globalJobId }
  );
  return data.job;
}
