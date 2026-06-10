# ProofPay Rialo Test Guide

## 1. What is ProofPay?

ProofPay is a DApp prototype for proof-based escrow payments.

Core idea:

```text
Lock funds first -> verify proof later -> release or refund
```

The simplest example:

```text
A client pays 100 RIALO to a developer if GitHub PR #42 is merged before the deadline.
```

ProofPay is not just a token transfer app. It is a payment workflow:

```text
Payer
  -> locks RIALO in escrow
  -> defines payment conditions
  -> verifier checks GitHub proof
  -> releases funds to the worker or refunds the payer
```

The current version is a prototype:

- Wallet, RIALO balance, faucet, and escrow transfers are simulated in the browser session.
- GitHub public PR verification calls the real GitHub API.
- The Rialo adapter is still a mock adapter, not a real Rialo devnet/mainnet transaction adapter.
- The GitHub App/OAuth production path has backend skeleton routes, but needs environment variables for a real GitHub connection.
- Logo and favicon use `public/static/logo/logo.png`.
- The UI supports light and dark themes, toggled by the sun/moon icon in the topbar.
- The desktop sidebar can collapse/expand; mobile uses the logo/Menu button to open the sidebar.

## 2. App Pages

### 2.0 Shared UI Shell

Check on every page:

- The top-left sidebar shows the ProofPay logo from `public/static/logo/logo.png`.
- The browser tab shows the favicon from the same logo file.
- The desktop sidebar has an arrow button to collapse/expand.
- When the sidebar is collapsed, only the logo, nav numbers, and network dot remain; the main content adjusts automatically.
- On narrow mobile/tablet viewports, the topbar shows the logo/Menu button to open the sidebar overlay.
- The topbar no longer has a `Refresh` button.
- The topbar has an outline-only theme icon button.
- In dark theme, the button shows a sun icon to switch to light theme.
- In light theme, the button shows a moon icon to switch to dark theme.
- Theme selection is stored in browser localStorage and stays after page reload.

### 2.1 Dashboard

URL:

```text
https://proofpay-nu.vercel.app/#/dashboard
```

This page gives a product overview.

You should see:

- ProofPay hero with `PROOF PAY` on one line and `AUTOMATES TRUST` on one line.
- Deal, proof, and event summary.
- Total RIALO locked in the session ledger.
- Product modules: Conditional Escrow, Guarded Vault, Programmable Payments, Automation Rules.
- Mock Rialo adapter console.

Purpose:

- Explain ProofPay as a programmable payment workflow.
- Show that the app is running in devnet/mock mode.
- Confirm that the mock adapter console does not show the default RPC URL.
- Provide a quick entry point for the `Create GitHub Escrow` flow.

### 2.2 Escrows

URL:

```text
https://proofpay-nu.vercel.app/#/escrows
```

This page manages escrow deals.

You should see:

- Deal list table.
- Deal status: `DRAFT`, `FUNDED`, `VERIFIED`, `RELEASED`, `REFUNDED`, `DISPUTED`.
- Amount and token.
- GitHub PR condition.
- Deadline.
- Actions: `View`, `Fund`, `Verify`, `Release`.
- Deal Details/Audit trail.

Purpose:

- View created deals.
- Select a deal to inspect or operate on it.
- Fund a deal with simulated RIALO.
- Verify GitHub proof.
- Release or refund.

Notes:

- `Fund` only succeeds if the connected wallet matches the deal payer address.
- `Fund` subtracts RIALO from the payer balance in the session ledger.
- `Release` credits RIALO to the payee address.
- `Refund` returns RIALO to the payer address.

### 2.3 Create Deal

URL:

```text
https://proofpay-nu.vercel.app/#/create
```

This page creates a new escrow.

Important fields:

- `Title`: deal name.
- `Amount`: amount of RIALO to pay.
- `Token`: should default to `RIALO`.
- `Payer Address`: auto-filled from the connected wallet.
- `Payee Address`: recipient wallet address.
- `GitHub Owner`: repository owner/org.
- `GitHub Repo`: repository name.
- `Pull Request`: PR number.
- `Expected Author`: GitHub username of the worker, optional.
- `Deadline`: verification deadline.

Purpose:

- Create the payment condition.
- Store the condition payload.
- Create a mock Rialo escrow account.

Example:

```text
Title: Fix checkout bug
Amount: 100
Token: RIALO
Payer Address: client's wallet
Payee Address: developer's wallet
GitHub Owner: vercel
GitHub Repo: next.js
Pull Request: 1
Deadline: 7 days from now
```

After the deal is created, the app navigates to the `Escrows` page.

### 2.4 Proofs

URL:

```text
https://proofpay-nu.vercel.app/#/proofs
```

This page shows the proof pipeline for the selected deal.

Pipeline:

```text
Escrow Created
Funds Locked
Proof Verified
Payment Action
```

Purpose:

- Show the current step of the selected deal.
- Show proof tx/proof hash when available.
- Show whether release/refund has happened.
- View the deal audit trail.

