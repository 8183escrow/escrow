"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  BRAND_MARK,
  NETWORK_META_LABEL,
  truncateSolanaAddress,
} from "@/lib/demoJobs";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/create-job", label: "Intake" },
  { href: "/dashboard", label: "Registry" },
  { href: "/docs", label: "Docs" },
];

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { connected, publicKey, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  const walletLabel = publicKey
    ? truncateSolanaAddress(publicKey.toBase58(), 6, 6)
    : "CONNECT";

  const handleConnect = () => setVisible(true);
  const handleDisconnect = () => {
    void disconnect();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#F4F4F4] bg-[#030303] text-[#F4F4F4] tracking-tight">
      <div className="relative z-20 w-full bg-[#030303] px-5 sm:px-8">
        <div className="flex h-[72px] items-center justify-between">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="font-sans text-lg font-black uppercase tracking-[-0.08em] sm:text-xl">
              {BRAND_MARK}
            </span>
          </Link>

          <nav className="hidden items-center gap-8 font-mono text-xs font-bold uppercase lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1 transition-colors duration-0 ${
                  pathname === item.href
                    ? "bg-[#F4F4F4] text-[#030303]"
                    : "hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden border border-[#333] px-3 py-2 font-mono text-[10px] font-bold uppercase text-[#888] md:flex">
              {NETWORK_META_LABEL}
            </div>

            {!connected ? (
              <button
                onClick={handleConnect}
                type="button"
                className="border border-[#F4F4F4] px-4 py-2 font-mono text-xs font-bold uppercase transition-none hover:bg-[#F4F4F4] hover:text-[#030303]"
              >
                [ CONNECT SOLANA ]
              </button>
            ) : (
              <div className="hidden gap-2 md:flex">
                <button
                  onClick={handleConnect}
                  type="button"
                  className="flex items-center gap-2 border border-[#F4F4F4] px-3 py-2 font-mono text-xs font-bold uppercase transition-none hover:bg-[#F4F4F4] hover:text-[#030303]"
                >
                  <span className="h-2 w-2 rounded-full bg-[#14F195] !rounded-full" />
                  {wallet?.adapter.name ?? "Solana Wallet"}
                  <span className="text-[#888]">{walletLabel}</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  type="button"
                  className="border border-[#333] px-3 py-2 font-mono text-xs font-bold uppercase text-[#888] transition-none hover:border-[#F4F4F4] hover:text-[#F4F4F4]"
                >
                  [ DISCONNECT ]
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-[30px] w-[30px] flex-col items-center justify-center border border-[#F4F4F4] bg-[#030303] lg:hidden"
            >
              <span
                className={`block h-[2px] w-[14px] bg-[#F4F4F4] transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? "translate-y-[3px] rotate-45" : "-translate-y-[3px]"
                }`}
              />
              <span
                className={`block h-[2px] w-[14px] bg-[#F4F4F4] transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-[2px] w-[14px] bg-[#F4F4F4] transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen
                    ? "-translate-y-[5px] -rotate-45"
                    : "translate-y-[3px]"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`absolute top-[72px] left-0 w-full origin-top border-b border-[#F4F4F4] bg-[#030303] transition-all duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen
            ? "scale-y-100 opacity-100"
            : "pointer-events-none scale-y-0 opacity-0"
        }`}
      >
        <div className="border-b border-[#333] px-8 py-4 font-mono text-[10px] uppercase text-[#888]">
          <div className="flex items-center justify-between">
            <span>Wallet</span>
            <span>{connected ? walletLabel : "Not Connected"}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Network</span>
            <span>{NETWORK_META_LABEL}</span>
          </div>
        </div>

        <nav className="flex flex-col font-mono text-sm font-bold uppercase">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`border-t border-[#333] px-8 py-5 transition-colors duration-0 ${
                pathname === item.href
                  ? "bg-[#F4F4F4] text-[#030303]"
                  : "hover:bg-white/10"
              }`}
            >
              [ {item.label} ]
            </Link>
          ))}
        </nav>

        <div className="flex gap-3 px-8 py-5">
          {!connected ? (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleConnect();
              }}
              className="w-full border border-[#F4F4F4] px-4 py-3 font-mono text-xs font-bold uppercase transition-none hover:bg-[#F4F4F4] hover:text-[#030303]"
            >
              [ CONNECT ]
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleConnect();
                }}
                className="w-full border border-[#F4F4F4] px-4 py-3 font-mono text-xs font-bold uppercase transition-none hover:bg-[#F4F4F4] hover:text-[#030303]"
              >
                [ SWITCH WALLET ]
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleDisconnect();
                }}
                className="w-full border border-[#333] px-4 py-3 font-mono text-xs font-bold uppercase text-[#888] transition-none hover:border-[#F4F4F4] hover:text-[#F4F4F4]"
              >
                [ DISCONNECT ]
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
