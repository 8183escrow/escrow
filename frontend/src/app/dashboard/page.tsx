"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useJobs } from "@/hooks/useJobs";
import { JobCard } from "@/components/JobCard";
import Link from "next/link";

const STATUS_FILTERS = ["All", "Open", "Funded", "Submitted", "Completed", "Rejected", "Expired"] as const;
const ROLE_FILTERS = ["All Roles", "Client", "Provider", "Evaluator"] as const;

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { jobs, loading, error, refetch } = useJobs();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All Roles");

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== "All" && job.status !== statusFilter) return false;
    if (roleFilter !== "All Roles" && address) {
      const addr = address.toLowerCase();
      if (roleFilter === "Client" && job.client.toLowerCase() !== addr) return false;
      if (roleFilter === "Provider" && job.provider.toLowerCase() !== addr) return false;
      if (roleFilter === "Evaluator" && job.evaluator.toLowerCase() !== addr) return false;
    }
    return true;
  });

  const stats = {
    total: jobs.length,
    active: jobs.filter((j) => ["Open", "Funded", "Submitted"].includes(j.status)).length,
    completed: jobs.filter((j) => j.status === "Completed").length,
  };

  if (!isConnected) {
    return (
      <div className="w-full min-h-[calc(100vh-72px)] flex items-center justify-center p-8 bg-[#030303] text-[#F4F4F4]">
        <div className="border border-[#F4F4F4] p-12 max-w-lg text-center">
          <div className="font-mono text-xs uppercase mb-4 text-[#888]">[ SYSTEM ERROR ]</div>
          <h2 className="font-sans font-black text-4xl uppercase mb-6">NO WALLET DETECTED</h2>
          <p className="font-mono text-sm uppercase text-[#888] mb-8">
            CONNECTION REQUIRED TO ACCESS ESCROW REGISTRY AND JOB INDEX.
          </p>
          <div className="border border-[#F4F4F4] p-4 text-xs font-mono inline-block">
            PLEASE USE NAVIGATION BAR TO CONNECT
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 pb-8 border-b border-[#F4F4F4]">
        <div>
          <div className="font-mono text-xs uppercase mb-2 text-[#888]">[ ESCROW REGISTRY ]</div>
          <h1 className="font-sans font-black text-5xl uppercase tracking-tighter sm:text-6xl text-[#F4F4F4]">DASHBOARD</h1>
        </div>
        <div className="flex items-center gap-4 mt-6 md:mt-0 font-mono text-xs font-bold">
          <button onClick={refetch} className="uppercase hover:bg-[#F4F4F4] hover:text-[#030303] px-3 py-2 border border-[#F4F4F4] transition-none">
            [ REFRESH ]
          </button>
          <Link href="/create-job" className="uppercase bg-[#F4F4F4] text-[#030303] px-4 py-2 hover:bg-[#030303] hover:text-[#F4F4F4] border border-[#F4F4F4] transition-none">
            [ DEPLOY ESCROW ]
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-[#F4F4F4] mb-12">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-[#F4F4F4] flex flex-col items-center sm:items-start text-center sm:text-left hover:bg-white/5 transition-colors">
          <p className="font-mono text-xs uppercase text-[#888] mb-2">TOTAL_ESCROWS</p>
          <p className="font-sans font-black text-5xl text-[#F4F4F4]">{stats.total}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-[#F4F4F4] flex flex-col items-center sm:items-start text-center sm:text-left hover:bg-white/5 transition-colors">
          <p className="font-mono text-xs uppercase text-[#888] mb-2">ACTIVE_CONTRACTS</p>
          <p className="font-sans font-black text-5xl text-[#F4F4F4]">{stats.active}</p>
        </div>
        <div className="p-6 flex flex-col items-center sm:items-start text-center sm:text-left hover:bg-white/5 transition-colors">
          <p className="font-mono text-xs uppercase text-[#888] mb-2">COMPLETED_JOBS</p>
          <p className="font-sans font-black text-5xl text-[#00FF00]">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <h3 className="font-mono text-xs uppercase text-[#888] mb-4 border-b border-[#F4F4F4]/20 pb-2">FILTER_PARAMETERS</h3>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 mb-8 pb-8 border-b border-[#F4F4F4]">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`font-mono text-xs font-bold uppercase border px-3 py-1 transition-none ${
                statusFilter === s
                  ? "bg-[#F4F4F4] text-[#030303] border-[#F4F4F4]"
                  : "bg-transparent text-[#888] border-[#333] hover:border-[#F4F4F4] hover:text-[#F4F4F4]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        
        <div className="hidden md:block w-px h-8 bg-[#333]"></div>

        <div className="flex flex-wrap items-center gap-2">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`font-mono text-xs font-bold uppercase border px-3 py-1 transition-none ${
                roleFilter === r
                  ? "bg-transparent text-[#FF0033] border-[#FF0033]"
                  : "bg-transparent text-[#888] border-[#333] hover:border-[#FF0033] hover:text-[#FF0033]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        
        <span className="font-mono text-xs uppercase text-[#888] md:ml-auto">
          RESULT_COUNT: {filteredJobs.length}
        </span>
      </div>

      {/* Job List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-[#333] animate-pulse p-6">
              <div className="h-4 bg-[#333] w-1/3 mb-3" />
              <div className="h-3 bg-[#333] w-2/3 mb-2" />
              <div className="h-3 bg-[#333] w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="border border-[#FF0033] p-12 text-center bg-[#FF0033]/5 text-[#FF0033]">
          <div className="font-sans font-black text-3xl mb-3 uppercase">Sync Failure</div>
          <p className="font-mono text-sm uppercase mb-6">{error}</p>
          <button onClick={refetch} className="font-mono text-xs font-bold uppercase border border-[#FF0033] px-6 py-2 hover:bg-[#FF0033] hover:text-[#030303] transition-none">
            [ RETRY_CONNECTION ]
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="border border-[#F4F4F4] border-dashed p-16 text-center text-[#888]">
          <div className="font-mono text-xs uppercase mb-4">[ QUERY_RESULT_EMPTY ]</div>
          <h3 className="font-sans font-black text-3xl text-[#F4F4F4] uppercase mb-4">NO CONTRACTS FOUND</h3>
          <p className="font-mono text-sm mb-8 uppercase">
            {statusFilter !== "All" || roleFilter !== "All Roles"
              ? "ADJUST FILTER PARAMETERS TO EXPAND SEARCH."
              : "INITIALIZE YOUR FIRST ESCROW CONTRACT."}
          </p>
          <Link href="/create-job" className="brutal-btn inline-block">
            DEPLOY NEW ESCROW
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-0">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
