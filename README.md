# ProofPay Rialo Prototype

ProofPay is a runnable prototype for proof-based programmable payments on a Rialo-inspired architecture. It demonstrates conditional escrow, GitHub proof verification, wallet-session simulation, and a mock Rialo adapter that returns transaction-shaped responses without touching real assets.

The current app is a Node.js/Express backend with a static HTML/CSS/JavaScript dashboard.

## Features

- ProofPay dashboard with Rialo program cards, escrow stats, adapter status, and audit details.
- Static UI using the logo at `public/static/logo/logo.png` for the sidebar brand and favicon.
- Collapsible desktop sidebar plus mobile sidebar overlay.
- Light and dark UI modes persisted in browser local storage.
- Simulated MetaMask and Phantom wallet sessions with in-browser RIALO ledger and faucet.
- Conditional escrow lifecycle: create, fund, verify GitHub PR proof, release, refund, and dispute.
- GitHub PR verifier using the public GitHub API, with optional token support for higher rate limits.
- Mock Rialo adapter that simulates escrow creation, funding, proof anchoring, release, and refund transactions.
- JSON-file persistence locally in `data/proofpay.json`; serverless deployments use temporary runtime storage unless `DATA_DIR` is configured.
- Node built-in tests for core adapter and verifier behavior.

## Requirements

- Node.js 18 or newer.
- npm.

## Quick Start

```bash
npm install
cp .env.example .env
npm start
```

Open the app:

```text
http://localhost:3000
```

On Windows PowerShell, create `.env` manually or run:

```powershell
Copy-Item .env.example .env
```

If PowerShell blocks `npm.ps1` because of ExecutionPolicy, use `npm.cmd` instead:

```powershell
npm.cmd run build
npm.cmd test
```

## Scripts

```bash
npm start
```

Starts the Express server from `src/server.js`.

```bash
npm run dev
```

Starts the server with Node watch mode.

```bash
npm run seed
```

Seeds local JSON data.

```bash
npm run build
```

Runs the prototype build check. This validates JavaScript syntax for the backend and browser entrypoint and verifies required static assets such as `public/static/logo/logo.png`.

```bash
npm test
```

Runs Node built-in tests under `test/`.

## User Flow

1. Connect a simulated wallet from the top bar.
2. Use Faucet to add 100 RIALO to the browser-session ledger.
3. Create a GitHub escrow from the Create Deal page.
4. Fund the escrow from the connected wallet.
5. Verify a GitHub PR merge proof.
6. Release funds after proof verification, or refund/dispute when needed.
7. Review proof hashes, transaction hashes, and event history in the Escrows or Proofs pages.

## API Routes

```http
GET  /api/system/health
GET  /api/system/rialo
GET  /api/system/summary
GET  /api/github/status
GET  /api/github/connect
GET  /api/github/callback
GET  /api/deals
POST /api/deals
GET  /api/deals/:id
POST /api/deals/:id/fund
POST /api/deals/:id/submit-proof
POST /api/deals/:id/verify/github
POST /api/deals/:id/release
POST /api/deals/:id/refund
POST /api/deals/:id/dispute
```

## GitHub Verification

The verifier checks:

- Repository owner.
- Repository name.
- Pull request number.
- Whether the PR is merged.
- Whether it was merged before the escrow deadline.
- Optional expected author.

Set `GITHUB_TOKEN` in `.env` to increase GitHub API rate limits:

```text
GITHUB_TOKEN=your_token_here
```

For private repository production flows, configure GitHub OAuth/App values:

```text
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_APP_SLUG=your_app_slug
PUBLIC_BASE_URL=http://localhost:3000
```

The UI currently simulates the private-repo GitHub App flow unless OAuth is configured.

## Rialo Adapter Status

The active adapter is `MockRialoAdapter` in `src/adapters/rialoAdapter.js`. It is intentionally mocked and simulates:

- Escrow account creation.
- Funding transaction hash.
- Proof-hash anchoring transaction hash.
- Release transaction hash.
- Refund transaction hash.

The mock adapter does not display or require a default RPC URL. If a real Rialo development endpoint becomes available, provide it through:

```text
RIALO_RPC_URL=your_endpoint_here
```

Recommended production integration path:

```text
Node.js API -> Rialo Rust microservice -> rialo-cdk -> Rialo devnet
```

## Vercel / Serverless Storage

Vercel serverless functions cannot write to the deployed `/var/task` bundle. The app therefore detects serverless runtime and writes the JSON demo store to the runtime temp directory by default, which is `/tmp/proofpay-rialo` on Vercel. This fixes create/fund/proof actions for demos, but temp storage is ephemeral and can reset between cold starts, deployments, or function instances.

For production persistence, replace `src/storage/jsonStore.js` with a durable backend such as Vercel KV, Postgres, Supabase, Neon, Upstash Redis, or another database. You can also set `DATA_DIR` for local/self-hosted deployments where the filesystem is writable.

## Project Structure

```text
proofpay-rialo/
  data/
    proofpay.json              Local JSON persistence
  docs/
    ProofPay.md                Product and architecture document
    ProofPay-Test-Guide.md     Manual testing guide
  public/
    index.html                 Static app shell
    app.js                     Browser app logic
    styles.css                 Dashboard styling and themes
    static/logo/logo.png       Logo and favicon source
  scripts/
    build-check.js             Build/syntax/static asset checks
  src/
    adapters/rialoAdapter.js   Mock Rialo adapter
    routes/                    Express route modules
    storage/jsonStore.js       JSON store helpers
    verifiers/                 Proof verifiers
    server.js                  Express entrypoint
  test/
    *.test.js                  Node built-in tests
```

## Limitations

This is a prototype. It is not audited, not production-ready, and does not custody real assets. Use mock/devnet assets only.
