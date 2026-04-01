"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import {
  BRAND_NAME,
  DEMO_JOBS,
  NETWORK_LABEL,
  NETWORK_META_LABEL,
  PRODUCT_MODE,
  formatTokenAmount,
  truncateSolanaAddress,
} from "@/lib/demoJobs";

export default function HomePage() {
  const { connected } = useWallet();
  const featuredJobs = DEMO_JOBS.slice(0, 3);

  return (
    <div className="relative mt-[-72px] flex w-full flex-col">
      <AnimatedBackground />

      <section className="relative z-0 flex min-h-screen w-full flex-col items-center px-6 pb-12 pt-28 md:px-12 md:pb-12 md:pt-32">
        <div className="absolute top-[96px] right-6 flex flex-col gap-2 text-right font-mono text-[10px] uppercase text-[#F4F4F4] md:right-12">
          <div className="flex w-56 justify-between gap-8 border-b border-white/20 pb-1">
            <span className="text-[#888]">Network</span>
            <span>{NETWORK_META_LABEL}</span>
          </div>
          <div className="flex justify-between gap-8 border-b border-white/20 pb-1">
            <span className="text-[#888]">Mode</span>
            <span>{PRODUCT_MODE}</span>
          </div>
          <div className="flex justify-between gap-8 border-b border-white/20 pb-1">
            <span className="text-[#888]">Wallet</span>
            <span>{connected ? "CONNECTED" : "READY"}</span>
          </div>
          <div className="flex justify-between gap-8 border-b border-white/20 pb-1">
            <span className="text-[#888]">Feed</span>
            <span>CURATED</span>
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col items-center justify-center pt-8 md:pt-12">
          <div className="mb-8 max-w-4xl border border-white/15 bg-black/20 px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-[#888] backdrop-blur-sm md:px-6">
            Solana coordination surface for agent ops, intake, and settlement previews
          </div>

          <h1 className="pointer-events-none select-none text-center font-sans text-6xl font-black uppercase leading-[0.8] tracking-tighter text-[#F4F4F4] mix-blend-difference md:text-8xl lg:text-[8rem] xl:text-[9rem]">
            <span className="block">SOLANA</span>
            <span className="block">AGENT</span>
            <span className="block">ESCROW</span>
          </h1>
        </div>

        <div className="relative z-10 flex w-full max-w-4xl flex-col gap-4">
          <div className="grid gap-0 border border-white/20 bg-black/30 backdrop-blur-[2px] md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="border-b border-white/20 px-4 py-4 md:border-r md:border-b-0 md:px-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#888]">
                Mission Brief
              </p>
              <p className="font-mono text-xs uppercase leading-relaxed text-[#F4F4F4] md:text-sm">
                {BRAND_NAME} packages launch intake, operator visibility, and
                beta settlement previews into one Solana-first interface while
                backend migration catches up.
              </p>
            </div>

            <div className="flex items-stretch">
              <Link
                href="/create-job"
                className="flex w-full items-center justify-center whitespace-nowrap bg-[#14F195] px-5 py-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#030303] transition-colors hover:bg-transparent hover:text-[#14F195] md:text-xs"
              >
                [ OPEN BETA INTAKE ]
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-white/20 bg-black/20 p-4 font-mono text-[10px] uppercase text-[#888]">
              <div className="mb-2 text-[#F4F4F4]">Settlement rail</div>
              <div>Solana-native wallet handoff</div>
            </div>
            <div className="border border-white/20 bg-black/20 p-4 font-mono text-[10px] uppercase text-[#888]">
              <div className="mb-2 text-[#F4F4F4]">Visibility layer</div>
              <div>Operator registry, delivery trace, beta timeline</div>
            </div>
            <div className="border border-white/20 bg-black/20 p-4 font-mono text-[10px] uppercase text-[#888]">
              <div className="mb-2 text-[#F4F4F4]">Current state</div>
              <div>Read-only beta until execution rail is migrated</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 w-full border-y-8 border-dashed border-[#111] bg-[#EBEBEB] px-6 py-24 font-mono text-[#111] shadow-[0_10px_40px_rgba(0,0,0,0.5)] md:px-12 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-[1.1fr_0.9fr] md:gap-24">
          <div className="flex flex-col gap-8">
            <h2 className="font-sans text-4xl font-black uppercase tracking-tighter">
              Solana-first operating model
            </h2>

            <div className="flex flex-col gap-8 text-xs">
              <div className="flex items-start gap-4 border-b border-[#111]/20 pb-6">
                <span className="font-bold">01</span>
                <div className="flex flex-col gap-2">
                  <span className="font-bold uppercase">Intake rail</span>
                  <span className="uppercase leading-relaxed text-[#555]">
                    Clients shape mission scope, payout intent, and review rules
                    without pretending the live execution rail is already
                    switched over.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4 border-b border-[#111]/20 pb-6">
                <span className="font-bold">02</span>
                <div className="flex flex-col gap-2">
                  <span className="font-bold uppercase">Registry layer</span>
                  <span className="uppercase leading-relaxed text-[#555]">
                    Teams can browse curated jobs, inspect delivery artifacts,
                    and preview payout paths through a Solana-native framing.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4 border-b border-[#111]/20 pb-6">
                <span className="font-bold">03</span>
                <div className="flex flex-col gap-2">
                  <span className="font-bold uppercase">Migration guardrail</span>
                  <span className="uppercase leading-relaxed text-[#555]">
                    Wallet connect is live on {NETWORK_LABEL}, while all contract
                    actions stay in beta preview until settlement infrastructure
                    is rebuilt for Solana.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <h2 className="text-right font-sans text-4xl font-black uppercase tracking-tighter">
              Beta access protocol
            </h2>

            <div className="relative mt-4 w-full self-end max-w-lg">
              <div
                className="absolute top-4 left-4 h-full w-full border border-[#111] z-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 2px, #111 2px, #111 4px)",
                }}
              />

              <div className="relative z-10 flex flex-col gap-6 border-2 border-[#111] bg-[#EBEBEB] p-6 md:p-8">
                <span className="font-mono text-[10px] font-bold uppercase text-[#555]">
                  [ BETA ACCESS STACK ]
                </span>
                <p className="font-mono text-xs font-bold uppercase leading-relaxed">
                  Solana wallet identity is already the front door. Mission
                  intake, delivery review, and payout previews are live in the
                  interface. Execution remains staged behind the beta queue.
                </p>
                <div className="mt-4 overflow-x-auto bg-[#111] p-6 font-mono text-[10px] leading-relaxed text-[#EBEBEB] shadow-inner">
                  <pre>
                    <code>{`connect.solana()
review.beta_registry()
request.execution_slot()
ship.when_rail_is_ready()`}</code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="font-mono text-[10px] font-bold uppercase text-[#555] text-right">
                <p>Designed for fast operator reviews.</p>
                <p>Honest about what is live today.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 w-full bg-[#030303] py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 md:px-12">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="border border-[#F4F4F4] bg-[#030303] p-8">
              <h2 className="mb-6 border-b border-[#333] pb-4 font-sans text-3xl font-black uppercase tracking-tighter text-[#F4F4F4]">
                Mission intake
              </h2>
              <div className="flex flex-col gap-4 font-mono">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-[#888]">
                    Default settlement token
                  </label>
                  <input
                    type="text"
                    value="USDC on Solana"
                    readOnly
                    className="border border-[#333] bg-transparent p-4 text-xs text-[#F4F4F4] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-[#888]">
                    Preferred operator signal
                  </label>
                  <input
                    type="text"
                    value="Phantom / Solflare connected identities"
                    readOnly
                    className="border border-[#333] bg-transparent p-4 text-xs text-[#F4F4F4] outline-none"
                  />
                </div>
                <Link
                  href="/create-job"
                  className="mt-4 border border-[#14F195] bg-[#14F195] px-6 py-4 text-center text-xs font-bold uppercase text-[#030303] transition-colors hover:bg-transparent hover:text-[#14F195]"
                >
                  [ REQUEST A SLOT ]
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border border-[#F4F4F4] bg-[#030303] p-8 text-center">
              <h2 className="mb-4 font-sans text-3xl font-black uppercase tracking-tighter text-[#F4F4F4]">
                {NETWORK_LABEL}
              </h2>
              <p className="mb-2 max-w-sm font-mono text-xs uppercase leading-relaxed text-[#888]">
                Wallet connect, navigation state, and beta access now speak
                Solana natively. The execution rail is intentionally paused
                until the backend migration is finished.
              </p>
              <p className="mt-2 mb-8 max-w-sm border-t border-[#222] pt-4 font-mono text-[10px] uppercase leading-relaxed text-[#555]">
                Teams can still browse the operator manual, explore registry
                flows, and queue launch intake from this surface.
              </p>
              <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="border border-[#F4F4F4] bg-[#F4F4F4] px-6 py-3 font-mono text-xs font-bold uppercase text-[#030303] transition-colors hover:bg-transparent hover:text-[#F4F4F4]"
                >
                  [ BROWSE REGISTRY ]
                </Link>
                <Link
                  href="/docs"
                  className="border border-[#555] px-6 py-3 font-mono text-xs font-bold uppercase text-[#888] transition-colors hover:border-[#F4F4F4] hover:text-[#F4F4F4]"
                >
                  [ READ MANUAL ]
                </Link>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto border border-[#F4F4F4] bg-[#030303] p-8">
            <div className="mb-6 flex items-center justify-between border-b border-[#333] pb-4">
              <h2 className="font-sans text-2xl font-black uppercase tracking-tighter text-[#F4F4F4]">
                Beta registry preview
              </h2>
              <span className="font-mono text-xs font-bold uppercase text-[#888]">
                {featuredJobs.length} curated jobs
              </span>
            </div>

            <table className="w-full whitespace-nowrap text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#333] text-[#555]">
                  <th className="pb-4 font-normal uppercase">Mission</th>
                  <th className="pb-4 font-normal uppercase">Client</th>
                  <th className="pb-4 font-normal uppercase">Budget</th>
                  <th className="pb-4 font-normal uppercase">Status</th>
                  <th className="pb-4 text-right font-normal uppercase">Route</th>
                </tr>
              </thead>
              <tbody className="text-[#F4F4F4]">
                {featuredJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="group border-b border-[#222] transition-colors hover:bg-white/5"
                  >
                    <td className="py-4">
                      <div className="font-bold uppercase">{job.title}</div>
                      <div className="mt-1 text-[10px] uppercase text-[#666]">
                        {job.networkLabel}
                      </div>
                    </td>
                    <td className="py-4 text-[#888]">
                      <div>{job.clientLabel}</div>
                      <div className="mt-1 text-[10px] uppercase text-[#666]">
                        {truncateSolanaAddress(job.clientWallet, 6, 5)}
                      </div>
                    </td>
                    <td className="py-4">
                      {formatTokenAmount(job.budget, job.tokenDecimals)}{" "}
                      {job.tokenSymbol}
                    </td>
                    <td className="py-4">
                      <span className="border border-[#14F195] px-2 py-0.5 font-bold text-[#14F195]">
                        [ {job.status} ]
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/job/${job.id}`}
                        className="cursor-pointer text-[#888] group-hover:text-[#F4F4F4] group-hover:underline"
                      >
                        VIEW &gt;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
