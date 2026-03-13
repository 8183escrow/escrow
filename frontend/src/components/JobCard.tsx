"use client";

import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { ERC20_ABI } from "@/lib/contracts";
import type { SubgraphJob } from "@/lib/graphql";

interface JobCardProps {
  job: SubgraphJob;
}

export function JobCard({ job }: JobCardProps) {
  const { data: symbol } = useReadContract({
    address: job.paymentToken as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "symbol",
  });

  const { data: decimals } = useReadContract({
    address: job.paymentToken as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const formattedBudget = decimals
    ? formatUnits(BigInt(job.budget), decimals)
    : job.budget;

  const isExpired =
    Date.now() / 1000 > Number(job.expiredAt) &&
    !["Completed", "Rejected", "Expired"].includes(job.status);

  const truncateAddr = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() / 1000 - Number(timestamp);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

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
              {formattedBudget} {symbol || "TKN"}
            </p>
            <p className="text-xs text-[#888] uppercase mt-1">
              ESCROW_ALLOCATION
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between font-mono text-[0.65rem] sm:text-xs text-[#888] uppercase gap-4">
          <div className="flex items-center gap-6">
            <span>
              CLI: {" "}
              <span className="text-[#F4F4F4]">
                {truncateAddr(job.client)}
              </span>
            </span>
            <span>
              PRV: {" "}
              <span className="text-[#F4F4F4]">
                {job.provider === "0x0000000000000000000000000000000000000000"
                  ? "UNASSIGNED"
                  : truncateAddr(job.provider)}
              </span>
            </span>
          </div>
          <span>T-{timeAgo(job.createdAtTimestamp)}</span>
        </div>
      </div>
    </Link>
  );
}
