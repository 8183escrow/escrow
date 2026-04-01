"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useJobs } from "@/hooks/useJobs";
import { JobCard } from "@/components/JobCard";
import { NETWORK_META_LABEL, PRODUCT_MODE } from "@/lib/demoJobs";

const STATUS_FILTERS = [
  "All",
  "Open",
  "Funded",
  "Submitted",
  "Completed",
  "Rejected",
  "Expired",
] as const;

export default function DashboardPage() {
  const { connected } = useWallet();
  const { jobs, loading, error, refetch } = useJobs();
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== "All" && job.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: jobs.length,
    active: jobs.filter((job) =>
      ["Open", "Funded", "Submitted"].includes(job.status),
    ).length,
    completed: jobs.filter((job) => job.status === "Completed").length,
  };

  if (!connected) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] w-full items-center justify-center bg-[#030303] p-8 text-[#F4F4F4]">
        <div className="max-w-lg border border-[#F4F4F4] p-12 text-center">
          <div className="mb-4 font-mono text-xs uppercase text-[#888]">
            [ ACCESS GATE ]
          </div>
          <h2 className="mb-6 font-sans text-4xl font-black uppercase">
            CONNECT A SOLANA WALLET
          </h2>
          <p className="mb-8 font-mono text-sm uppercase text-[#888]">
            Registry access is only unlocked after wallet connect so the beta
            queue can map every session to a Solana identity.
          </p>
          <div className="inline-block border border-[#F4F4F4] p-4 font-mono text-xs uppercase">
            USE THE HEADER BUTTON TO CONTINUE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 border-b border-[#F4F4F4] pb-8 md:flex-row md:items-end">
        <div>
          <div className="mb-2 font-mono text-xs uppercase text-[#888]">
            [ CURATED BETA REGISTRY ]
          </div>
          <h1 className="font-sans text-5xl font-black uppercase tracking-tighter text-[#F4F4F4] sm:text-6xl">
            DASHBOARD
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 font-mono text-xs font-bold uppercase">
          <div className="border border-[#333] px-3 py-2 text-[#888]">
            {NETWORK_META_LABEL}
          </div>
          <div className="border border-[#333] px-3 py-2 text-[#888]">
            {PRODUCT_MODE}
          </div>
          <button
            onClick={refetch}
            className="border border-[#F4F4F4] px-3 py-2 uppercase transition-none hover:bg-[#F4F4F4] hover:text-[#030303]"
          >
            [ REFRESH FEED ]
          </button>
          <Link
            href="/create-job"
            className="border border-[#14F195] bg-[#14F195] px-4 py-2 uppercase text-[#030303] transition-none hover:bg-[#030303] hover:text-[#14F195]"
          >
            [ OPEN INTAKE ]
          </Link>
        </div>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-0 border border-[#F4F4F4] sm:grid-cols-3">
        <div className="flex flex-col items-center border-b border-[#F4F4F4] p-6 text-center transition-colors hover:bg-white/5 sm:items-start sm:border-r sm:border-b-0 sm:text-left">
          <p className="mb-2 font-mono text-xs uppercase text-[#888]">
            Total missions
          </p>
          <p className="font-sans text-5xl font-black text-[#F4F4F4]">
            {stats.total}
          </p>
        </div>
        <div className="flex flex-col items-center border-b border-[#F4F4F4] p-6 text-center transition-colors hover:bg-white/5 sm:items-start sm:border-r sm:border-b-0 sm:text-left">
          <p className="mb-2 font-mono text-xs uppercase text-[#888]">
            In circulation
          </p>
          <p className="font-sans text-5xl font-black text-[#F4F4F4]">
            {stats.active}
          </p>
        </div>
        <div className="flex flex-col items-center p-6 text-center transition-colors hover:bg-white/5 sm:items-start sm:text-left">
          <p className="mb-2 font-mono text-xs uppercase text-[#888]">
            Closed loops
          </p>
          <p className="font-sans text-5xl font-black text-[#14F195]">
            {stats.completed}
          </p>
        </div>
      </div>

      <h3 className="mb-4 border-b border-[#F4F4F4]/20 pb-2 font-mono text-xs uppercase text-[#888]">
        FILTER PARAMETERS
      </h3>
      <div className="mb-8 flex flex-col items-start gap-4 border-b border-[#F4F4F4] pb-8 md:flex-row md:items-center md:gap-8">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`border px-3 py-1 font-mono text-xs font-bold uppercase transition-none ${
                statusFilter === status
                  ? "border-[#F4F4F4] bg-[#F4F4F4] text-[#030303]"
                  : "border-[#333] text-[#888] hover:border-[#F4F4F4] hover:text-[#F4F4F4]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <span className="font-mono text-xs uppercase text-[#888] md:ml-auto">
          RESULT COUNT: {filteredJobs.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse border border-[#333] p-6">
              <div className="mb-3 h-4 w-1/3 bg-[#333]" />
              <div className="mb-2 h-3 w-2/3 bg-[#333]" />
              <div className="h-3 w-1/2 bg-[#333]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="border border-[#FF0033] bg-[#FF0033]/5 p-12 text-center text-[#FF0033]">
          <div className="mb-3 font-sans text-3xl font-black uppercase">
            Feed issue
          </div>
          <p className="mb-6 font-mono text-sm uppercase">{error}</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="border border-dashed border-[#F4F4F4] p-16 text-center text-[#888]">
          <div className="mb-4 font-mono text-xs uppercase">
            [ QUERY RESULT EMPTY ]
          </div>
          <h3 className="mb-4 font-sans text-3xl font-black uppercase text-[#F4F4F4]">
            NO MISSIONS FOUND
          </h3>
          <p className="mb-8 font-mono text-sm uppercase">
            SHIFT THE FILTER OR OPEN A NEW INTAKE REQUEST.
          </p>
          <Link href="/create-job" className="brutal-btn inline-block">
            OPEN NEW INTAKE
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
