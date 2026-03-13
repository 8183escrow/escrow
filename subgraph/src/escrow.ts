/**
 * 8183Escrow — Global Escrow Subgraph Mapping
 *
 * Handles all job lifecycle events from the singleton Global Escrow.
 * Updates Job, UserStats, and GlobalStats entities.
 */
import {
  JobCreated,
  ProviderSet,
  BudgetSet,
  JobFunded,
  JobSubmitted,
  JobCompleted,
  JobRejected,
  JobExpired,
  PaymentReleased,
  Refunded,
} from "../generated/GlobalEscrow/ERC8183Escrow";
import { Job, UserStats, GlobalStats } from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

// ──────────────────────── Helpers ──────────────────────────

function getOrCreateUserStats(address: Bytes): UserStats {
  let id = address.toHexString();
  let stats = UserStats.load(id);
  if (stats == null) {
    stats = new UserStats(id);
    stats.totalJobsCreated = BigInt.fromI32(0);
    stats.totalJobsFunded = BigInt.fromI32(0);
    stats.totalJobsCompleted = BigInt.fromI32(0);
    stats.totalJobsRejected = BigInt.fromI32(0);
    stats.totalEarnings = BigInt.fromI32(0);
    stats.totalSpent = BigInt.fromI32(0);
  }
  return stats;
}

function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("latest");
  if (stats == null) {
    stats = new GlobalStats("latest");
    stats.totalJobsCreated = BigInt.fromI32(0);
    stats.totalJobsCompleted = BigInt.fromI32(0);
  }
  return stats;
}

// ──────────────────────── Handlers ─────────────────────────

export function handleJobCreated(event: JobCreated): void {
  let id = event.params.jobId.toString();

  let job = new Job(id);
  job.jobId = event.params.jobId;
  job.client = event.params.client;
  job.provider = event.params.provider;
  job.evaluator = event.params.evaluator;
  job.paymentToken = event.params.paymentToken;
  job.hook = Bytes.empty();
  job.budget = BigInt.fromI32(0);
  job.expiredAt = event.params.expiredAt;
  job.description = "";
  job.status = "Open";
  job.createdAtBlock = event.block.number;
  job.createdAtTimestamp = event.block.timestamp;
  job.createdTxHash = event.transaction.hash;
  job.updatedAtBlock = event.block.number;
  job.updatedAtTimestamp = event.block.timestamp;
  job.save();

  // Update Global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalJobsCreated = globalStats.totalJobsCreated.plus(BigInt.fromI32(1));
  globalStats.save();

  // Update client UserStats
  let clientStats = getOrCreateUserStats(event.params.client);
  clientStats.totalJobsCreated = clientStats.totalJobsCreated.plus(BigInt.fromI32(1));
  clientStats.save();
}

export function handleProviderSet(event: ProviderSet): void {
  let id = event.params.jobId.toString();
  let job = Job.load(id);
  if (job == null) return;

  job.provider = event.params.provider;
  job.updatedAtBlock = event.block.number;
  job.updatedAtTimestamp = event.block.timestamp;
  job.save();
}

export function handleBudgetSet(event: BudgetSet): void {
  let id = event.params.jobId.toString();
  let job = Job.load(id);
  if (job == null) return;

  job.budget = event.params.amount;
  job.updatedAtBlock = event.block.number;
  job.updatedAtTimestamp = event.block.timestamp;
  job.save();
}

export function handleJobFunded(event: JobFunded): void {
  let id = event.params.jobId.toString();
  let job = Job.load(id);
  if (job == null) return;

  job.status = "Funded";
  job.updatedAtBlock = event.block.number;
  job.updatedAtTimestamp = event.block.timestamp;
  job.save();

  // Update client stats
  let clientStats = getOrCreateUserStats(event.params.client);
  clientStats.totalJobsFunded = clientStats.totalJobsFunded.plus(BigInt.fromI32(1));
  clientStats.totalSpent = clientStats.totalSpent.plus(event.params.amount);
  clientStats.save();
}

export function handleJobSubmitted(event: JobSubmitted): void {
  let id = event.params.jobId.toString();
  let job = Job.load(id);
  if (job == null) return;

  job.status = "Submitted";
  job.deliverable = event.params.deliverable;
  job.updatedAtBlock = event.block.number;
  job.updatedAtTimestamp = event.block.timestamp;
  job.save();
}

export function handleJobCompleted(event: JobCompleted): void {
  let id = event.params.jobId.toString();
  let job = Job.load(id);
  if (job == null) return;

  job.status = "Completed";
  job.completionReason = event.params.reason;
  job.updatedAtBlock = event.block.number;
  job.updatedAtTimestamp = event.block.timestamp;
  job.save();

  // Update Global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalJobsCompleted = globalStats.totalJobsCompleted.plus(BigInt.fromI32(1));
  globalStats.save();
}

export function handleJobRejected(event: JobRejected): void {
  let id = event.params.jobId.toString();
  let job = Job.load(id);
  if (job == null) return;

  job.status = "Rejected";
  job.rejectionReason = event.params.reason;
  job.updatedAtBlock = event.block.number;
  job.updatedAtTimestamp = event.block.timestamp;
  job.save();

  // Update rejector stats
  let rejectorStats = getOrCreateUserStats(event.params.rejector);
  rejectorStats.totalJobsRejected = rejectorStats.totalJobsRejected.plus(BigInt.fromI32(1));
  rejectorStats.save();
}

export function handleJobExpired(event: JobExpired): void {
  let id = event.params.jobId.toString();
  let job = Job.load(id);
  if (job == null) return;

  job.status = "Expired";
  job.updatedAtBlock = event.block.number;
  job.updatedAtTimestamp = event.block.timestamp;
  job.save();
}

export function handlePaymentReleased(event: PaymentReleased): void {
  let id = event.params.jobId.toString();
  let job = Job.load(id);
  if (job == null) return;

  job.payoutAmount = event.params.amount;
  job.save();

  // Update provider earnings
  let providerStats = getOrCreateUserStats(event.params.provider);
  providerStats.totalJobsCompleted = providerStats.totalJobsCompleted.plus(BigInt.fromI32(1));
  providerStats.totalEarnings = providerStats.totalEarnings.plus(event.params.amount);
  providerStats.save();
}

export function handleRefunded(event: Refunded): void {
  // Refund events update client totalSpent (subtract refund)
  let clientStats = getOrCreateUserStats(event.params.client);
  clientStats.totalSpent = clientStats.totalSpent.minus(event.params.amount);
  clientStats.save();
}