This page is useful during demos:

```text
This is the payment proof.
This is the mock transaction.
This is the proof hash.
This is the verifier result.
```

### 2.5 Adapter

URL:

```text
https://proofpay-nu.vercel.app/#/adapter
```

This page shows wallet/RIALO and Rialo adapter state.

You should see:

- Wallet session.
- RIALO balance.
- Faucet claim count.
- GitHub App Verification production path.
- Adapter status.
- Execution mode/mock adapter mode.
- Payment token.
- Wallet source.

Purpose:

- Confirm that the app is using the mock Rialo adapter.
- Confirm that the mock adapter does not show `RPC: https://api.devnet.rialo.xyz`.
- Confirm that wallet/RIALO flow is running in the browser session.
- Explain the production upgrade path using a GitHub App.

### 2.6 Profile / Settings

URL:

```text
https://proofpay-nu.vercel.app/#/profile
```

This page manages the profile created from the wallet.

You should see:

- Profile name.
- Wallet address.
- RIALO balance.
- GitHub connection state.
- GitHub permissions.
- GitHub App/OAuth status.
- Private repo example flows.
- Wallet/GitHub audit log in the session.

Purpose:

- Show that the user profile is created from the wallet.
- Show that GitHub identity can be connected to the profile.
- Explain how private repo verification works.
- View the audit log for faucet/fund/release/refund/GitHub connect events.

## 3. End-to-End Test Flows

### UI Flow: Logo, Sidebar, Theme

1. Open:

```text
https://proofpay-nu.vercel.app/#/dashboard
```

Expected result:

- Sidebar shows the ProofPay logo in the top-left corner.
- Browser tab shows the ProofPay favicon.
- Hero shows `PROOF PAY` on one line and `AUTOMATES TRUST` on one line.
- There is no `Refresh` button in the topbar.

2. Click the theme icon button in the topbar.

Expected result:

- If the app is in dark theme, the sun icon switches the UI to light theme.
- If the app is in light theme, the moon icon switches the UI to dark theme.
- The icon is stroke/outline only, with no separate fill color.
- Reloading the page keeps the selected theme.

3. On desktop, click the sidebar arrow button.

Expected result:

- The sidebar collapses.
- The main content expands.
- Clicking again expands the sidebar.

4. Test on a narrow/mobile viewport.

Expected result:

- Sidebar is hidden by default.
- Topbar shows the logo/Menu button.
- Clicking logo/Menu opens the sidebar overlay.
- Clicking a nav link or outside shade closes the sidebar.

### Flow A: Create Profile, Use Faucet, Create Escrow

1. Open:

```text
https://proofpay-nu.vercel.app/#/dashboard
```

2. Click `Connect Wallet`.

3. Choose `MetaMask` or `Phantom`.

Expected result:

- `Connect Wallet` button disappears.
- Profile avatar appears.
- Wallet profile is created in the session.
- `Faucet +100 RIALO` appears.

4. Click `Faucet +100 RIALO`.

Expected result:

- Faucet button processes for about 1-2 seconds.
- Balance increases by `100 RIALO`.
- Audit log records a `wallet.faucet` event.

5. Go to:

```text
https://proofpay-nu.vercel.app/#/profile
```

Expected result:

- Profile details are visible.
- Wallet address is visible.
- RIALO balance is visible.
- Faucet audit log is visible.

6. Go to:

```text
https://proofpay-nu.vercel.app/#/create
```

Expected result:

- `Payer Address` is auto-filled with the wallet address.
- `Token` defaults to `RIALO`.

7. Create a deal with amount lower than the current balance.

Expected result:

- Deal is created.
- App navigates to the `Escrows` page.

### Flow B: Fund Escrow and Refund

1. Go to:

```text
https://proofpay-nu.vercel.app/#/escrows
```

2. Select the deal you just created.

3. Click `Fund`.

Expected result:

- Deal status changes from `DRAFT -> FUNDED`.
- Payer RIALO balance decreases by the deal amount.
- Deal details show a mock funding tx.
- Audit log has a `wallet.fund` event.

4. Click `Refund`.

If the refund button is not visible in the table, go to:

```text
https://proofpay-nu.vercel.app/#/proofs
```

Then click `Refund` in selected actions.

Expected result:

- Deal status changes to `REFUNDED`.
- Payer RIALO balance is restored.
- Audit log has a `wallet.refund` event.

This flow tests:

```text
Client locks funds, but proof does not pass -> refund client.
```

### Flow C: Fund Escrow, Verify GitHub, Release

This flow requires a valid GitHub PR.

1. Create a deal with a public repository and an already-merged PR.

You can use any public repo, but the PR must exist and be merged.

2. Fund the deal.

3. Click `Verify`.

Possible results:

- If the PR is merged and satisfies the condition: status -> `VERIFIED`.
- If the PR is wrong/missing/not merged: proof is rejected.

