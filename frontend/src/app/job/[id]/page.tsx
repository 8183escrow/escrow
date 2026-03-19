"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ESCROW_ABI, ERC20_ABI, JOB_STATUSES } from "@/lib/contracts";
import { StatusBadge } from "@/components/StatusBadge";
import { formatUnits, parseUnits, isAddress, zeroAddress } from "viem";
import Link from "next/link";
import { useReadContract as useToken } from "wagmi";

// ─── Dummy job data (mirrors useJobs DUMMY_JOBS exactly) ─────────────────────
const DUMMY_JOBS = [
  {
    id: "0x123...abc-0",
    jobId: "0",
    paymentToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    client: "0xMockClient123456789ABCDEF",
    provider: "0xMockProvider456789ABCDEF",
    evaluator: "0xMockEvaluator789ABCDEF123",
    budget: "500000000",
    description:
      "Write a comprehensive Smart Contract Audit for a new AMM protocol. Deliverable: Detailed security report with findings, severity levels, and recommended fixes in Markdown format.",
    status: "Open" as const,
    createdAtTimestamp: (Math.floor(Date.now() / 1000) - 86400).toString(),
    updatedAtTimestamp: (Math.floor(Date.now() / 1000) - 86400).toString(),
    expiredAt: (Math.floor(Date.now() / 1000) + 86400 * 7).toString(),
    deliverable: null as string | null,
    completionReason: null as string | null,
    rejectionReason: null as string | null,
    payoutAmount: null as string | null,
    tokenSymbol: "USDC",
    tokenDecimals: 6,
  },
  {
    id: "0x123...abc-1",
    jobId: "1",
    paymentToken: "0x4200000000000000000000000000000000000006",
    client: "0xMockClient123456789ABCDEF",
    provider: "0xMockProvider456789ABCDEF",
    evaluator: "0xMockClient123456789ABCDEF",
    budget: "150000000000000000",
    description:
      "Generate 5 high-quality promotional images for a social media campaign targeting Web3 developers. Deliverable: ZIP file with images (1080x1080 PNG) + metadata JSON. Must include brand guidelines adherence.",
    status: "Funded" as const,
    createdAtTimestamp: (Math.floor(Date.now() / 1000) - 86400 * 2).toString(),
    updatedAtTimestamp: (Math.floor(Date.now() / 1000) - 86400 * 2).toString(),
    expiredAt: (Math.floor(Date.now() / 1000) + 86400 * 5).toString(),
    deliverable: null as string | null,
    completionReason: null as string | null,
    rejectionReason: null as string | null,
    payoutAmount: null as string | null,
    tokenSymbol: "WETH",
    tokenDecimals: 18,
  },
  {
    id: "0x999...def-2",
    jobId: "2",
    paymentToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    client: "0xArbitrationUser123456ABCD",
    provider: "0xMockProvider456789ABCDEF",
    evaluator: "0xMockEvaluator789ABCDEF123",
    budget: "2500000000",
    description:
      "Build an automated trading bot strategy integrating DEX aggregators (0x, 1inch). Deliverable: Python source code, backtesting results (CSV), risk parameters documentation, and deployment instructions for Base Mainnet.",
    status: "Completed" as const,
    createdAtTimestamp: (Math.floor(Date.now() / 1000) - 86400 * 10).toString(),
    updatedAtTimestamp: (Math.floor(Date.now() / 1000) - 86400 * 5).toString(),
    expiredAt: (Math.floor(Date.now() / 1000) - 86400).toString(),
    deliverable: "0x69706673" as string | null,
    completionReason: "Excellent logic and code quality." as string | null,
    rejectionReason: null as string | null,
    payoutAmount: "2450000000" as string | null,
    tokenSymbol: "USDC",
    tokenDecimals: 6,
  },
];

const TIMELINE_STEPS = ["Open", "Funded", "Submitted", "Completed"];

