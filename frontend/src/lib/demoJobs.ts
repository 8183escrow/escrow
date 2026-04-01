export type DemoJobStatus =
  | "Open"
  | "Funded"
  | "Submitted"
  | "Completed"
  | "Rejected"
  | "Expired";

export interface DemoJob {
  id: string;
  jobId: string;
  title: string;
  description: string;
  status: DemoJobStatus;
  clientLabel: string;
  clientWallet: string;
  providerLabel: string;
  providerWallet: string | null;
  evaluatorLabel: string;
  evaluatorWallet: string;
  budget: string;
  payoutAmount: string | null;
  tokenSymbol: string;
  tokenDecimals: number;
  networkLabel: string;
  createdAt: string;
  expiresAt: string;
  deliverable: string | null;
  completionReason: string | null;
  rejectionReason: string | null;
  betaActions: string[];
}

export const BRAND_NAME = "Solana Agent Escrow";
export const BRAND_MARK = "SOLANA // AGENT ESCROW";
export const NETWORK_LABEL = "SOLANA MAINNET";
export const NETWORK_META_LABEL = "MAINNET-BETA";
export const PRODUCT_MODE = "READ_ONLY_BETA";

export const JOB_STATUS_FLOW: DemoJobStatus[] = [
  "Open",
  "Funded",
  "Submitted",
  "Completed",
];

export const DEMO_JOBS: DemoJob[] = [
  {
    id: "nebula-audit-01",
    jobId: "01",
    title: "Validator health audit for launch week",
    description:
      "Review validator routing, RPC failover, and incident runbooks for a high-traffic Solana launch. Deliver a concise operator brief with risk tiers and rollback notes.",
    status: "Open",
    clientLabel: "Orbital Labs",
    clientWallet: "8Yq9pShNeon4uQj3XQxLP8vPkF8L8H5Xw6s8m9Pz4QnK",
    providerLabel: "Unassigned",
    providerWallet: null,
    evaluatorLabel: "Mission Control",
    evaluatorWallet: "F6L2kUh4sEo4iQvD2N3zvPj8Dqz9J7UQ2nJtX2aY4b6M",
    budget: "275000000",
    payoutAmount: null,
    tokenSymbol: "USDC",
    tokenDecimals: 6,
    networkLabel: NETWORK_META_LABEL,
    createdAt: "2026-03-30T10:15:00.000Z",
    expiresAt: "2026-04-06T10:15:00.000Z",
    deliverable: null,
    completionReason: null,
    rejectionReason: null,
    betaActions: [
      "Request provider access",
      "Reserve intake slot",
      "Preview settlement routing",
    ],
  },
  {
    id: "gamma-creative-02",
    jobId: "02",
    title: "Launch visuals for ecosystem campaign",
    description:
      "Produce a fast-turn asset pack for a Solana ecosystem sprint: hero stills, launch posters, and social crops with a delivery checklist for design ops.",
    status: "Funded",
    clientLabel: "Helio Studio",
    clientWallet: "B7Qj9cUqN5WdYcE8pT3zFwM1gVv9Kp2Qn4Rj7sL1wXkE",
    providerLabel: "Northline Motion",
    providerWallet: "3bxs4T5W9FpM3R2Qv8JsP5KqD4N7XrY1Zc6HtLm8QaUd",
    evaluatorLabel: "Helio Ops",
    evaluatorWallet: "C8vN2sJq4FpR7uL1Xw3Kz9DyM5QpHt6Vr2YbW4mL8jNc",
    budget: "1200000000",
    payoutAmount: null,
    tokenSymbol: "JUP",
    tokenDecimals: 6,
    networkLabel: NETWORK_META_LABEL,
    createdAt: "2026-03-28T03:40:00.000Z",
    expiresAt: "2026-04-04T03:40:00.000Z",
    deliverable: null,
    completionReason: null,
    rejectionReason: null,
    betaActions: [
      "Watch beta milestone flow",
      "Review provider handoff",
      "Enable notifications",
    ],
  },
  {
    id: "atlas-routing-03",
    jobId: "03",
    title: "Liquidity routing intelligence brief",
    description:
      "Map execution venues, quote slippage windows, and treasury routing notes for a Solana-native automation stack. Include operator commentary and action thresholds.",
    status: "Completed",
    clientLabel: "Atlas Treasury",
    clientWallet: "6Hj3XvN5mQpR9TzL2wYb7FpK4JdS8uCn1Ve4rQaM5tDu",
    providerLabel: "Driftline Research",
    providerWallet: "9Lp2WfN7sQrM4XyK6vTc1ZbH8JdP3uEe5Rw1mQaV9kFs",
    evaluatorLabel: "Atlas Finance",
    evaluatorWallet: "5QvD4N8yRj3uLs2Xp7WtHm6Kc9ZbP1Eo4VaY2nMq8dTf",
    budget: "875000000",
    payoutAmount: "840000000",
    tokenSymbol: "USDC",
    tokenDecimals: 6,
    networkLabel: NETWORK_META_LABEL,
    createdAt: "2026-03-19T16:20:00.000Z",
    expiresAt: "2026-03-26T16:20:00.000Z",
    deliverable: "ar://atlas-routing-brief-v3",
    completionReason:
      "Approved for clarity, execution discipline, and launch-readiness.",
    rejectionReason: null,
    betaActions: [
      "Open delivery archive",
      "Replay settlement summary",
      "Share operator notes",
    ],
  },
];

export function getJobById(id: string) {
  return DEMO_JOBS.find((job) => job.id === id);
}

export function formatTokenAmount(value: string, decimals: number) {
  const raw = value.replace(/^0+/, "") || "0";

  if (decimals === 0) {
    return raw;
  }

  if (raw.length <= decimals) {
    const fraction = raw.padStart(decimals, "0").replace(/0+$/, "");
    return fraction ? `0.${fraction}` : "0";
  }

  const whole = raw.slice(0, raw.length - decimals);
  const fraction = raw.slice(raw.length - decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export function truncateSolanaAddress(address: string, start = 4, end = 4) {
  if (address.length <= start + end + 3) {
    return address;
  }

  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatDisplayDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
