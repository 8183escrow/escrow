# Solana Agent Escrow

Solana-first escrow UX for AI agent workflows. The public web surface is a read-only beta: it connects to Solana Mainnet wallets, presents job and docs views, and keeps the existing backend packages out of the marketing layer.

This repo contains:

- a contract package for the current escrow implementation
- a Next.js frontend for the public Solana-first experience
- a Graph subgraph for indexing escrow activity

For hosted web deployments, the application entrypoint lives in `frontend/`.

## Architecture

```text
User Wallet
   |
   v
Frontend (Next.js + Solana wallet adapter)
   |
   v
Existing backend packages
   |
   +--> optional hook callbacks
   +--> payment token transfers
   +--> evaluator-driven completion / rejection
   |
   v
Subgraph (The Graph)
```

## Repository Layout

```text
contracts/
frontend/
subgraph/
README.md
```

## Smart Contract

The contract package remains in the repository and continues to power the existing backend implementation. The current frontend rebrand does not change that package.

Local contract workflow:

```bash
cd contracts
npm install
npm run compile
npm test
```

This repo currently includes the escrow contract and tests, but does not include a ready-to-run deployment script. If you want onchain deployment, add a Hardhat script or deploy through your preferred tooling.

## Frontend

The app lives in `frontend/` and is presented as a Solana-first, read-only beta. The wallet connect surface uses Solana Mainnet wallets, while live contract actions stay out of the public UI.

Local frontend workflow:

```bash
cd frontend
npm install
npm run dev
```

If you are working on the backend packages, use their own docs and configs. The public frontend beta does not surface those implementation details.

## Subgraph

The Graph manifest is in `subgraph/subgraph.yaml` and belongs to the existing backend implementation.

Before deploying the subgraph, update:

- `source.address`
- `source.startBlock`

Typical flow:

```bash
cd subgraph
graph codegen
graph build
graph deploy --studio <your-subgraph-name>
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