export default function JobDetailPage() {
  const params = useParams();
  const jobGlobalId = params.id as string;
  const { address } = useAccount();

  // ─── Detect if this is a dummy job ID ───────────────────────────────
  const dummyJob = DUMMY_JOBS.find((j) => j.id === jobGlobalId);
  const isDummy = !!dummyJob;

  // ─── Real on-chain ID parsing ────────────────────────────────────────
  const parts = jobGlobalId?.split("-") ?? [];
  const escrowAddress = parts[0] as `0x${string}` | undefined;
  const jobIdNum = parts[1] ? BigInt(parts[1]) : undefined;
  const isValidOnChain =
    !isDummy &&
    escrowAddress &&
    isAddress(escrowAddress) &&
    jobIdNum !== undefined;

  // ─── On-chain data (only fetched for real jobs) ──────────────────────
  const {
    data: jobData,
    isLoading,
    refetch,
  } = useReadContract({
    address: escrowAddress,
    abi: ESCROW_ABI,
    functionName: "getJob",
    args: jobIdNum !== undefined ? [jobIdNum] : undefined,
    query: { enabled: !!isValidOnChain },
  });

  const paymentTokenAddr = jobData ? (jobData[4] as string) : undefined;

  const { data: tokenSymbol } = useReadContract({
    address: paymentTokenAddr as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: !!paymentTokenAddr },
  });

  const { data: tokenDecimals } = useReadContract({
    address: paymentTokenAddr as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!paymentTokenAddr },
  });

  // ─── Write ops (only for real jobs) ─────────────────────────────────
  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const {
    writeContract: approveToken,
    data: approveTxHash,
    isPending: isApproving,
  } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const [budgetInput, setBudgetInput] = useState("");
  const [deliverableInput, setDeliverableInput] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // ─── Parse on-chain job ──────────────────────────────────────────────
  const onChainJob = jobData
    ? {
        client: jobData[0] as string,
        provider: jobData[1] as string,
        evaluator: jobData[2] as string,
        hook: jobData[3] as string,
        paymentToken: jobData[4] as string,
        budget: jobData[5] as bigint,
        expiredAt: jobData[6] as bigint,
        description: jobData[7] as string,
        deliverable: jobData[8] as string,
        status: JOB_STATUSES[Number(jobData[9])] || "Open",
      }
    : null;

  // ─── Unified job view (dummy or on-chain) ────────────────────────────
  const job = isDummy
    ? {
        client: dummyJob!.client,
        provider: dummyJob!.provider,
        evaluator: dummyJob!.evaluator,
        hook: zeroAddress,
        paymentToken: dummyJob!.paymentToken,
        budget: BigInt(dummyJob!.budget),
        expiredAt: BigInt(dummyJob!.expiredAt),
        description: dummyJob!.description,
        deliverable: dummyJob!.deliverable ?? zeroAddress,
        status: dummyJob!.status,
        tokenSymbol: dummyJob!.tokenSymbol,
        tokenDecimals: dummyJob!.tokenDecimals,
        payoutAmount: dummyJob!.payoutAmount ? BigInt(dummyJob!.payoutAmount) : null,
        completionReason: dummyJob!.completionReason,
      }
    : onChainJob
    ? {
        ...onChainJob,
        tokenSymbol: tokenSymbol as string | undefined,
        tokenDecimals: tokenDecimals as number | undefined,
        payoutAmount: null,
        completionReason: null,
      }
    : null;

  const isClient = job && address?.toLowerCase() === job.client.toLowerCase();
  const isProvider = job && address?.toLowerCase() === job.provider.toLowerCase();
  const isEvaluator = job && address?.toLowerCase() === job.evaluator.toLowerCase();

  const formattedBudget = job?.tokenDecimals
    ? formatUnits(job.budget, job.tokenDecimals)
    : job
    ? formatUnits(job.budget, 6)
    : "0";

  const formattedPayout = job?.payoutAmount && job?.tokenDecimals
    ? formatUnits(job.payoutAmount, job.tokenDecimals)
    : null;

  const isExpired = job && Date.now() / 1000 >= Number(job.expiredAt);
  const truncAddr = (a: string) =>
    a.startsWith("0x") && a.length === 42
      ? `${a.slice(0, 8)}...${a.slice(-6)}`
      : a.length > 20
      ? `${a.slice(0, 10)}...${a.slice(-6)}`
      : a;

  const formatDate = (ts: bigint | string) => {
    const n = typeof ts === "bigint" ? Number(ts) : Number(ts);
    return new Date(n * 1000).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ─── On-chain actions ────────────────────────────────────────────────
  const handleSetBudget = () => {
    if (!escrowAddress || !job?.tokenDecimals || jobIdNum === undefined) return;
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI,
      functionName: "setBudget",
      args: [jobIdNum, parseUnits(budgetInput, job.tokenDecimals), "0x" as `0x${string}`],
    });
  };

  const handleApprove = () => {
    if (!escrowAddress || !paymentTokenAddr || !job) return;
    approveToken({
      address: paymentTokenAddr as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [escrowAddress, job.budget],
    });
  };

  const handleFund = () => {
    if (!escrowAddress || !job || jobIdNum === undefined) return;
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI,
      functionName: "fund",
      args: [jobIdNum, job.budget, "0x" as `0x${string}`],
    });
  };

  const handleSubmit = () => {
    if (!escrowAddress || jobIdNum === undefined) return;
    const hash = deliverableInput.startsWith("0x")
      ? deliverableInput
      : "0x" + Buffer.from(deliverableInput).toString("hex").padEnd(64, "0");
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI,
      functionName: "submit",
      args: [jobIdNum, hash as `0x${string}`, "0x" as `0x${string}`],
    });
  };

  const handleComplete = () => {
    if (!escrowAddress || jobIdNum === undefined) return;
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI,
      functionName: "complete",
      args: [jobIdNum, zeroAddress as `0x${string}`, "0x" as `0x${string}`],
    });
  };

  const handleReject = () => {
    if (!escrowAddress || jobIdNum === undefined) return;
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI,
      functionName: "reject",
      args: [jobIdNum, zeroAddress as `0x${string}`, "0x" as `0x${string}`],
    });
  };

  const handleClaimRefund = () => {
    if (!escrowAddress || jobIdNum === undefined) return;
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI,
      functionName: "claimRefund",
      args: [jobIdNum],
    });
  };

  useEffect(() => {
    if (isSuccess) refetch();
  }, [isSuccess, refetch]);

  // ─── Error states ─────────────────────────────────────────────────────
  if (!isDummy && !isValidOnChain) {
    return (
      <div className="w-full min-h-screen py-32 px-5 flex items-center justify-center text-[#F4F4F4]">
        <div className="border border-[#F4F4F4] p-12 text-center max-w-lg">
          <div className="font-mono text-xs uppercase mb-4 text-[#FF0033]">[ INVALID_IDENTIFIER ]</div>
          <h2 className="font-sans font-black text-3xl uppercase mb-6">MALFORMED CONTRACT ID</h2>
          <p className="font-mono text-sm uppercase text-[#888] mb-8">
            EXPECTED FORMAT: ESCROW_ADDRESS-JOB_ID
          </p>
          <Link href="/dashboard" className="font-mono text-xs font-bold uppercase border border-[#F4F4F4] px-6 py-3 hover:bg-[#F4F4F4] hover:text-[#030303] transition-none">
            [ RETURN_TO_REGISTRY ]
          </Link>
        </div>
      </div>
    );
  }

  if (!isDummy && isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-32 min-h-screen text-[#F4F4F4]">
        <div className="border border-[#333] p-12 animate-pulse">
          <div className="h-6 bg-[#333] w-1/3 mb-6" />
          <div className="h-4 bg-[#333] w-2/3 mb-4" />
          <div className="h-4 bg-[#333] w-1/2 mb-12" />
          <div className="h-32 bg-[#222] w-full" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="w-full min-h-screen py-32 px-5 flex items-center justify-center text-[#F4F4F4]">
        <div className="border border-[#F4F4F4] border-dashed p-16 text-center max-w-lg text-[#888]">
          <div className="font-mono text-xs uppercase mb-4">[ QUERY_RESULT_EMPTY ]</div>
          <h2 className="font-sans font-black text-3xl text-[#F4F4F4] uppercase mb-8">CONTRACT NOT FOUND</h2>
          <Link href="/dashboard" className="font-mono text-xs font-bold uppercase border border-[#F4F4F4] px-6 py-3 hover:bg-[#F4F4F4] hover:text-[#030303] transition-none text-[#F4F4F4]">
            [ RETURN_TO_REGISTRY ]
          </Link>
        </div>
      </div>
    );
  }

  const statusIdx = TIMELINE_STEPS.indexOf(job.status);
  const isFailed = ["Rejected", "Expired"].includes(job.status);

  return (
    <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 py-10 min-h-screen text-[#F4F4F4]">

      {/* ─── Dummy Data Notice Banner ─── */}

      {/* ─── Back + Title ─── */}
      <div className="mb-12 border-b border-[#F4F4F4] pb-8">
        <Link
          href="/dashboard"
          className="font-mono text-xs font-bold uppercase text-[#888] hover:text-[#F4F4F4] hover:border-b hover:border-[#F4F4F4] pb-1 transition-colors mb-6 inline-block"
        >
          [ &lt; RETURN_TO_REGISTRY ]
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase text-[#888] mb-2">[ JOB_RECORD ]</div>
            <h1 className="font-sans font-black text-5xl uppercase tracking-tighter text-[#F4F4F4]">
              JOB_{isDummy ? dummyJob!.jobId : String(jobIdNum)}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={job.status} />
            {isExpired && !isFailed && job.status !== "Completed" && (
              <span className="font-mono text-xs font-bold uppercase text-[#FF0033] animate-pulse">
                [ EXPIRED ]
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-8">

          {/* State machine timeline */}
          <div className="border border-[#F4F4F4] p-8">
            <h3 className="font-mono text-xs uppercase text-[#888] mb-6 border-b border-[#333] pb-2">
              STATE_MACHINE_PROGRESSION
            </h3>
            <div className="flex items-center justify-between relative mt-8">
              {/* Track */}
              <div className="absolute top-[11px] left-[10%] right-[10%] h-[1px] bg-[#333]" />
              {/* Progress fill */}
              <div
                className="absolute top-[11px] left-[10%] h-[1px] transition-all duration-500"
                style={{
                  width: isFailed
                    ? `${(Math.max(0, TIMELINE_STEPS.indexOf("Funded")) / (TIMELINE_STEPS.length - 1)) * 80}%`
                    : `${(Math.max(0, statusIdx) / (TIMELINE_STEPS.length - 1)) * 80}%`,
                  background: isFailed ? "#FF0033" : "#00FF00",
                }}
              />
              {TIMELINE_STEPS.map((step, i) => {
                const isActive = statusIdx >= i && !isFailed;
                const isCurrent = job.status === step;
                return (
                  <div key={step} className="relative flex flex-col items-center z-10 w-1/4">
                    <div
                      className={`w-6 h-6 flex items-center justify-center font-mono text-[10px] font-bold border transition-all ${
                        isActive
                          ? "bg-[#00FF00] text-[#030303] border-[#00FF00]"
                          : isFailed && i <= 1
                          ? "bg-[#FF0033] text-[#030303] border-[#FF0033]"
                          : "bg-[#030303] border-[#333] text-[#555]"
                      } ${isCurrent ? "scale-125" : ""}`}
                    >
                      {isActive ? "✓" : i + 1}
                    </div>
                    <span className={`font-mono text-[10px] uppercase mt-4 text-center ${isActive || isCurrent ? "text-[#F4F4F4] font-bold" : "text-[#555]"}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
            {isFailed && (
              <div className="mt-8 pt-4 border-t border-[#333] text-center">
                <span className="font-mono text-xs font-bold uppercase text-[#FF0033]">
                  {job.status === "Rejected"
                    ? "[ TERMINAL_STATE: REJECTED ]"
                    : "[ TERMINAL_STATE: TIMEOUT_EXCEEDED ]"}
                </span>
              </div>
            )}
          </div>

          {/* Contract parameters */}
          <div className="border border-[#F4F4F4] flex flex-col">
            <h3 className="font-mono text-xs uppercase text-[#888] border-b border-[#F4F4F4] p-6 pb-4">
              CONTRACT_PARAMETERS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-[#F4F4F4]">
              <InfoRow label="CLIENT_ADDR" value={truncAddr(job.client)} tag={isClient ? "SELF" : undefined} />
              <InfoRow
                label="PROVIDER_ADDR"
                value={job.provider === zeroAddress ? "UNASSIGNED" : truncAddr(job.provider)}
                tag={isProvider ? "SELF" : undefined}
              />
              <InfoRow label="EVALUATOR_ADDR" value={truncAddr(job.evaluator)} tag={isEvaluator ? "SELF" : undefined} />
              <InfoRow
                label="COLLATERAL_LOCKED"
                value={`${formattedBudget} ${job.tokenSymbol || "TKN"}`}
                highlight
              />
              <InfoRow label="DEADLINE" value={formatDate(job.expiredAt)} />
              <InfoRow label="HOOK_MODIFIER" value={job.hook === zeroAddress ? "NONE" : truncAddr(job.hook)} />
            </div>

            {/* Description */}
            <div className="p-6 border-b border-[#F4F4F4]">
              <p className="font-mono text-xs uppercase text-[#888] mb-4">MANIFEST_PAYLOAD</p>
              <div className="font-mono text-sm text-[#F4F4F4] leading-relaxed whitespace-pre-wrap bg-white/5 p-4 border border-[#333]">
                {job.description || "NO_DESCRIPTION_PROVIDED"}
              </div>
            </div>

            {/* Deliverable (if submitted/completed) */}
            {job.deliverable && job.deliverable !== zeroAddress && (
              <div className="p-6 bg-[#00FF00]/10 border-t border-[#00FF00]/30">
                <p className="font-mono text-xs uppercase text-[#00FF00] mb-2">DELIVERABLE_PAYLOAD</p>
                <p className="font-mono text-xs text-[#00FF00] break-all">{job.deliverable}</p>
              </div>
            )}

            {/* Completed payout breakdown */}
            {job.status === "Completed" && (
              <div className="p-6 border-t border-[#F4F4F4] bg-white/[0.03]">
                <p className="font-mono text-xs uppercase text-[#888] mb-4">SETTLEMENT_BREAKDOWN</p>
                <div className="space-y-2 font-mono text-xs uppercase">
                  <div className="flex justify-between items-center">
                    <span className="text-[#888]">GROSS_BUDGET</span>
                    <span className="text-[#F4F4F4] font-bold">{formattedBudget} {job.tokenSymbol || "TKN"}</span>
                  </div>
                  {formattedPayout && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[#888]">PLATFORM_FEE (1%)</span>
                        <span className="text-[#FF0033]">
                          -{formatUnits(job.budget - (job.payoutAmount ?? BigInt(0)), job.tokenDecimals ?? 6)} {job.tokenSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-[#333] pt-2 mt-2">
                        <span className="text-[#888]">PROVIDER_PAYOUT</span>
                        <span className="text-[#00FF00] font-bold text-sm">{formattedPayout} {job.tokenSymbol}</span>
                      </div>
                    </>
                  )}
                  {job.completionReason && (
                    <div className="mt-4 pt-4 border-t border-[#333]">
                      <p className="text-[#888] mb-1">EVALUATOR_NOTE</p>
                      <p className="text-[#F4F4F4]">{job.completionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN — Actions Sidebar ─── */}
        <div>
          <div className="border border-[#F4F4F4] p-6 sticky top-[100px]">
            <h3 className="font-mono text-xs uppercase text-[#888] mb-6 border-b border-[#333] pb-2">
              COMMAND_INTERFACE
            </h3>

            {/* Dummy job notice — no actions available */}
            {isDummy && (
              <div className="space-y-4">
                <div className="border border-dashed border-[#333] p-4 text-center">
                  <p className="font-mono text-[10px] uppercase text-[#555] mb-3">
                    LIVE_ACTIONS_UNAVAILABLE
                  </p>
                  <p className="font-mono text-[10px] uppercase text-[#444] leading-relaxed">
                    CONNECT YOUR WALLET AND DEPLOY A REAL ESCROW TO INTERACT WITH JOB FUNCTIONS.
                  </p>
                </div>
                <Link
                  href="/create-job"
                  className="block w-full font-mono text-[10px] font-bold uppercase border border-[#F4F4F4] px-4 py-3 hover:bg-[#F4F4F4] hover:text-[#030303] transition-none text-center"
                >
                  [ DEPLOY_NEW_ESCROW ]
                </Link>
                <div className="border-t border-[#333] pt-4">
                  <p className="font-mono text-[10px] uppercase text-[#555] mb-2">JOB_METADATA</p>
                  <div className="space-y-1 font-mono text-[10px] uppercase">
                    <div className="flex justify-between text-[#666]">
                      <span>CREATED</span>
                      <span>{formatDate(dummyJob!.createdAtTimestamp)}</span>
                    </div>
                    <div className="flex justify-between text-[#666]">
                      <span>EXPIRES</span>
                      <span>{formatDate(dummyJob!.expiredAt)}</span>
                    </div>
                    <div className="flex justify-between text-[#666]">
                      <span>PAYMENT</span>
                      <span>{dummyJob!.tokenSymbol}</span>
                    </div>
                    <div className="flex justify-between text-[#666]">
                      <span>CHAIN</span>
                      <span>BASE MAINNET</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Real on-chain actions */}
            {!isDummy && (
              <div className="flex flex-col gap-4">
                {/* Apply (Open, unassigned) */}
                {job.status === "Open" && job.provider === zeroAddress && !isClient && (
                  <button
                    onClick={() => setShowPopup(true)}
                    className="brutal-btn w-full !bg-[#00FF00] !border-[#00FF00] !text-[#030303]"
                  >
                    [ APPLY_FOR_EXECUTION ]
                  </button>
                )}

                {/* Set Budget */}
                {job.status === "Open" && (isClient || isProvider) && (
                  <div className="border border-[#333] p-4 mb-2">
                    <label className="block font-mono text-[10px] uppercase text-[#888] mb-2">
                      ALLOCATE_BUDGET ({job.tokenSymbol || "TKN"})
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="number"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        placeholder="100"
                        className="w-full bg-transparent border-b border-[#333] font-mono text-sm p-2 outline-none focus:border-[#F4F4F4]"
                      />
                      <button
                        onClick={handleSetBudget}
                        disabled={!budgetInput || isPending}
                        className="font-mono text-[10px] font-bold uppercase border border-[#F4F4F4] px-4 py-2 hover:bg-[#F4F4F4] hover:text-[#030303] transition-none disabled:opacity-50 mt-2 text-center"
                      >
                        [ SET_AMOUNT ]
                      </button>
                    </div>
                  </div>
                )}

                {/* Approve + Fund */}
                {job.status === "Open" && isClient && job.budget > BigInt(0) && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="font-mono text-[10px] font-bold uppercase border border-[#F4F4F4] px-4 py-3 hover:bg-[#F4F4F4] hover:text-[#030303] transition-none disabled:opacity-50 w-full text-center"
                    >
                      {isApproving ? "[ APPROVING_SPEND... ]" : `[ 1/2: APPROVE_${job.tokenSymbol} ]`}
                    </button>
                    <button
                      onClick={handleFund}
                      disabled={isPending || isConfirming}
                      className="font-mono text-[10px] font-bold uppercase border border-[#00FF00] px-4 py-3 bg-[#00FF00] text-[#030303] hover:bg-transparent hover:text-[#00FF00] transition-none disabled:opacity-50 w-full text-center"
                    >
                      {isPending ? "[ SIGNING... ]" : isConfirming ? "[ VERIFYING... ]" : "[ 2/2: FUND_CONTRACT ]"}
                    </button>
                  </>
                )}

                {/* Cancel */}
                {job.status === "Open" && isClient && (
                  <button
                    onClick={handleReject}
                    disabled={isPending}
                    className="font-mono text-[10px] font-bold uppercase text-[#FF0033] hover:text-[#FF0033]/70 transition-none w-full text-center mt-2 border border-transparent hover:border-[#FF0033] py-2"
                  >
                    [ CANCEL_DRAFT ]
                  </button>
                )}

                {/* Submit */}
                {job.status === "Funded" && isProvider && (
                  <div className="border border-[#333] p-4 mb-2">
                    <label className="block font-mono text-[10px] uppercase text-[#888] mb-2">
                      SUBMIT_DELIVERABLE_HASH
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={deliverableInput}
                        onChange={(e) => setDeliverableInput(e.target.value)}
                        placeholder="ipfs://... or 0x..."
                        className="w-full bg-transparent border-b border-[#333] font-mono text-xs p-2 outline-none focus:border-[#00FF00]"
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={!deliverableInput || isPending}
                        className="font-mono text-[10px] font-bold uppercase border border-[#00FF00] px-4 py-2 hover:bg-[#00FF00] hover:text-[#030303] text-[#00FF00] transition-none disabled:opacity-50 mt-2 text-center"
                      >
                        [ EXECUTE_SUBMISSION ]
                      </button>
                    </div>
                  </div>
                )}

                {/* Complete / Reject (evaluator, Submitted) */}
                {job.status === "Submitted" && isEvaluator && (
                  <>
                    <button
                      onClick={handleComplete}
                      disabled={isPending}
                      className="font-mono text-[10px] font-bold uppercase border border-[#00FF00] px-4 py-3 bg-[#00FF00] text-[#030303] hover:bg-transparent hover:text-[#00FF00] transition-none disabled:opacity-50 w-full text-center"
                    >
                      [ VALIDATE_AND_PAY ]
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isPending}
                      className="font-mono text-[10px] font-bold uppercase border border-[#FF0033] px-4 py-3 text-[#FF0033] hover:bg-[#FF0033] hover:text-[#030303] transition-none disabled:opacity-50 w-full text-center"
                    >
                      [ REJECT_SUBMISSION ]
                    </button>
                  </>
                )}

                {/* Reject (evaluator, Funded) */}
                {job.status === "Funded" && isEvaluator && (
                  <button
                    onClick={handleReject}
                    disabled={isPending}
                    className="font-mono text-[10px] font-bold uppercase border border-[#FF0033] px-4 py-3 text-[#FF0033] hover:bg-[#FF0033] hover:text-[#030303] transition-none disabled:opacity-50 w-full text-center"
                  >
                    [ REJECT_AND_REFUND ]
                  </button>
                )}

                {/* Claim Refund */}
                {isExpired && (job.status === "Funded" || job.status === "Submitted") && (
                  <button
                    onClick={handleClaimRefund}
                    disabled={isPending || isConfirming}
                    className="font-mono text-[10px] font-bold uppercase border border-[#F4F4F4] px-4 py-3 bg-[#F4F4F4] text-[#030303] hover:bg-transparent hover:text-[#F4F4F4] transition-none disabled:opacity-50 w-full text-center"
                  >
                    [ CLAIM_EXPIRED_REFUND ]
                  </button>
                )}

                {/* Terminal */}
                {["Completed", "Rejected", "Expired"].includes(job.status) && (
                  <p className="font-mono text-[10px] uppercase text-[#888] text-center p-4">
                    --- TERMINAL_STATE_REACHED ---
                  </p>
                )}

                {/* TX feedback */}
                {writeError && (
                  <div className="mt-4 p-4 border border-[#FF0033] bg-[#FF0033]/5 text-[#FF0033] font-mono text-[10px] uppercase break-all">
                    ERROR: {writeError.message.split("\n")[0]}
                  </div>
                )}
                {isSuccess && (
                  <div className="mt-4 p-4 border border-[#00FF00] bg-[#00FF00]/5 text-[#00FF00] font-mono text-[10px] uppercase">
                    OK: TRANSACTION_CONFIRMED
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provider Waitlist Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030303]/80 backdrop-blur-sm">
          <div className="bg-[#030303] border border-[#F4F4F4] w-full max-w-md p-8 relative shadow-[0_0_30px_rgba(244,244,244,0.1)]">
            <div className="absolute top-0 left-0 bg-[#F4F4F4] text-[#030303] font-mono font-bold text-xs uppercase px-3 py-1">
              SYSTEM_NOTIFICATION
            </div>
            <div className="mt-4 text-center">
              <div className="font-mono text-3xl font-black text-[#FF0033] mb-4">RESTRICTED</div>
              <p className="font-mono text-sm uppercase text-[#888] mb-8">
                PROVIDER ASSIGNMENT LIMITED TO WHITELISTED ADDRESSES IN CLOSED BETA.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/create-job"
                  className="font-mono text-xs font-bold uppercase border border-[#F4F4F4] py-3 text-center hover:bg-[#F4F4F4] hover:text-[#030303]"
                  onClick={() => setShowPopup(false)}
                >
                  [ JOIN_WAITLIST ]
                </Link>
                <button
                  onClick={() => setShowPopup(false)}
                  className="font-mono text-xs font-bold uppercase text-[#888] hover:text-[#F4F4F4] py-3 text-center"
                >
                  [ DISMISS ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  tag,
  highlight,
}: {
  label: string;
  value: string;
  tag?: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-6 border-r border-[#F4F4F4] border-b sm:border-b-0 last:border-r-0 lg:last:border-r xl:last:border-r-0 sm:even:border-r-0 lg:even:border-r [&:nth-child(-n+4)]:border-b">
      <p className="font-mono text-[10px] uppercase text-[#888] mb-2">{label}</p>
      <p className={`font-mono text-sm ${highlight ? "text-[#00FF00] font-bold" : "text-[#F4F4F4]"}`}>
        {value}
        {tag && (
          <span className="ml-2 font-mono text-[10px] font-bold text-[#F4F4F4] border border-[#F4F4F4] px-1 py-0.5">
            {tag}
          </span>
        )}
      </p>
    </div>
  );
}
