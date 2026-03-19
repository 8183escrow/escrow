"use client";

if (typeof window === "undefined") {
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };
}

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "wagmi/chains";
import { http, createStorage, cookieStorage } from "wagmi";

/**
 * 8183Escrow — Wagmi + RainbowKit Configuration
 *
 * Configured for Base mainnet.
 * Uses public RPC endpoints — replace with Alchemy/Infura for production.
 */
export const config = getDefaultConfig({
  appName: "8183Escrow",
  projectId:
    process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  ssr: false,
});
