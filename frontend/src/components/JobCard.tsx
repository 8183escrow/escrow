"use client";

import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import {
  formatTokenAmount,
  timeAgo,
  truncateSolanaAddress,
  type DemoJob,
} from "@/lib/demoJobs";

interface JobCardProps {
  job: DemoJob;
}

export function JobCard({ job }: JobCardProps) {
  const formattedBudget = formatTokenAmount(job.budget, job.tokenDecimals);
  const isExpired =
    new Date(job.expiresAt).getTime() < Date.now() &&
    !["Completed", "Rejected", "Expired"].includes(job.status);

  return (
    <Link href={`/job/${job.id}`}>
      <div className="border border-[#F4F4F4] group cursor-pointer hover:bg-white/5 transition-colors p-4 md:p-6 mb-4 relative overflow-hidden">
        {/* Decorative corner bracket */}
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#F4F4F4] opacity-50 m-2" />
        
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 border-b border-[#F4F4F4]/20 pb-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-3 font-mono text-xs uppercase text-[#888]">
              <span>ID_{job.jobId}</span>
              <StatusBadge status={job.status} size="sm" />
              {isExpired && (
                <span className="text-[#FF0033] font-bold animate-pulse">
                  [ EXPIRED ]
                </span>
              )}
            </div>
            <p className="font-mono text-sm text-[#F4F4F4] line-clamp-2 leading-relaxed uppercase">
              {job.description || "NO_DESCRIPTION_PROVIDED"}
            </p>
          </div>
          <div className="text-left md:text-right flex-shrink-0 font-mono">
            <p className="text-xl font-bold text-[#F4F4F4] uppercase">
              {formattedBudget} {job.tokenSymbol}
            </p>
            <p className="text-xs text-[#888] uppercase mt-1">
              BETA_PAYOUT_PREVIEW
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between font-mono text-[0.65rem] sm:text-xs text-[#888] uppercase gap-4">
          <div className="flex items-center gap-6">
            <span>
              CLI: {" "}
              <span className="text-[#F4F4F4]">
                {truncateSolanaAddress(job.clientWallet, 6, 4)}
              </span>
            </span>
            <span>
              PRV: {" "}
              <span className="text-[#F4F4F4]">
                {!job.providerWallet
                  ? "UNASSIGNED"
                  : truncateSolanaAddress(job.providerWallet, 6, 4)}
              </span>
            </span>
          </div>
          <span>T-{timeAgo(job.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
