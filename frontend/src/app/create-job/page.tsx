"use client";

import { FormEvent, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  NETWORK_META_LABEL,
  PRODUCT_MODE,
  truncateSolanaAddress,
} from "@/lib/demoJobs";

const TOKEN_PRESETS = [
  { id: "usdc", label: "USDC", note: "Stable settlement lane" },
  { id: "jup", label: "JUP", note: "Liquidity incentives" },
  { id: "bonk", label: "BONK", note: "Community activation" },
  { id: "custom", label: "Custom mint", note: "Bring your own asset rail" },
] as const;

export default function CreateJobPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [paymentToken, setPaymentToken] = useState<string>("usdc");
  const [customMint, setCustomMint] = useState("");
  const [providerSignal, setProviderSignal] = useState("");
  const [evaluatorMode, setEvaluatorMode] = useState("client");
  const [description, setDescription] = useState("");
  const [expiryWindow, setExpiryWindow] = useState("72");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const selectedToken =
    TOKEN_PRESETS.find((token) => token.id === paymentToken) ?? TOKEN_PRESETS[0];
  const walletLabel = publicKey
    ? truncateSolanaAddress(publicKey.toBase58(), 8, 8)
    : "NO_SESSION";

  const openWaitlist = () => {
    setShowWaitlist(true);
    window.setTimeout(() => emailRef.current?.focus(), 80);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!notificationEmail.includes("@")) return;
    setSubmitted(true);
  };

  if (!connected) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] w-full items-center justify-center bg-[#030303] p-8 text-[#F4F4F4]">
        <div className="max-w-lg border border-[#F4F4F4] p-12 text-center">
          <div className="mb-4 font-mono text-xs uppercase text-[#888]">
            [ SESSION REQUIRED ]
          </div>
          <h2 className="mb-6 font-sans text-4xl font-black uppercase">
            CONNECT SOLANA FIRST
          </h2>
          <p className="mb-8 font-mono text-sm uppercase text-[#888]">
            Beta intake is mapped to a live wallet identity even though
            settlement actions are still gated behind the migration queue.
          </p>
          <button
            onClick={() => setVisible(true)}
            className="border border-[#14F195] bg-[#14F195] px-6 py-4 font-mono text-xs font-bold uppercase text-[#030303] transition-none hover:bg-transparent hover:text-[#14F195]"
          >
            [ CONNECT WALLET ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10 text-[#F4F4F4] sm:px-8">
        <div className="mb-12 border-b border-[#F4F4F4] pb-8">
          <h1 className="mb-2 font-sans text-5xl font-black uppercase tracking-tighter text-[#F4F4F4]">
            OPEN BETA INTAKE
          </h1>
          <p className="font-mono text-sm uppercase text-[#888]">
            Shape the mission now. Execution goes live after the Solana rail is
            unlocked.
          </p>
        </div>

        <div className="mb-8 grid gap-4 border border-[#F4F4F4] p-6 font-mono text-xs uppercase md:grid-cols-3">
          <div>
            <div className="mb-2 text-[#888]">Session wallet</div>
            <div className="text-[#F4F4F4]">{walletLabel}</div>
          </div>
          <div>
            <div className="mb-2 text-[#888]">Network</div>
            <div className="text-[#F4F4F4]">{NETWORK_META_LABEL}</div>
          </div>
          <div>
            <div className="mb-2 text-[#888]">Mode</div>
            <div className="text-[#F4F4F4]">{PRODUCT_MODE}</div>
          </div>
        </div>

        <div className="relative mb-8 border border-[#F4F4F4] p-8">
          <div className="absolute top-0 left-0 bg-[#F4F4F4] px-3 py-1 font-mono text-xs font-bold uppercase text-[#030303]">
            STEP_01
          </div>

          <div className="mt-4 mb-6">
            <h2 className="font-sans text-2xl font-black uppercase">
              Select settlement intent
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {TOKEN_PRESETS.map((token) => {
              const selected = paymentToken === token.id;
              return (
                <button
                  key={token.id}
                  onClick={() => setPaymentToken(token.id)}
                  className={`relative flex min-h-[140px] flex-col justify-between border p-6 text-left transition-none ${
                    selected
                      ? "border-[#14F195] bg-[#14F195]/10 text-[#F4F4F4]"
                      : "border-[#333] text-[#888] hover:border-[#F4F4F4] hover:text-[#F4F4F4]"
                  }`}
                >
                  <div>
                    <p className="mb-2 font-mono text-lg font-bold uppercase">
                      {token.label}
                    </p>
                    <p className="font-mono text-xs uppercase opacity-80">
                      {token.note}
                    </p>
                  </div>
                  {selected && (
                    <div className="absolute top-6 right-6 font-mono text-xs font-bold text-[#14F195]">
                      [ SELECTED ]
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {paymentToken === "custom" && (
            <div className="mt-6 border border-[#F4F4F4] bg-white/5 p-6">
              <label className="mb-2 block font-mono text-xs uppercase text-[#888]">
                Custom mint or treasury note
              </label>
              <input
                type="text"
                value={customMint}
                onChange={(event) => setCustomMint(event.target.value)}
                placeholder="Mint address or asset identifier"
                className="w-full border-b border-[#F4F4F4] bg-transparent p-2 font-mono text-lg text-[#F4F4F4] outline-none transition-colors focus:border-[#14F195]"
              />
            </div>
          )}
        </div>

        <div className="relative mb-8 border border-[#F4F4F4] p-8">
          <div className="absolute top-0 left-0 bg-[#F4F4F4] px-3 py-1 font-mono text-xs font-bold uppercase text-[#030303]">
            STEP_02
          </div>

          <div className="mt-4 mb-8">
            <h2 className="font-sans text-2xl font-black uppercase">
              Mission parameters
            </h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#888]">
                  Preferred operator or studio
                </label>
                <input
                  type="text"
                  value={providerSignal}
                  onChange={(event) => setProviderSignal(event.target.value)}
                  placeholder="Handle, studio name, or wallet note"
                  className="w-full border border-[#333] bg-transparent p-4 font-mono text-sm text-[#F4F4F4] outline-none transition-colors hover:border-[#888] focus:border-[#F4F4F4]"
                />
                <p className="mt-2 font-mono text-[0.65rem] uppercase text-[#555]">
                  Leave blank to source from the beta registry.
                </p>
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#888]">
                  Evaluator mode
                </label>
                <select
                  value={evaluatorMode}
                  onChange={(event) => setEvaluatorMode(event.target.value)}
                  className="w-full appearance-none border border-[#333] bg-[#030303] p-4 font-mono text-sm text-[#F4F4F4] outline-none transition-colors hover:border-[#888] focus:border-[#F4F4F4]"
                >
                  <option value="client">Client-led review</option>
                  <option value="ops">Ops reviewer</option>
                  <option value="hybrid">Hybrid sign-off</option>
                </select>
                <p className="mt-2 font-mono text-[0.65rem] uppercase text-[#555]">
                  Used to shape the beta review lane, not a live programmatic
                  rule yet.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs uppercase text-[#888]">
                Mission brief
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                placeholder="Describe deliverables, timeline pressure, review criteria, and launch context."
                className="w-full resize-y border border-[#333] bg-transparent p-4 font-mono text-sm text-[#F4F4F4] outline-none transition-colors hover:border-[#888] focus:border-[#F4F4F4]"
              />
            </div>

            <div className="grid grid-cols-1 gap-8 border-t border-[#333] pt-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#888]">
                  Review window
                </label>
                <select
                  value={expiryWindow}
                  onChange={(event) => setExpiryWindow(event.target.value)}
                  className="w-full appearance-none border border-[#333] bg-[#030303] p-4 font-mono text-sm text-[#F4F4F4] outline-none transition-colors hover:border-[#888] focus:border-[#F4F4F4]"
                >
                  <option value="24">24 hours</option>
                  <option value="72">72 hours</option>
                  <option value="168">7 days</option>
                  <option value="336">14 days</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#888]">
                  Intake contact
                </label>
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={(event) => setNotificationEmail(event.target.value)}
                  placeholder="ops@studio.xyz"
                  className="w-full border border-[#333] bg-transparent p-4 font-mono text-sm text-[#F4F4F4] outline-none transition-colors hover:border-[#888] focus:border-[#F4F4F4]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border border-[#F4F4F4] p-8 sm:flex-row">
          <p className="max-w-md font-mono text-xs uppercase text-[#888]">
            Submission opens a beta access request, not a live transaction. The
            queue uses your Solana wallet plus the intake brief to stage future
            execution.
          </p>
          <button
            onClick={openWaitlist}
            disabled={!description || !notificationEmail.includes("@")}
            className="brutal-btn primary h-auto w-full px-12 py-4 disabled:opacity-50 sm:w-auto"
          >
            [ REQUEST EXECUTION SLOT ]
          </button>
        </div>
      </div>

      {showWaitlist && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030303]/85 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowWaitlist(false);
              setSubmitted(false);
            }
          }}
        >
          <div className="relative w-full max-w-lg overflow-hidden border border-[#F4F4F4] bg-[#030303] shadow-[8px_8px_0_#F4F4F4]">
            <div className="flex items-center justify-between bg-[#F4F4F4] px-4 py-2 text-[#030303]">
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                [ BETA ACCESS ]
              </span>
              <button
                onClick={() => {
                  setShowWaitlist(false);
                  setSubmitted(false);
                }}
                className="font-mono text-xs font-bold text-[#030303] transition-colors hover:text-[#FF0033]"
              >
                ✕
              </button>
            </div>

            <div className="p-8">
              {!submitted ? (
                <>
                  <div className="mb-6">
                    <div className="mb-3 font-mono text-xs uppercase tracking-widest text-[#888]">
                      STATUS: CURATED REVIEW
                    </div>
                    <h2 className="mb-4 font-sans text-3xl font-black uppercase tracking-tighter text-[#F4F4F4] sm:text-4xl">
                      SLOT REQUEST
                      <br />
                      <span className="text-[#14F195]">QUEUED</span>
                    </h2>
                    <p className="font-mono text-sm uppercase leading-relaxed text-[#888]">
                      We use this intake to prioritize who gets access once the
                      Solana settlement rail exits preview.
                    </p>
                  </div>

                  <div className="my-6 border-t border-[#333]" />

                  <div className="mb-6 space-y-2">
                    {[
                      `Wallet session: ${walletLabel}`,
                      `Token lane: ${selectedToken.label}`,
                      `Review window: ${expiryWindow} hours`,
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 font-mono text-xs uppercase text-[#888]"
                      >
                        <span className="flex-shrink-0 font-bold text-[#14F195]">
                          ▸
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-[#888]">
                        Notification address
                      </label>
                      <input
                        ref={emailRef}
                        type="email"
                        value={notificationEmail}
                        onChange={(event) =>
                          setNotificationEmail(event.target.value)
                        }
                        placeholder="ops@studio.xyz"
                        required
                        className="w-full border border-[#333] bg-transparent px-4 py-3 font-mono text-sm text-[#F4F4F4] outline-none transition-colors placeholder:text-[#444] focus:border-[#F4F4F4]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!notificationEmail.includes("@")}
                      className="w-full bg-[#F4F4F4] px-6 py-4 font-sans text-sm font-black uppercase text-[#030303] transition-none hover:border hover:border-[#F4F4F4] hover:bg-transparent hover:text-[#F4F4F4] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      [ CONFIRM REQUEST ]
                    </button>
                  </form>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-4 font-mono text-4xl text-[#14F195]">✓</div>
                  <h3 className="mb-3 font-sans text-2xl font-black uppercase tracking-tighter text-[#F4F4F4]">
                    REQUEST LOCKED
                  </h3>
                  <p className="mb-2 font-mono text-sm uppercase text-[#888]">
                    You are in the beta queue.
                  </p>
                  <p className="mb-8 font-mono text-xs uppercase text-[#555]">
                    Updates will be routed to{" "}
                    <span className="text-[#F4F4F4]">{notificationEmail}</span>
                  </p>
                  <div className="border border-[#F4F4F4]/20 p-4 text-left font-mono text-xs uppercase text-[#555]">
                    <span className="text-[#14F195]">█ </span>Intake synced
                    <br />
                    <span className="text-[#14F195]">█ </span>Wallet recorded
                    <br />
                    <span className="text-[#555]">░ </span>Awaiting rail unlock
                  </div>
                  <button
                    onClick={() => {
                      setShowWaitlist(false);
                      setSubmitted(false);
                      setNotificationEmail("");
                    }}
                    className="mt-6 border border-[#F4F4F4] px-8 py-3 font-mono text-xs font-bold uppercase transition-none hover:bg-[#F4F4F4] hover:text-[#030303]"
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
