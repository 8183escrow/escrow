"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

export const SOLANA_APP_NAME = "Solana Agent Escrow";
export const SOLANA_NETWORK = WalletAdapterNetwork.Mainnet;
export const SOLANA_NETWORK_NAME = "mainnet-beta";
export const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK_NAME);
