"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  GLOBAL_ESCROW_ADDRESS,
  NATIVE_TOKEN_ADDRESS,
  ESCROW_ABI,
  ERC20_ABI,
} from "@/lib/contracts";
import { isAddress, zeroAddress } from "viem";

export default function CreateJobPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Step 1: Token Selection
  const [paymentToken, setPaymentToken] = useState<string>(NATIVE_TOKEN_ADDRESS);
  const [customTokenInput, setCustomTokenInput] = useState("");
  const isCustomToken = paymentToken !== NATIVE_TOKEN_ADDRESS;

  // Step 2: Job details
  const [provider, setProvider] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [evaluatorSelf, setEvaluatorSelf] = useState(false);
  const [description, setDescription] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [hookAddress, setHookAddress] = useState("");

  // Closed Beta waitlist modal state
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Token info for custom token
  const { data: customTokenName } = useReadContract({
    address: isAddress(customTokenInput) ? (customTokenInput as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "name",
    query: { enabled: isAddress(customTokenInput) },
  });

  const { data: customTokenSymbol } = useReadContract({
    address: isAddress(customTokenInput) ? (customTokenInput as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: isAddress(customTokenInput) },
  });

  // Create job
  const {
    writeContract: createJob,
    data: createTxHash,
    isPending: isCreating,
    error: createError,
  } = useWriteContract();

  const { isLoading: isCreateConfirming, isSuccess: createSuccess } =
    useWaitForTransactionReceipt({ hash: createTxHash });

  const handleCreateJob = () => {
    // ── Closed Beta: show waitlist modal instead of submitting ──
    console.log("[DEBUG] handleCreateJob triggered. showWaitlist set to true.");
    setShowWaitlist(true);
    setTimeout(() => emailRef.current?.focus(), 80);
    /* === Re-enable below when mainnet launch is ready ===
    if (!isAddress(paymentToken)) return;
    const expiredAt = BigInt(Math.floor(Date.now() / 1000) + Number(expiryDays) * 86400);
    const evalAddr = evaluatorSelf ? address! : (evaluator as `0x${string}`);
    const hook = isAddress(hookAddress) ? hookAddress : zeroAddress;
    createJob({
      address: GLOBAL_ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: "createJob",
      args: [
        (provider || zeroAddress) as `0x${string}`,
        evalAddr as `0x${string}`,
        paymentToken as `0x${string}`,
        expiredAt,
        description,
        hook as `0x${string}`,
      ],
    });
    === End of mainnet launch block === */
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.includes("@")) return;
    // TODO: POST to your waitlist backend / Airtable / Notion API here
    console.log("[WAITLIST] email submitted:", waitlistEmail);
    setWaitlistSubmitted(true);
  };

  const isValid =
    isAddress(paymentToken) &&
    (evaluatorSelf || isAddress(evaluator)) &&
    description.length > 0;

  if (!isConnected) {
    return (
      <div className="w-full min-h-[calc(100vh-72px)] flex items-center justify-center p-8 bg-[#030303] text-[#F4F4F4]">
        <div className="border border-[#F4F4F4] p-12 max-w-lg text-center">
          <div className="font-mono text-xs uppercase mb-4 text-[#888]">[ SYSTEM ERROR ]</div>
          <h2 className="font-sans font-black text-4xl uppercase mb-6">NO WALLET DETECTED</h2>
          <p className="font-mono text-sm uppercase text-[#888] mb-8">
            CONNECTION REQUIRED TO ALLOCATE FUNDS AND DEPLOY ESCROW.
          </p>
          <div className="border border-[#F4F4F4] p-4 text-xs font-mono inline-block">
            PLEASE USE NAVIGATION BAR TO CONNECT
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 py-10 min-h-screen text-[#F4F4F4]">
      <div className="mb-12 border-b border-[#F4F4F4] pb-8">
        <h1 className="font-sans font-black text-5xl uppercase tracking-tighter text-[#F4F4F4] mb-2">DEPLOY ESCROW</h1>
        <p className="font-mono text-sm uppercase text-[#888]">
          INITIALIZE A TRIPARTITE CONTRACT: CLIENT {'->'} PROVIDER {'->'} EVALUATOR
        </p>
      </div>

      {/* ═══════ Payment Token Selection ═══════ */}
      <div className="border border-[#F4F4F4] p-8 mb-8 relative">
        <div className="absolute top-0 left-0 bg-[#F4F4F4] text-[#030303] font-mono font-bold text-xs uppercase px-3 py-1">
          STEP_01
        </div>
        
        <div className="mt-4 mb-6">
          <h2 className="font-sans font-black text-2xl uppercase">SELECT COLLATERAL TOKEN</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Option: Native Token */}
          <button
            onClick={() => setPaymentToken(NATIVE_TOKEN_ADDRESS)}
            className={`p-6 border text-left transition-none flex flex-col justify-between min-h-[140px] relative ${
              !isCustomToken
                ? "border-[#00FF00] bg-[#00FF00]/10 text-[#F4F4F4]"
                : "border-[#333] hover:border-[#F4F4F4] text-[#888] hover:text-[#F4F4F4]"
            }`}
          >
            <div>
              <p className="font-mono font-bold text-lg uppercase mb-2">
                $8183 NATIVE
              </p>
              <p className="font-mono text-xs uppercase opacity-80">
                RECOMMENDED: 0% PLATFORM FEE
              </p>
            </div>
            {!isCustomToken && (
              <div className="absolute top-6 right-6 font-mono text-xs font-bold text-[#00FF00]">
                [ SELECTED ]
              </div>
            )}
          </button>

          {/* Option: Custom Token */}
          <button
            onClick={() => {
              setCustomTokenInput("");
              setPaymentToken("");
            }}
            className={`p-6 border text-left transition-none flex flex-col justify-between min-h-[140px] relative ${
              isCustomToken
                ? "border-[#F4F4F4] bg-white/5 text-[#F4F4F4]"
                : "border-[#333] hover:border-[#F4F4F4] text-[#888] hover:text-[#F4F4F4]"
            }`}
          >
            <div>
              <p className="font-mono font-bold text-lg uppercase mb-2">
                CUSTOM ERC-20
              </p>
              <p className="font-mono text-xs uppercase opacity-80">
                USDC, WETH, OR OTHER (2% FEE)
              </p>
            </div>
            {isCustomToken && (
              <div className="absolute top-6 right-6 font-mono text-xs font-bold text-[#F4F4F4]">
                [ SELECTED ]
              </div>
            )}
          </button>
        </div>

        {/* Custom Token Input Field */}
        {isCustomToken && (
          <div className="border border-[#F4F4F4] p-6 bg-white/5">
            <label className="block font-mono text-xs uppercase text-[#888] mb-2">ERC-20 CONTRACT ADDRESS</label>
            <input
              type="text"
              value={customTokenInput}
              onChange={(e) => {
                setCustomTokenInput(e.target.value);
                setPaymentToken(e.target.value);
              }}
              placeholder="0x..."
              className="w-full bg-transparent border-b border-[#F4F4F4] font-mono text-lg text-[#F4F4F4] p-2 outline-none focus:border-[#FF0033] transition-colors"
            />
            
            {customTokenName && (
              <div className="mt-4 flex items-center gap-4 bg-[#030303] border border-[#333] p-4">
                <div className="font-mono text-xs uppercase text-[#888]">
                  TOKEN DETECTED:
                </div>
                <div>
                  <p className="font-mono text-sm font-bold text-[#F4F4F4] uppercase">{customTokenName as string}</p>
                  <p className="font-mono text-xs text-[#00FF00] uppercase mt-1">SYMBOL: {customTokenSymbol as string}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════ Job Details ═══════ */}
      <div className="border border-[#F4F4F4] p-8 mb-8 relative">
        <div className="absolute top-0 left-0 bg-[#F4F4F4] text-[#030303] font-mono font-bold text-xs uppercase px-3 py-1">
          STEP_02
        </div>
        
        <div className="mt-4 mb-8">
          <h2 className="font-sans font-black text-2xl uppercase">EXECUTION PARAMETERS</h2>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Provider */}
            <div>
              <label className="block font-mono text-xs uppercase text-[#888] mb-2">
                PROVIDER IDENTIFIER <span className="opacity-50">(OPTIONAL)</span>
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="0x..."
                className="w-full bg-transparent border border-[#333] font-mono text-sm text-[#F4F4F4] p-4 outline-none focus:border-[#F4F4F4] hover:border-[#888] transition-colors"
              />
              <p className="font-mono text-[0.65rem] uppercase text-[#555] mt-2">ASSIGN SPECIFIC ADDRESS OR LEAVE BLANK FOR PUBLIC MARKETPLACE.</p>
            </div>

            {/* Evaluator */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-mono text-xs uppercase text-[#888]">
                  EVALUATOR/ORACLE
                </label>
                <button
                  type="button"
                  onClick={() => setEvaluatorSelf(!evaluatorSelf)}
                  className={`font-mono text-[0.65rem] font-bold uppercase border px-2 py-1 transition-none ${
                    evaluatorSelf ? "bg-[#F4F4F4] text-[#030303] border-[#F4F4F4]" : "text-[#888] border-[#333] hover:text-[#F4F4F4] hover:border-[#F4F4F4]"
                  }`}
                >
                  [ {evaluatorSelf ? "SELF-EVALUATING" : "ASSIGN_SELF"} ]
                </button>
              </div>
              <input
                type="text"
                value={evaluatorSelf ? address || "" : evaluator}
                disabled={evaluatorSelf}
                onChange={(e) => setEvaluator(e.target.value)}
                placeholder="0x..."
                className={`w-full bg-transparent border font-mono text-sm p-4 outline-none transition-colors ${
                  evaluatorSelf ? "border-[#333] text-[#555] cursor-not-allowed" : "border-[#333] text-[#F4F4F4] focus:border-[#F4F4F4] hover:border-[#888]"
                }`}
              />
              <p className="font-mono text-[0.65rem] uppercase text-[#555] mt-2">RESPONSIBLE FOR VALIDATING EXECUTION AND TRIGGERING SETTLEMENT.</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-xs uppercase text-[#888] mb-2">MANIFEST/DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="DEFINE SCOPE, REQUIREMENTS, DELIVERABLES..."
              className="w-full bg-transparent border border-[#333] font-mono text-sm text-[#F4F4F4] p-4 outline-none focus:border-[#F4F4F4] hover:border-[#888] transition-colors resize-y"
            />
          </div>

          {/* Expiry + Hook */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[#333]">
            <div>
              <label className="block font-mono text-xs uppercase text-[#888] mb-2">TIMEOUT PERIOD</label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full bg-[#030303] text-[#F4F4F4] border border-[#333] font-mono text-sm p-4 outline-none focus:border-[#F4F4F4] hover:border-[#888] appearance-none"
              >
                <option value="1">24 HOURS</option>
                <option value="3">72 HOURS</option>
                <option value="7">168 HOURS (7 DAYS)</option>
                <option value="14">336 HOURS (14 DAYS)</option>
                <option value="30">720 HOURS (30 DAYS)</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs uppercase text-[#888] mb-2">
                CUSTOM HOOK <span className="opacity-50">(ADVANCED)</span>
              </label>
              <input
                type="text"
                value={hookAddress}
                onChange={(e) => setHookAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-transparent border border-[#333] font-mono text-sm text-[#F4F4F4] p-4 outline-none focus:border-[#F4F4F4] hover:border-[#888] transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ Submit Actions ═══════ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#F4F4F4] p-8">
        <p className="font-mono text-xs uppercase text-[#888] max-w-sm">
          REVIEW ALL PARAMETERS BEFORE DEPLOYMENT. ONCE DEPLOYED, STATE CANNOT BE MUTATED. GAS SPEND REQUIRED.
        </p>
        <button
          onClick={handleCreateJob}
          disabled={isCreating || isCreateConfirming}
          className="brutal-btn primary w-full sm:w-auto h-auto px-12 py-4 disabled:opacity-50"
        >
          {isCreating
            ? "[ SIGNING_TXN ]"
            : isCreateConfirming
            ? "[ CONFIRMING_ONCHAIN ]"
            : "[ INITIATE_DEPLOYMENT ]"}
        </button>
      </div>

      {createError && (
        <div className="mt-4 p-4 border border-[#FF0033] bg-[#FF0033]/5 text-[#FF0033] font-mono text-xs uppercase">
          ERROR: {createError.message.split("\n")[0]}
        </div>
      )}

      {createSuccess && (
        <div className="mt-4 p-8 border border-[#00FF00] bg-[#00FF00]/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-mono text-lg font-bold text-[#00FF00] uppercase mb-1">DEPLOYMENT_SUCCESS</p>
            <p className="font-mono text-xs text-[#888] uppercase">TXN LOGGED. PROCEED TO FUND CONTRACT ESCROW.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="brutal-btn px-6 py-2 border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00] hover:text-[#030303]"
          >
            [ VIEW_REGISTRY ]
          </button>
        </div>
      )}
    </div>

    {/* ═══════════════════════════════════════════════════ */}
    {/* CLOSED BETA WAITLIST MODAL                        */}
    {/* ═══════════════════════════════════════════════════ */}
    {showWaitlist && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#030303]/85 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) { setShowWaitlist(false); setWaitlistSubmitted(false); } }}
      >
        <div className="bg-[#030303] border border-[#F4F4F4] w-full max-w-lg relative shadow-[8px_8px_0_#F4F4F4] overflow-hidden">
          {/* Top label bar */}
          <div className="flex items-center justify-between bg-[#F4F4F4] text-[#030303] px-4 py-2">
            <span className="font-mono font-bold text-xs uppercase tracking-widest">[ CLOSED_BETA ]</span>
            <button
              onClick={() => { setShowWaitlist(false); setWaitlistSubmitted(false); }}
              className="font-mono text-xs font-bold text-[#030303] hover:text-[#FF0033] transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-8">
            {!waitlistSubmitted ? (
              <>
                {/* Icon + heading */}
                <div className="mb-6">
                  <div className="font-mono text-xs uppercase text-[#888] mb-3 tracking-widest">SYSTEM_STATUS: RESTRICTED</div>
                  <h2 className="font-sans font-black text-3xl sm:text-4xl uppercase tracking-tighter text-[#F4F4F4] leading-none mb-4">
                    MAINNET<br/>
                    <span className="text-[#FF0033]">NOT YET</span><br/>
                    LIVE
                  </h2>
                  <p className="font-mono text-sm uppercase text-[#888] leading-relaxed">
                    8183ESCROW IS CURRENTLY IN CLOSED BETA.
                    ON-CHAIN JOB DEPLOYMENT IS RESTRICTED TO
                    WHITELISTED ADDRESSES ONLY.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-[#333] my-6" />

                {/* What you get */}
                <div className="mb-6 space-y-2">
                  {[
                    "EARLY ACCESS TO MAINNET LAUNCH",
                    "PRIORITY PROVIDER WHITELIST SLOT",
                    "BETA TESTER BADGE ON-CHAIN",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 font-mono text-xs uppercase text-[#888]">
                      <span className="text-[#00FF00] font-bold flex-shrink-0">▸</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Email form */}
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#888] mb-2 tracking-widest">
                      WALLET EMAIL / NOTIFICATION ADDRESS
                    </label>
                    <input
                      ref={emailRef}
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="agent@protocol.xyz"
                      required
                      className="w-full bg-transparent border border-[#333] focus:border-[#F4F4F4] font-mono text-sm text-[#F4F4F4] px-4 py-3 outline-none transition-colors placeholder:text-[#444]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!waitlistEmail.includes("@")}
                    className="w-full bg-[#F4F4F4] text-[#030303] font-sans font-black text-sm uppercase px-6 py-4 hover:bg-transparent hover:text-[#F4F4F4] hover:border hover:border-[#F4F4F4] transition-none disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    [ REQUEST_EARLY_ACCESS ]
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowWaitlist(false); }}
                    className="w-full font-mono text-xs uppercase text-[#555] hover:text-[#888] py-2 text-center transition-colors"
                  >
                    DISMISS
                  </button>
                </form>
              </>
            ) : (
              /* Success state */
              <div className="py-8 text-center">
                <div className="font-mono text-4xl mb-4 text-[#00FF00]">✓</div>
                <h3 className="font-sans font-black text-2xl uppercase tracking-tighter text-[#F4F4F4] mb-3">
                  ACCESS REQUESTED
                </h3>
                <p className="font-mono text-sm uppercase text-[#888] mb-2">
                  YOU HAVE BEEN ADDED TO THE WAITLIST.
                </p>
                <p className="font-mono text-xs uppercase text-[#555] mb-8">
                  WE WILL NOTIFY YOU AT: <span className="text-[#F4F4F4]">{waitlistEmail}</span>
                </p>
                <div className="border border-[#F4F4F4]/20 p-4 font-mono text-xs uppercase text-[#555] text-left">
                  <span className="text-[#00FF00]">█ </span>QUEUE POSITION CONFIRMED<br/>
                  <span className="text-[#00FF00]">█ </span>NOTIFICATION SET<br/>
                  <span className="text-[#555]">░ </span>AWAITING MAINNET LAUNCH
                </div>
                <button
                  onClick={() => { setShowWaitlist(false); setWaitlistSubmitted(false); setWaitlistEmail(""); }}
                  className="mt-6 font-mono text-xs font-bold uppercase border border-[#F4F4F4] px-8 py-3 hover:bg-[#F4F4F4] hover:text-[#030303] transition-none"
                >
                  [ CLOSE ]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