4. If status is `VERIFIED`, click `Release`.

Expected result:

- Deal status -> `RELEASED`.
- RIALO is credited to the payee address in the session ledger.
- Audit log has a `wallet.release` event.

Notes:

- If payee address is not the connected wallet, you will not see payee balance in the topbar.
- Payee balance is still recorded in the session ledger by address.

### Flow D: Connect GitHub in Profile

1. Go to:

```text
https://proofpay-nu.vercel.app/#/profile
```

2. Click `Connect GitHub`.

Expected result if OAuth is not configured:

- GitHub is connected in simulated mode.
- Profile shows a mock GitHub username.
- Permissions show `pull_requests:read`, `checks:read`.
- Audit log has a `github.connect` event.

Expected result if OAuth env is configured:

- Page shows a `GitHub OAuth` link.
- Click the link to go through GitHub OAuth.
- Callback stores GitHub identity in the session profile.

## 4. How Does Private Repo Verification Work?

### Problem

Client and developer work on a private repository.

The client does not want to expose source code publicly.

The developer wants to be paid if the PR is merged.

ProofPay needs to verify the PR without leaking code to a third party.

### Correct Production Approach

Use a GitHub App with scoped permissions.

The GitHub App only needs narrow read permissions:

```text
Repository metadata: read
Pull requests: read
Checks: read
Commit statuses: read
```

The verifier reads private data through the GitHub App, but does not expose raw data publicly.

The on-chain/payment layer only needs:

```text
condition_hash
proof_hash
verification_result
verifier_identity
verified_at
```

### Example 1: Client Owns a Private Repo

```text
Client: Company A
Repo: company/private-api
Developer: Bob
Deal: Pay 500 RIALO if PR #42 is merged before 2026-06-20
```

Flow:

1. Client connects wallet.
2. Client installs the GitHub App on `company/private-api`.
3. Client creates an escrow in ProofPay.
4. Bob creates PR #42.
5. GitHub App verifier reads PR metadata.
6. If the PR is merged before the deadline, verifier creates a proof hash.
7. ProofPay releases RIALO to Bob.

Third parties do not see the code because:

- Raw PR diff is not shown in the public UI.
- Verifier only publishes hash and result.
- Repo access remains inside GitHub's permission model.

### Example 2: Developer Is Invited to a Repo

```text
Client: Startup B
Developer: Alice
Repo: startup/private-web
Deal: Pay 200 RIALO if Alice merges a PR fixing checkout bug
```

Flow:

1. Client installs the GitHub App.
2. Alice connects wallet.
3. Alice connects GitHub identity.
4. ProofPay maps Alice's GitHub username to the payee wallet.
5. When the PR is merged, verifier checks author/reviewer/merge time.
6. If valid, payment is released.

The app does not need to publicize code.

The app only needs to know:

```text
Does PR # exist?
Is the PR merged?
When was it merged?
Is the author correct?
Did checks pass?
```

### Example 3: Dispute or Proof Failure

```text
Deal: Pay 100 RIALO if PR #10 is merged before day 20
Reality: PR #10 is not merged or was merged after the deadline
```

Result:

- Verifier returns `PR_NOT_MERGED` or `MERGED_AFTER_DEADLINE`.
- Payment is not released.
- Client can refund.

## 5. What Is Mocked and What Is Real?

Real:

- Express API.
- JSON persistence.
- GitHub public PR verification API.
- Deal state machine.
- Profile/session UI.
- GitHub OAuth route skeleton.

Mock/simulated:

- MetaMask/Phantom connection.
- RIALO token balance.
- Faucet.
- Rialo transaction hash.
- Escrow custody.
- GitHub App installation state when env is not configured.

Vercel deployment notes:

- Vercel does not allow writing to the bundle directory `/var/task`.
- Configure Vercel KV or Upstash Redis REST for durable storage.
- Required env vars: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `PROOFPAY_STORE_KEY`.
- Without KV/Upstash, the app falls back to a runtime temp directory.
- On Vercel, the temp fallback is `/tmp/proofpay-rialo`.
- `/tmp` is not shared across function instances and can reset on cold start/redeploy.
- If `/tmp` is used, pressing Reload can show different deal sets because requests may hit different instances.
- Production requires a separate database/KV store.

## 7. Short Demo Script

Use this script for a quick demo:

```text
1. Dashboard: Logo, favicon, sidebar collapse, light/dark theme icon.
2. Dashboard: ProofPay is proof-based escrow.
3. Connect Wallet: Create a profile from wallet.
4. Faucet: Receive 100 RIALO.
5. Profile: Connect GitHub and view permissions.
6. Create Deal: Create GitHub PR escrow.
7. Escrows: Fund deal.
8. Proofs: Verify proof.
9. Escrows/Proofs: Release if verified, refund if failed.
10. Profile: View audit log.
```

Main message:

```text
ProofPay turns freelancer/bounty payments into conditional workflows with proof, audit, and a path toward Rialo-native escrow.
```
