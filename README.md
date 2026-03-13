# 8183Escrow

Custom Token Agent Commerce Hub for ERC-8183 jobs on Base. This repo contains:

- a Solidity escrow implementation for AI-agent style work orders
- a Next.js frontend for creating and tracking jobs
- a Graph subgraph for indexing escrow activity

For hosted web deployments, the application entrypoint lives in `frontend/`.

## Architecture

```text
User Wallet
   |
   v
Frontend (Next.js + wagmi)
   |
   v
ERC8183Escrow (Base)
   |
   +--> optional hook callbacks
   +--> ERC-20 payment token transfers
   +--> evaluator-driven completion / rejection
   |
   v
Subgraph (The Graph)
```

## Repository Layout

```text
8183Escrow/
├── contracts/
│   ├── src/
│   │   ├── ERC8183Escrow.sol
│   │   ├── interfaces/
│   │   │   ├── IACPHook.sol
│   │   │   ├── IERC8183.sol
│   │   │   └── IReputationRegistry.sol
│   │   └── mocks/
│   ├── test/
│   │   └── ERC8183Escrow.test.js
│   ├── hardhat.config.js
│   └── package.json
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx
│   │   ├── create-job/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── docs/page.tsx
│   │   └── job/[id]/page.tsx
│   ├── src/components/
│   ├── src/hooks/
│   ├── src/lib/
│   └── package.json
├── subgraph/
│   ├── abis/ERC8183Escrow.json
│   ├── schema.graphql
│   ├── src/escrow.ts
│   └── subgraph.yaml
└── README.md
```

## Smart Contract

The contract entrypoint is `contracts/src/ERC8183Escrow.sol`.

Main properties:

- ERC-8183 style job lifecycle
- single ERC-20 payment token per deployed escrow
- optional hook support through `IACPHook`
- configurable treasury + fee basis points
- optional ERC-8004 reputation integration
- refund path preserved outside hooks

Local contract workflow:

```bash
cd contracts
npm install
npm run compile
npm test
```

This repo currently includes the escrow contract and tests, but does not include a ready-to-run deployment script. If you want onchain deployment, add a Hardhat script or deploy through your preferred tooling.

## Frontend

The app lives in `frontend/` and uses Next.js 15, React 19, wagmi, viem, and RainbowKit.

Local frontend workflow:

```bash
cd frontend
npm install
cat <<'EOF' > .env.local
NEXT_PUBLIC_GLOBAL_ESCROW_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_NATIVE_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/YOUR_ID/8183escrow/version/latest
EOF
npm run dev
```

Environment variables used by the frontend:

- `NEXT_PUBLIC_GLOBAL_ESCROW_ADDRESS`
- `NEXT_PUBLIC_NATIVE_TOKEN_ADDRESS`
- `NEXT_PUBLIC_SUBGRAPH_URL`

## Subgraph

The Graph manifest is in `subgraph/subgraph.yaml` and currently expects a single deployed escrow contract as the data source.

Before deploying the subgraph, update:

- `source.address`
- `source.startBlock`

Typical flow:

```bash
cd subgraph
graph codegen
graph build
graph deploy --studio 8183escrow
```

## Hook Extension Example

Use `IACPHook` when you want custom pre/post action logic.

```solidity
import {IACPHook} from "./interfaces/IACPHook.sol";

contract MyHook is IACPHook {
    address public immutable acp;

    modifier onlyACP() {
        require(msg.sender == acp, "Only ACP");
        _;
    }

    function beforeAction(
        uint256 jobId,
        bytes4 selector,
        bytes calldata data
    ) external onlyACP {}

    function afterAction(
        uint256 jobId,
        bytes4 selector,
        bytes calldata data
    ) external onlyACP {}
}
```

## Security Notes

- Evaluator authority is high once a job is submitted.
- There is no dispute resolution layer in this repo.
- `claimRefund` intentionally bypasses hooks.
- Hook execution is gas-capped to avoid unbounded callback behavior.

## License

MIT
