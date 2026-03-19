"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/create-job", label: "Jobs" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/docs", label: "Docs" },
];

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#030303] text-[#F4F4F4] shadow-none border-b border-[#F4F4F4] tracking-tight">
      <div className="w-full px-5 sm:px-8 bg-[#030303] relative z-20">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="font-sans font-black text-xl uppercase tracking-tighter">
              ERC-8183 // ESCROW
            </span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center gap-8 font-mono text-xs font-bold uppercase">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors duration-0 ${
                  pathname === item.href
                    ? "bg-[#F4F4F4] text-[#030303] px-2 py-1"
                    : "hover:bg-white/10 px-2 py-1"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Action Row */}
          <div className="flex items-center gap-4">
            {/* Wallet */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== "loading";
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === "authenticated");

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="font-mono text-xs font-bold uppercase border border-[#F4F4F4] px-4 py-2 hover:bg-[#F4F4F4] hover:text-[#030303] transition-none"
                          >
                            [ CONNECT ]
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="font-mono text-[10px] md:text-xs font-bold uppercase border border-[#FF0033] text-[#FF0033] px-2 md:px-4 py-2 hover:bg-[#FF0033] hover:text-[#030303] transition-none"
                          >
                            [ BAD NETWORK ]
                          </button>
                        );
                      }

                      return (
                        <div className="flex gap-2">
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="hidden md:flex font-mono text-xs font-bold uppercase border border-[#F4F4F4] px-3 py-2 hover:bg-[#F4F4F4] hover:text-[#030303] transition-none items-center"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                }}
                                className="w-4 h-4 overflow-hidden mr-2"
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? "Chain icon"}
                                    src={chain.iconUrl}
                                    className="w-4 h-4 grayscale"
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </button>

                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="font-mono text-[10px] md:text-xs font-bold uppercase border border-[#F4F4F4] px-3 md:px-4 py-2 hover:bg-[#F4F4F4] hover:text-[#030303] transition-none flex items-center gap-2"
                          >
                            {account.displayName}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex flex-col justify-center items-center w-[30px] h-[30px] border border-[#F4F4F4] bg-[#030303]"
            >
              <span className={`block h-[2px] w-[14px] bg-[#F4F4F4] transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45 translate-y-[3px]' : '-translate-y-[3px]'}`} />
              <span className={`block h-[2px] w-[14px] bg-[#F4F4F4] transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`block h-[2px] w-[14px] bg-[#F4F4F4] transition-all duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45 -translate-y-[5px]' : 'translate-y-[3px]'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div className={`lg:hidden absolute top-[72px] left-0 w-full bg-[#030303] border-b border-[#F4F4F4] transition-all duration-300 ease-in-out origin-top ${isMobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'}`}>
        <nav className="flex flex-col font-mono text-sm font-bold uppercase">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-8 py-5 border-t border-[#333] transition-colors duration-0 ${
                pathname === item.href
                  ? "bg-[#F4F4F4] text-[#030303]"
                  : "hover:bg-white/10"
              }`}
            >
              [ {item.label} ]
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
