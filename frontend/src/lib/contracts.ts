/**
 * 8183Escrow — Contract ABIs & Addresses
 *
 * Contains the ABIs and deployed addresses for:
 * - TokenJobFactory: Deploys escrow instances
 * - ERC8183Escrow: Per-token escrow for AI agent jobs
 * - ERC20: Standard ERC-20 for token info
 */

// ═══════════════════════════ Addresses ═════════════════════════════

/** Replace with your deployed Global Escrow address on Base */
export const GLOBAL_ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_GLOBAL_ESCROW_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

/** Replace with your configured Native Token address (0% fee) */
export const NATIVE_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_NATIVE_TOKEN_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

/** Subgraph endpoint */
export const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  "https://api.studio.thegraph.com/query/YOUR_ID/8183escrow/version/latest";

// ═══════════════════════════ Escrow ABI ════════════════════════════

export const ESCROW_ABI = [
  {
    inputs: [
      { name: "provider", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "paymentToken", type: "address" },
      { name: "expiredAt", type: "uint256" },
      { name: "description", type: "string" },
      { name: "hook", type: "address" },
    ],
    name: "createJob",
    outputs: [{ name: "jobId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "provider", type: "address" },
      { name: "optParams", type: "bytes" },
    ],
    name: "setProvider",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    name: "setBudget",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "expectedBudget", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    name: "fund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "deliverable", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    name: "submit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reason", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    name: "complete",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reason", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    name: "reject",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "jobId", type: "uint256" }],
    name: "claimRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "jobId", type: "uint256" }],
    name: "getJob",
    outputs: [
      { name: "client", type: "address" },
      { name: "provider", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "hook", type: "address" },
      { name: "paymentToken", type: "address" },
      { name: "budget", type: "uint256" },
      { name: "expiredAt", type: "uint256" },
      { name: "description", type: "string" },
      { name: "deliverable", type: "bytes32" },
      { name: "status", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nativeToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextJobId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeBps",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "jobId", type: "uint256" },
      { indexed: true, name: "client", type: "address" },
      { indexed: false, name: "provider", type: "address" },
      { indexed: false, name: "evaluator", type: "address" },
      { indexed: false, name: "paymentToken", type: "address" },
      { indexed: false, name: "expiredAt", type: "uint256" },
    ],
    name: "JobCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "jobId", type: "uint256" },
      { indexed: true, name: "client", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "JobFunded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "jobId", type: "uint256" },
      { indexed: true, name: "provider", type: "address" },
      { indexed: false, name: "deliverable", type: "bytes32" },
    ],
    name: "JobSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "jobId", type: "uint256" },
      { indexed: true, name: "evaluator", type: "address" },
      { indexed: false, name: "reason", type: "bytes32" },
    ],
    name: "JobCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "jobId", type: "uint256" },
      { indexed: true, name: "rejector", type: "address" },
      { indexed: false, name: "reason", type: "bytes32" },
    ],
    name: "JobRejected",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "jobId", type: "uint256" }],
    name: "JobExpired",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "jobId", type: "uint256" },
      { indexed: true, name: "provider", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "PaymentReleased",
    type: "event",
  },
] as const;

// ═══════════════════════════ ERC-20 ABI (minimal) ══════════════════

export const ERC20_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ═══════════════════════════ Job Status ════════════════════════════

export const JOB_STATUSES = [
  "Open",
  "Funded",
  "Submitted",
  "Completed",
  "Rejected",
  "Expired",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const STATUS_COLORS: Record<JobStatus, string> = {
  Open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Funded: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Submitted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  Expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// ═══════════════════════════ Quick Templates ═══════════════════════

export const JOB_TEMPLATES = [
  {
    name: "🎨 Image Generation",
    description:
      "Generate a set of AI images based on provided prompts. Deliverable: ZIP file with images + metadata JSON. Quality: 1024x1024, photorealistic.",
    category: "Creative",
  },
  {
    name: "🔍 Smart Contract Audit",
    description:
      "Perform a comprehensive security audit of the provided Solidity smart contracts. Deliverable: Detailed report with findings, severity levels, and recommended fixes.",
    category: "Security",
  },
  {
    name: "📈 Trading Bot Strategy",
    description:
      "Develop and backtest a trading strategy for the specified token pair. Deliverable: Strategy code, backtest results, risk parameters, and deployment instructions.",
    category: "DeFi",
  },
  {
    name: "✍️ Content Creation",
    description:
      "Create high-quality content (articles, tweets, threads) for the specified topic and audience. Deliverable: Content assets in markdown format with engagement analytics.",
    category: "Marketing",
  },
  {
    name: "🤖 AI Agent Development",
    description:
      "Build a custom AI agent with specified capabilities and integrations. Deliverable: Agent source code, API documentation, and deployment guide.",
    category: "Development",
  },
  {
    name: "📊 Data Analysis",
    description:
      "Analyze on-chain or off-chain data and produce actionable insights. Deliverable: Analysis report with visualizations, methodology, and key findings.",
    category: "Analytics",
  },
] as const;
