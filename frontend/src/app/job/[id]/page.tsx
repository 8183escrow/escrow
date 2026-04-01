"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { StatusBadge } from "@/components/StatusBadge";
import {
  JOB_STATUS_FLOW,
  NETWORK_META_LABEL,
  PRODUCT_MODE,
  formatDisplayDate,
  formatTokenAmount,
  getJobById,
  truncateSolanaAddress,
} from "@/lib/demoJobs";

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="border-b border-[#F4F4F4] p-5 sm:border-r">
      <p className="mb-2 font-mono text-[10px] uppercase text-[#888]">{label}</p>
      <p
        className={`font-mono text-sm uppercase ${
          highlight ? "text-[#14F195]" : "text-[#F4F4F4]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const job = getJobById(params.id as string);

  if (!job) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-5 py-32 text-[#F4F4F4]">
        <div className="max-w-lg border border-dashed border-[#F4F4F4] p-16 text-center text-[#888]">
          <div className="mb-4 font-mono text-xs uppercase">
            [ QUERY RESULT EMPTY ]
          </div>
          <h2 className="mb-8 font-sans text-3xl font-black uppercase text-[#F4F4F4]">
            MISSION NOT FOUND
          </h2>
          <Link
            href="/dashboard"
            className="border border-[#F4F4F4] px-6 py-3 font-mono text-xs font-bold uppercase text-[#F4F4F4] transition-none hover:bg-[#F4F4F4] hover:text-[#030303]"
          >
            [ RETURN TO REGISTRY ]
          </Link>
        </div>
      </div>
    );
  }

  const formattedBudget = formatTokenAmount(job.budget, job.tokenDecimals);
  const formattedPayout = job.payoutAmount
    ? formatTokenAmount(job.payoutAmount, job.tokenDecimals)
    : null;
  const platformDelta = job.payoutAmount
    ? formatTokenAmount(
        (BigInt(job.budget) - BigInt(job.payoutAmount)).toString(),
        job.tokenDecimals,
      )
    : null;
  const statusIndex = JOB_STATUS_FLOW.indexOf(job.status);
  const isFailed = ["Rejected", "Expired"].includes(job.status);

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10 text-[#F4F4F4] sm:px-8">
      <div className="mb-12 border-b border-[#F4F4F4] pb-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-block border-b border-transparent pb-1 font-mono text-xs font-bold uppercase text-[#888] transition-colors hover:border-[#F4F4F4] hover:text-[#F4F4F4]"
        >
          [ &lt; RETURN TO REGISTRY ]
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 font-mono text-xs uppercase text-[#888]">
              [ MISSION RECORD ]
            </div>
            <h1 className="font-sans text-5xl font-black uppercase tracking-tighter text-[#F4F4F4]">
              {job.title}
            </h1>
            <p className="mt-3 max-w-3xl font-mono text-xs uppercase leading-relaxed text-[#888]">
              {job.description}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={job.status} />
            <div className="border border-[#333] px-3 py-1 font-mono text-[10px] uppercase text-[#888]">
              {job.jobId}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <div className="border border-[#F4F4F4] p-8">
            <h3 className="mb-6 border-b border-[#333] pb-2 font-mono text-xs uppercase text-[#888]">
              STATE MACHINE
            </h3>
            <div className="relative mt-8 flex items-center justify-between">
              <div className="absolute top-[11px] left-[10%] right-[10%] h-[1px] bg-[#333]" />
              <div
                className="absolute top-[11px] left-[10%] h-[1px] transition-all duration-500"
                style={{
                  width: isFailed
                    ? "26%"
                    : `${(Math.max(0, statusIndex) / (JOB_STATUS_FLOW.length - 1)) * 80}%`,
                  background: isFailed ? "#FF0033" : "#14F195",
                }}
              />
              {JOB_STATUS_FLOW.map((step, index) => {
                const isActive = statusIndex >= index && !isFailed;
                const isCurrent = job.status === step;

                return (
                  <div
                    key={step}
                    className="relative z-10 flex w-1/4 flex-col items-center"
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center border font-mono text-[10px] font-bold transition-all ${
                        isActive
                          ? "border-[#14F195] bg-[#14F195] text-[#030303]"
                          : isFailed && index <= 1
                            ? "border-[#FF0033] bg-[#FF0033] text-[#030303]"
                            : "border-[#333] bg-[#030303] text-[#555]"
                      } ${isCurrent ? "scale-125" : ""}`}
                    >
                      {isActive ? "✓" : index + 1}
                    </div>
                    <span
                      className={`mt-4 text-center font-mono text-[10px] uppercase ${
                        isActive || isCurrent
                          ? "font-bold text-[#F4F4F4]"
                          : "text-[#555]"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 border-t border-[#333] pt-4 text-center">
              <span className="font-mono text-xs font-bold uppercase text-[#888]">
                {job.status === "Completed"
                  ? "[ DELIVERY VERIFIED ]"
                  : isFailed
                    ? "[ NEEDS OPERATOR REVIEW ]"
                    : "[ BETA PREVIEW FLOW ]"}
              </span>
            </div>
          </div>

          <div className="border border-[#F4F4F4]">
            <h3 className="border-b border-[#F4F4F4] p-6 pb-4 font-mono text-xs uppercase text-[#888]">
              MISSION PARAMETERS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2">
              <DetailRow label="Client" value={job.clientLabel} />
              <DetailRow
                label="Provider"
                value={job.providerLabel}
              />
              <DetailRow
                label="Client wallet"
                value={truncateSolanaAddress(job.clientWallet, 8, 8)}
              />
              <DetailRow
                label="Provider wallet"
                value={
                  job.providerWallet
                    ? truncateSolanaAddress(job.providerWallet, 8, 8)
                    : "UNASSIGNED"
                }
              />
              <DetailRow label="Evaluator" value={job.evaluatorLabel} />
              <DetailRow
                label="Evaluator wallet"
                value={truncateSolanaAddress(job.evaluatorWallet, 8, 8)}
              />
              <DetailRow
                label="Budget preview"
                value={`${formattedBudget} ${job.tokenSymbol}`}
                highlight
              />
              <DetailRow label="Network" value={job.networkLabel} />
              <DetailRow
                label="Opened"
                value={formatDisplayDate(job.createdAt)}
              />
              <DetailRow
                label="Review cutoff"
                value={formatDisplayDate(job.expiresAt)}
              />
            </div>

            {job.deliverable && (
              <div className="border-t border-[#14F195]/30 bg-[#14F195]/10 p-6">
                <p className="mb-2 font-mono text-xs uppercase text-[#14F195]">
                  DELIVERY POINTER
                </p>
                <p className="font-mono text-xs text-[#14F195] break-all">
                  {job.deliverable}
                </p>
              </div>
            )}

            {job.status === "Completed" && formattedPayout && platformDelta && (
              <div className="border-t border-[#F4F4F4] bg-white/[0.03] p-6">
                <p className="mb-4 font-mono text-xs uppercase text-[#888]">
                  PREVIEWED SETTLEMENT
                </p>
                <div className="space-y-2 font-mono text-xs uppercase">
                  <div className="flex items-center justify-between">
                    <span className="text-[#888]">Gross mission budget</span>
                    <span className="font-bold text-[#F4F4F4]">
                      {formattedBudget} {job.tokenSymbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#888]">Platform reserve</span>
                    <span className="text-[#FF0033]">
                      -{platformDelta} {job.tokenSymbol}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-[#333] pt-2">
                    <span className="text-[#888]">Provider payout</span>
                    <span className="text-sm font-bold text-[#14F195]">
                      {formattedPayout} {job.tokenSymbol}
                    </span>
                  </div>
                  {job.completionReason && (
                    <div className="mt-4 border-t border-[#333] pt-4">
                      <p className="mb-1 text-[#888]">Evaluator note</p>
                      <p className="text-[#F4F4F4]">{job.completionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="sticky top-[100px] border border-[#F4F4F4] p-6">
            <h3 className="mb-6 border-b border-[#333] pb-2 font-mono text-xs uppercase text-[#888]">
              BETA ACTIONS
            </h3>

            <div className="mb-6 space-y-2 border border-[#333] bg-white/[0.03] p-4 font-mono text-[10px] uppercase text-[#888]">
              <div className="flex items-center justify-between">
                <span>Wallet session</span>
                <span>{connected ? "ACTIVE" : "IDLE"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Network</span>
                <span>{NETWORK_META_LABEL}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Mode</span>
                <span>{PRODUCT_MODE}</span>
              </div>
            </div>

            {!connected ? (
              <div className="space-y-4">
                <div className="border border-dashed border-[#333] p-4 text-center">
                  <p className="mb-3 font-mono text-[10px] uppercase text-[#555]">
                    LIVE ACTIONS STAY DISABLED
                  </p>
                  <p className="font-mono text-[10px] uppercase leading-relaxed text-[#444]">
                    Connect a Solana wallet to register interest and track when
                    execution opens for this mission class.
                  </p>
                </div>
                <button
                  onClick={() => setVisible(true)}
                  className="w-full border border-[#14F195] bg-[#14F195] px-4 py-3 font-mono text-[10px] font-bold uppercase text-[#030303] transition-none hover:bg-transparent hover:text-[#14F195]"
                >
                  [ CONNECT WALLET ]
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-dashed border-[#333] p-4 text-center">
                  <p className="mb-3 font-mono text-[10px] uppercase text-[#555]">
                    ACTIONS PREVIEW ONLY
                  </p>
                  <p className="font-mono text-[10px] uppercase leading-relaxed text-[#444]">
                    This record shows the Solana-first workflow, but execution
                    stays paused until the backend migration is complete.
                  </p>
                </div>
                <div className="space-y-2">
                  {job.betaActions.map((action) => (
                    <div
                      key={action}
                      className="border border-[#333] px-4 py-3 font-mono text-[10px] font-bold uppercase text-[#F4F4F4]"
                    >
                      [ {action} ]
                    </div>
                  ))}
                </div>
                <Link
                  href="/create-job"
                  className="block w-full border border-[#F4F4F4] px-4 py-3 text-center font-mono text-[10px] font-bold uppercase transition-none hover:bg-[#F4F4F4] hover:text-[#030303]"
                >
                  [ REQUEST EXECUTION SLOT ]
                </Link>
              </div>
            )}

            <div className="mt-6 border-t border-[#333] pt-4">
              <p className="mb-2 font-mono text-[10px] uppercase text-[#555]">
                Mission metadata
              </p>
              <div className="space-y-1 font-mono text-[10px] uppercase">
                <div className="flex justify-between text-[#666]">
                  <span>Opened</span>
                  <span>{formatDisplayDate(job.createdAt)}</span>
                </div>
                <div className="flex justify-between text-[#666]">
                  <span>Expires</span>
                  <span>{formatDisplayDate(job.expiresAt)}</span>
                </div>
                <div className="flex justify-between text-[#666]">
                  <span>Settlement</span>
                  <span>{job.tokenSymbol}</span>
                </div>
                <div className="flex justify-between text-[#666]">
                  <span>Network</span>
                  <span>{job.networkLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
