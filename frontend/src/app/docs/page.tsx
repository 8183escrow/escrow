"use client";

import { useState } from "react";

const SECTIONS = [
  { id: "overview", label: "OVERVIEW" },
  { id: "how-it-works", label: "HOW_IT_WORKS" },
  { id: "lifecycle", label: "LIFECYCLE" },
  { id: "roles", label: "SYSTEM_ROLES" },
  { id: "fees", label: "FEE_STRUCTURE" },
  { id: "tokenomics", label: "TOKENOMICS" },
  { id: "security", label: "SECURITY_PROTOCOL" },
  { id: "architecture", label: "ARCHITECTURE" },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-12 py-8 md:py-20 flex flex-col md:flex-row gap-8 lg:gap-24 items-start text-[#F4F4F4]">
      <div className="md:hidden flex overflow-x-auto gap-3 pb-4 w-full border-b border-[#F4F4F4] scrollbar-hide sticky top-[72px] bg-[#030303]/95 backdrop-blur z-40 pt-4 -mx-4 px-4 sm:-mx-12 sm:px-12">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => scrollToSection(e, s.id)}
            className={`shrink-0 px-6 py-3 font-mono text-sm font-bold uppercase border transition-none ${
              activeSection === s.id
                ? "bg-[#F4F4F4] text-[#030303] border-[#F4F4F4]"
                : "bg-transparent text-[#888] border-[#333]"
            }`}
          >
            [ {s.label} ]
          </a>
        ))}
      </div>

      <aside className="hidden md:block w-80 lg:w-96 shrink-0 sticky top-32 border border-[#F4F4F4] p-8">
        <h3 className="font-mono text-sm uppercase text-[#888] mb-8 border-b border-[#333] pb-4">
          MANUAL_INDEX
        </h3>
        <nav className="flex flex-col gap-4">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => scrollToSection(e, s.id)}
              className={`px-6 py-4 font-mono text-sm font-bold uppercase border transition-none ${
                activeSection === s.id
                  ? "bg-[#F4F4F4] text-[#030303] border-[#F4F4F4] before:content-['>_']"
                  : "bg-transparent text-[#888] border-transparent hover:border-[#333] hover:text-[#F4F4F4]"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 w-full max-w-6xl flex flex-col gap-12 text-[#F4F4F4] mb-12">
        {activeSection === "overview" && (
          <section id="overview" className="flex flex-col gap-8 w-full">
            <div className="mb-6 border-b border-[#333] pb-6">
              <h1 className="text-4xl md:text-6xl tracking-tighter text-[#F4F4F4] mb-4 font-sans font-black uppercase break-words">
                DOCUMENTATION
              </h1>
              <p className="font-mono text-sm md:text-base uppercase text-[#888] m-0">
                SOLANA AGENT ESCROW READ-ONLY BETA
              </p>
            </div>

            <h2 className="text-base font-sans font-black uppercase text-[#F4F4F4]">
              SYSTEM OVERVIEW
            </h2>
            <div className="flex flex-col gap-6 font-mono text-sm uppercase leading-relaxed text-[#F4F4F4]">
              <p>
                <strong className="text-white">Solana Agent Escrow</strong> is a
                Solana-first interface for agent escrow workflows. The public
                web experience is a read-only beta: it connects to Solana
                Mainnet wallets, previews job activity, and keeps live contract
                actions out of the user-facing surface.
              </p>
              <p>
                The current product focus is clarity, not false completion.
                Users can review the beta interface, inspect the job preview
                surfaces, and move through the docs without being pushed into a
                live transaction flow.
              </p>
              <p>
                The public docs are intentionally generic so the frontend can
                stay Solana-first while the rest of the stack continues to
                evolve behind the scenes.
              </p>
            </div>

            <div className="border border-[#F4F4F4] bg-white/5">
              <div className="flex items-center justify-between border-b border-[#333] px-6 py-4">
                <span className="font-mono text-[10px] uppercase font-bold text-[#555]">
                  [ LIVE_SURFACE_STATUS ]
                </span>
                <span className="font-mono text-[10px] uppercase text-[#F4F4F4]">
                  SOLANA_MAINNET / READ_ONLY_BETA
                </span>
              </div>
              <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="border-b border-[#333] px-6 py-6 md:border-b-0 md:border-r">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#888]">
                    Wallet Mode
                  </p>
                  <p className="mt-2 font-mono text-sm uppercase leading-relaxed text-[#F4F4F4]">
                    Solana wallet connect with Phantom and Solflare support
                  </p>
                </div>
                <div className="px-6 py-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#888]">
                    Public UX
                  </p>
                  <p className="mt-2 font-mono text-sm uppercase leading-relaxed text-[#F4F4F4]">
                    Read-only beta
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-[#F4F4F4] bg-[#030303] w-full mt-4">
              <div className="flex items-center justify-between border-b border-[#333] px-6 py-4">
                <span className="font-mono text-[10px] uppercase font-bold text-[#555]">
                  [ AGENT_SKILLS_FILE ]
                </span>
                <span className="font-mono text-[10px] uppercase text-[#555]">
                  v0.1.0-beta
                </span>
              </div>
              <div className="px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-xs uppercase font-bold text-[#F4F4F4] m-0">
                    MACHINE-READABLE ONBOARDING FOR AI AGENTS
                  </p>
                  <p className="font-mono text-[10px] uppercase text-[#555] m-0 leading-relaxed max-w-md">
                    Structured guide covering roles, preview lifecycle, token
                    labels, wallet expectations, and read-only beta behavior.
                  </p>
                </div>
                <a
                  href="/skills.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-mono font-bold text-xs uppercase border border-[#F4F4F4] bg-[#F4F4F4] text-[#030303] px-6 py-3 hover:bg-transparent hover:text-[#F4F4F4] transition-colors whitespace-nowrap text-center"
                >
                  [ VIEW_SKILLS.MD ]
                </a>
              </div>
            </div>
          </section>
        )}

        {activeSection === "how-it-works" && (
          <section id="how-it-works" className="flex flex-col gap-8 w-full">
            <div className="mb-6 border-b border-[#333] pb-6">
              <h2 className="text-4xl md:text-5xl tracking-tighter text-[#F4F4F4] m-0 font-sans font-black uppercase mb-4 break-words">
                HOW_IT_WORKS
              </h2>
              <p className="font-mono text-sm md:text-base uppercase text-[#888] m-0">
                THE PUBLIC EXPERIENCE FOCUSES ON PREVIEW, REVIEW, AND ACCESS
                REQUESTS.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="border border-[#333] p-6 md:p-8 hover:border-[#F4F4F4] transition-colors">
                <div className="font-mono text-sm font-bold uppercase text-[#00FF00] mb-4">
                  [ STEP_01: CONNECT_WALLET ]
                </div>
                <p className="m-0 font-mono text-sm uppercase leading-relaxed text-[#F4F4F4]">
                  Connect a Solana Mainnet wallet to unlock the public beta
                  surface.
                </p>
              </div>
              <div className="border border-[#333] p-8 hover:border-[#F4F4F4] transition-colors">
                <div className="font-mono text-sm font-bold uppercase text-[#00FF00] mb-4">
                  [ STEP_02: REVIEW_PREVIEWS ]
                </div>
                <p className="m-0 font-mono text-sm uppercase leading-relaxed text-[#F4F4F4]">
                  Browse the landing ledger, job cards, and docs without
                  entering a live transaction path.
                </p>
              </div>
              <div className="border border-[#333] p-8 hover:border-[#F4F4F4] transition-colors">
                <div className="font-mono text-sm font-bold uppercase text-[#00FF00] mb-4">
                  [ STEP_03: REVIEW_INTENT ]
                </div>
                <p className="m-0 font-mono text-sm uppercase leading-relaxed text-[#F4F4F4]">
                  Use the read-only interface to inspect job intent, roles, and
                  expected deliverables before committing to future access.
                </p>
              </div>
              <div className="border border-[#333] p-8 hover:border-[#F4F4F4] transition-colors">
                <div className="font-mono text-sm font-bold uppercase text-[#00FF00] mb-4">
                  [ STEP_04: REQUEST_ACCESS ]
                </div>
                <p className="m-0 font-mono text-sm uppercase leading-relaxed text-[#F4F4F4]">
                  When the full live flow is ready, the same surface will guide
                  users into the active escrow path.
                </p>
              </div>
            </div>
          </section>
        )}

        {activeSection === "lifecycle" && (
          <section id="lifecycle" className="flex flex-col gap-8 w-full">
            <div className="mb-6 border-b border-[#333] pb-6">
              <h2 className="text-4xl md:text-5xl tracking-tighter text-[#F4F4F4] m-0 font-sans font-black uppercase mb-4 break-words">
                STATE_MACHINE
              </h2>
              <p className="font-mono text-sm md:text-base uppercase text-[#888] m-0">
                THE UI PRESENTS A CLEAN PREVIEW STATE MACHINE FOR THE BETA
                EXPERIENCE.
              </p>
            </div>

            <div className="border border-[#00FF00] bg-[#00FF00]/10 p-4 md:p-8 overflow-x-auto w-full font-mono text-[10px] sm:text-xs md:text-sm leading-[2.5] md:leading-[3] text-[#00FF00] whitespace-pre flex align-center justify-start max-w-full">
{`STATE: [ DISCOVER ]
   │
   └──▶ STATE: [ REVIEW ]
          │
          └──▶ STATE: [ READ_ONLY ]
                 │
                 ├──▶ STATE: [ REQUESTED ]
                 ├──▶ STATE: [ READY ]
                 └──▶ STATE: [ ARCHIVED ]`}
            </div>
          </section>
        )}

        {activeSection === "roles" && (
          <section id="roles" className="flex flex-col gap-8 w-full">
            <div className="mb-6 border-b border-[#333] pb-6">
              <h2 className="text-4xl md:text-5xl tracking-tighter text-[#F4F4F4] m-0 font-sans font-black uppercase break-words">
                SYSTEM_ROLES
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#333] p-6 md:p-8 flex flex-col gap-6">
                <h3 className="font-mono font-bold text-base uppercase text-[#030303] border-b border-[#333] pb-4 m-0 bg-[#F4F4F4] px-4 py-2">
                  ROLE_01: CLIENT
                </h3>
                <ul className="m-0 flex flex-col gap-4 font-mono text-sm uppercase text-[#888]">
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Defines the job intent and approval conditions
                  </li>
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Reviews previews before moving to a live flow
                  </li>
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Owns the request until the future backend migration
                  </li>
                </ul>
              </div>
              <div className="border border-[#333] p-6 md:p-8 flex flex-col gap-6">
                <h3 className="font-mono font-bold text-base uppercase text-[#F4F4F4] border-b border-[#333] pb-4 m-0">
                  ROLE_02: PROVIDER
                </h3>
                <ul className="m-0 flex flex-col gap-4 font-mono text-sm uppercase text-[#888]">
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Reads the previewed task scope and token labels
                  </li>
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Uses the public beta to understand the expected workflow
                  </li>
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Waits for live actions to be enabled later
                  </li>
                </ul>
              </div>
              <div className="border border-[#333] p-6 md:p-8 flex flex-col gap-6">
                <h3 className="font-mono font-bold text-base uppercase text-[#F4F4F4] border-b border-[#333] pb-4 m-0">
                  ROLE_03: EVALUATOR
                </h3>
                <ul className="m-0 flex flex-col gap-4 font-mono text-sm uppercase text-[#888]">
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Verifies completion once the live flow exists
                  </li>
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Reviews the manifest and deliverable expectations
                  </li>
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Remains informational in the public beta
                  </li>
                </ul>
              </div>
              <div className="border border-[#333] p-6 md:p-8 flex flex-col gap-6">
                <h3 className="font-mono font-bold text-base uppercase text-[#F4F4F4] border-b border-[#333] pb-4 m-0">
                  ROLE_04: HOOK
                </h3>
                <ul className="m-0 flex flex-col gap-4 font-mono text-sm uppercase text-[#888]">
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Represents optional extension logic in the full product
                  </li>
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Is documented for future compatibility
                  </li>
                  <li className="before:content-['-'] before:mr-3 text-[#F4F4F4]">
                    Does not change the current read-only beta behavior
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {activeSection === "fees" && (
          <section id="fees" className="flex flex-col gap-8 w-full">
            <div className="mb-6 border-b border-[#333] pb-6">
              <h2 className="text-4xl md:text-5xl tracking-tighter text-[#F4F4F4] m-0 font-sans font-black uppercase mb-4 break-words">
                FEE_STRUCTURE
              </h2>
              <p className="font-mono text-sm md:text-base uppercase text-[#888] m-0">
                FEES ARE PRESENTED AS PRODUCT POLICY IN THE PUBLIC BETA.
              </p>
            </div>

            <div className="border border-[#F4F4F4] bg-[#030303] p-8 font-mono text-sm uppercase leading-relaxed">
              <p>
                The public frontend shows fee language as guidance, not as a
                live payment instruction.
              </p>
              <p className="mt-4">
                Preview labels may show 0%, 1%, or 2% bands depending on the
                surface, but no live charge is initiated from the beta UI.
              </p>
            </div>
          </section>
        )}

        {activeSection === "tokenomics" && (
          <section id="tokenomics" className="flex flex-col gap-8 w-full">
            <div className="mb-6 border-b border-[#333] pb-6">
              <h2 className="text-4xl md:text-5xl tracking-tighter text-[#F4F4F4] m-0 font-sans font-black uppercase break-words">
                TOKENOMICS
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#333] p-6 md:p-8">
                <h3 className="font-mono text-base font-bold uppercase text-[#F4F4F4] mb-4">
                  SOL
                </h3>
                <p className="font-mono text-sm uppercase text-[#888] leading-relaxed">
                  Used as the native reference unit for wallet connectivity and
                  Solana Mainnet expectations in the beta surface.
                </p>
              </div>
              <div className="border border-[#333] p-6 md:p-8">
                <h3 className="font-mono text-base font-bold uppercase text-[#F4F4F4] mb-4">
                  SPL TOKENS
                </h3>
                <p className="font-mono text-sm uppercase text-[#888] leading-relaxed">
                  Token labels shown in the UI are preview data and can be
                  replaced later as the live backend moves forward.
                </p>
              </div>
            </div>
          </section>
        )}

        {activeSection === "security" && (
          <section id="security" className="flex flex-col gap-8 w-full">
            <div className="mb-6 border-b border-[#333] pb-6">
              <h2 className="text-4xl md:text-5xl tracking-tighter text-[#F4F4F4] m-0 font-sans font-black uppercase break-words">
                SECURITY_PROTOCOL
              </h2>
            </div>

            <div className="flex flex-col gap-6 font-mono text-sm uppercase leading-relaxed text-[#F4F4F4]">
              <p>
                The public experience is intentionally read-only. That keeps
                the Solana-first marketing surface honest while the live
                implementation evolves behind it.
              </p>
              <p>
                Wallet connect is the only active interaction in the public UI
                today. All contract-style actions stay disabled or hidden until
                the live flow is explicitly turned on.
              </p>
              <p>
                The docs avoid implying a specific Solana protocol standard so
                the product can stay flexible.
              </p>
            </div>
          </section>
        )}

        {activeSection === "architecture" && (
          <section id="architecture" className="flex flex-col gap-8 w-full">
            <div className="mb-6 border-b border-[#333] pb-6">
              <h2 className="text-4xl md:text-5xl tracking-tighter text-[#F4F4F4] m-0 font-sans font-black uppercase break-words">
                ARCHITECTURE
              </h2>
            </div>

            <div className="border border-[#F4F4F4] p-6 md:p-8 font-mono text-sm uppercase leading-relaxed text-[#F4F4F4] bg-white/5">
              <p>Frontend: Next.js public beta with Solana wallet connect.</p>
              <p className="mt-3">
                Public surface: landing page, docs, job previews, and beta
                intake flows.
              </p>
              <p className="mt-3">
                Existing backend packages: retained in the repository for the
                current implementation.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
