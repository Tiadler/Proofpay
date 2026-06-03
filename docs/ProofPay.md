# ProofPay: Proof-Based Programmable Payments on Rialo

## 1. Product summary

**ProofPay** is a payment automation suite for escrow, team vaults, recurring payments, proof verification, and event-driven payment workflows.

The core idea is simple:

> Lock funds first, verify real-world proof later, then automatically release, refund, or escalate the payment.

The first MVP is a GitHub-based escrow:

> A client locks funds for a developer. When a specified GitHub Pull Request is merged before the deadline, ProofPay verifies the proof and releases the payment.

Long term, ProofPay should become a **programmable payment operating system** for freelancers, teams, DAOs, AI agents, contractors, and real-world asset workflows.

---

## 2. Why ProofPay fits Rialo

Rialo Playground demonstrates several categories of applications: stablecoin-style payments, guarded vaults, automations, and live data/on-chain feeds. ProofPay combines these ideas into one coherent product.

ProofPay maps naturally to Rialo primitives:

| Rialo-style primitive | ProofPay usage |
|---|---|
| Reactive transactions | Release or refund when a condition becomes true |
| Long-running workflows | Escrows wait for future proofs, deadlines, or approvals |
| Web2/Web3 interaction | Verify GitHub, Stripe, Shopify, delivery APIs, and other external data |
| Guarded vaults | Teams manage shared funds and approval policies |
| Programmable compliance | Denylists, allowlists, spending limits, approval thresholds |
| Market/data feeds | Trigger payments or settlements from live data |
| Gasless/simple UX | Make escrow and payment workflows feel closer to Web2 |

The product should not be positioned as a normal DeFi app. It should be positioned as:

> Real-world proof → policy/condition → automated on-chain payment.

---

## 3. Core product vision

### One-line pitch

**ProofPay turns verified real-world events into programmable payments.**

### Full pitch

ProofPay lets users and teams lock funds in escrow or vaults, define payment conditions, verify those conditions using real-world data, and execute payment actions automatically. It is designed for Rialo-style reactive workflows where payment logic can wait, resume, and execute when a predicate becomes true.

### Target users

1. **Freelancers and clients** who need milestone escrow.
2. **Startups and teams** that need approval-based treasury payments.
3. **DAOs and communities** that pay bounties after proof of work.
4. **AI agent marketplaces** that need task escrow and judge verification.
5. **RWA/invoice workflows** that need settlement based on real-world events.
6. **Contractor and payroll operations** that need recurring conditional payments.

---

## 4. Product modules

ProofPay should be designed as a suite with five major modules.

```text
1. Conditional Escrow
2. Guarded Team Vault
3. Programmable Payments
4. Automation Rules
5. Proof & Data Registry
```

---

## 5. Module 1: Conditional Escrow

Conditional Escrow is the core of ProofPay.

### Purpose

A payer locks funds, a payee completes work, and ProofPay releases funds when a predefined condition is verified.

### MVP condition

```text
GitHub Pull Request merged before deadline
```

### Future conditions

```text
GitHub PR merged
GitHub CI passed
GitHub review approved
Stripe invoice paid
Shopify order fulfilled
Delivery status delivered
Google Drive file submitted
AI judge accepted output
Manual milestone approved
Market price reached threshold
Deadline expired
```

### Example

```text
Pay 100 MRD to Alice if PR #42 in my-org/my-app is merged before 2026-06-10.
```

### State machine

```text
DRAFT
  ↓
FUNDED
  ↓
AWAITING_PROOF
  ↓
VERIFIED
  ↓
RELEASED
```

Failure/edge states:

```text
FUNDED → EXPIRED → REFUNDED
FUNDED → DISPUTED → MANUAL_RESOLUTION
FUNDED → CANCELLED, if both sides agree
```

### Main actions

```text
create_deal
fund_deal
submit_proof
verify_proof
release_payment
refund_payment
open_dispute
resolve_dispute
```

---

## 6. Module 2: Guarded Team Vault

This module is inspired by the guarded vault concept in Rialo Playground.

### Purpose

Teams can create a shared treasury and define rules for spending.

### Features

```text
Create vault
Add/remove members
Deposit funds
Create payment request
Approve/reject request
Execute approved payment
Set approval threshold
Set spending limit
Set timelock
Set emergency pause
```

### Policy examples

```text
Under 100 MRD: 1 approval required
100–1,000 MRD: 2-of-3 approvals required
Over 1,000 MRD: 3-of-5 approvals + 24-hour timelock
Only approved payees can receive funds
Daily outflow cannot exceed 5,000 MRD
```

### Use cases

```text
Startup treasury
DAO treasury
Guild treasury
Bounty program
Contractor payout wallet
AI agent marketplace treasury
```

### Why it matters

A standalone escrow is useful, but a vault turns ProofPay into a team payment operations product.

---

## 7. Module 3: Programmable Payments

This module turns ProofPay into a broader payment platform.

### Payment types

```text
Instant payment
Conditional payment
Scheduled payment
Recurring payment
Batch payment
Claimable payment link
Invoice payment
Payroll-like contractor payment
```

### Examples

```text
Pay a designer 500 MRD every month if the monthly invoice proof is submitted.
Send a claimable payment link to a freelancer.
Release funds to a vendor when an invoice is approved.
```

### Payment policy checks

```text
Payee is not denylisted
Payee is allowlisted for this vault
Amount is below the spending limit
Required approvals are complete
Proof is verified
Deadline has not passed
```

---

## 8. Module 4: Automation Rules

Automation Rules are the product's Rialo-native narrative.

### Rule format

```text
IF condition
THEN action
```

### Conditions

```text
GitHub PR merged
GitHub CI passed
Stripe invoice paid
Delivery status delivered
Deadline passed
Vault balance below threshold
Token price above/below threshold
Milestone approved
Dispute opened
Proof rejected
```

### Actions

```text
Release payment
Refund payer
Create payment request
Notify vault members
Require approval
Pause deal
Open dispute
Top up vault
Record proof hash
```

### Example rules

```text
IF PR merged AND CI passed
THEN release 100 MRD to developer
```

```text
IF deadline passed AND proof not verified
THEN refund payer
```

```text
IF payment amount > 1,000 MRD
THEN require 2 approvals from vault members
```

### Implementation path

The prototype can use a backend worker/polling service first. Later, as Rialo reactive transaction primitives become more accessible, the workflow should move closer to Rialo-native predicates.

Prototype path:

```text
Backend checks event/API
→ Backend submits proof hash
→ Rialo program releases/refunds
```

Target Rialo-native path:

```text
Predicate registered on-chain
→ External signal updates
→ Predicate becomes true
→ Payment transaction executes automatically
```

---

## 9. Module 5: Proof & Data Registry

This layer stores and audits proof metadata.

### Proof types

```text
GitHub proof
Stripe proof
Shopify proof
Delivery proof
Market price proof
Manual approval proof
AI judge proof
Document hash proof
```

### On-chain/off-chain split

Sensitive data should not be stored directly on-chain.

Store off-chain:

```text
Full API response
Detailed invoice metadata
Private contract information
Delivery address details
Evidence files
```

Store on-chain or anchor:

```text
condition_hash
proof_hash
verification_result
verifier_address
verified_at timestamp
```

### Example condition payload

```json
{
  "conditionType": "github_pr_merged",
  "owner": "my-org",
  "repo": "my-app",
  "pullNumber": 42,
  "expectedAuthor": "alice",
  "deadline": "2026-06-10T23:59:00Z"
}
```

### Example hash strategy

```text
condition_hash = sha256(condition_payload)
proof_hash = sha256(verified_result_summary)
```

---

## 10. MVP scope

The first build should be narrow but polished.

### MVP 1: GitHub Escrow

Included:

```text
Create escrow
Fund escrow through mock/Rialo adapter
Submit GitHub PR condition
Verify PR merged via GitHub API
Anchor proof hash
Release payment after verification
Refund manually
Show deal timeline
Show tx hashes
```

Not included yet:

```text
Full Rialo smart contract
Real asset custody
Full vault implementation
ZK proof
AI judge
Complex dispute court
Market data triggers
KYC/compliance
```

### Why GitHub first?

GitHub is ideal for the first ProofPay demo because:

```text
The API is easy to use
Developers understand PR-based work
The proof is objective
The demo is simple to explain
It fits hackathons and Rialo developer audiences
```

---

## 11. User experience

### Main navigation

```text
Dashboard
Escrows
Vaults
Payments
Automations
Proofs
```

### Dashboard metrics

```text
Total locked
Total released
Pending escrows
Pending approvals
Active automations
Recent proofs
Failed verifications
```

### Escrow screen

Fields:

```text
Title
Description
Amount
Token
Payer address
Payee address
Condition type
GitHub owner
GitHub repository
Pull request number
Expected GitHub author
Deadline
Dispute option
```

### Deal detail screen

Display:

```text
Status
Amount
Payer
Payee
Condition
Deadline
Escrow account
Funding transaction
Proof transaction
Release/refund transaction
Timeline
Proof logs
```

Actions:

```text
Fund
Submit proof
Verify proof
Release
Refund
Open dispute
```

---

## 12. Technical architecture

### High-level system

```text
Frontend
  Next.js/React or static UI

Backend API
  Node.js/Express or NestJS

Database
  PostgreSQL/Supabase in production
  JSON store for prototype

Verifier services
  GitHub verifier
  Stripe verifier
  Delivery verifier
  Market verifier

Rialo adapter
  Mock adapter in prototype
  Rialo CDK/Rust microservice later

Rialo devnet/mainnet
  Escrow program
  Vault program
  Payment program
  Automation program
  Proof registry
```

### Recommended monorepo structure

```text
apps/web
packages/core
packages/ui
packages/database
packages/verifiers
packages/rialo-adapter
services/automation-worker
services/rialo-rust-service
```

### Prototype structure in this zip

```text
proofpay-rialo/
  public/                 Static UI
  src/
    adapters/             Mock Rialo adapter
    routes/               Express routes
    storage/              JSON store
    verifiers/            GitHub verifier
    server.js             App entrypoint
  docs/
    ProofPay.md           This document
```

---

## 13. Backend API design

### System routes

```http
GET /api/system/health
GET /api/system/rialo
GET /api/system/summary
```

### Deal routes

```http
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

### Example create-deal payload

```json
{
  "title": "Fix checkout bug",
  "description": "Release payment when PR is merged.",
  "payerAddress": "rialo_client_demo",
  "payeeAddress": "rialo_freelancer_demo",
  "amount": "100",
  "tokenSymbol": "MRD",
  "conditionType": "github_pr_merged",
  "conditionPayload": {
    "owner": "my-org",
    "repo": "my-app",
    "pullNumber": 42,
    "expectedAuthor": "alice",
    "deadline": "2026-06-10T23:59:00Z"
  },
  "deadline": "2026-06-10T23:59:00Z"
}
```

---

## 14. Data model

### deals

```text
id
title
description
payer_address
payee_address
amount
token_symbol
status
condition_type
condition_payload
condition_hash
deadline
rialo_escrow_account
rialo_program_id
funding_tx_hash
proof_tx_hash
release_tx_hash
refund_tx_hash
created_at
updated_at
```

### proofs

```text
id
deal_id
proof_type
proof_url
payload
verification_status
proof_hash
verifier_reason
verifier_metadata
created_at
verified_at
```

### verification_logs

```text
id
deal_id
source
request_payload
response_payload
result
reason
created_at
```

### events

```text
id
deal_id
event_type
payload
created_at
```

### vaults, future

```text
id
name
members
policy
balances
created_at
updated_at
```

### payment_requests, future

```text
id
vault_id
created_by
payee
amount
token
status
approval_count
required_approvals
created_at
executed_at
```

### automation_rules, future

```text
id
owner_id
scope_type
scope_id
condition_type
condition_payload
action_type
action_payload
status
last_triggered_at
created_at
updated_at
```

---

## 15. Verifier design

Each verifier should implement a common interface.

```ts
interface Verifier {
  type: string;
  verify(payload: unknown): Promise<{
    ok: boolean;
    reason: string;
    proofHash: string;
    metadata: Record<string, unknown>;
  }>;
}
```

### GitHub PR verifier

Checks:

```text
Repository exists
PR exists
PR is merged
PR was merged before deadline
Optional author matches expected author
```

Future checks:

```text
CI passed
Required review approved
PR targets expected branch
Commit signature valid
PR links to expected issue
Repo belongs to expected organization
```

---

## 16. Rialo adapter strategy

The prototype uses a mock adapter because public developer tooling may change.

### Adapter interface

```ts
interface RialoAdapter {
  getNetworkInfo(): Promise<NetworkInfo>;
  createEscrowAccount(deal): Promise<TxResult>;
  fundEscrow(deal): Promise<TxResult>;
  submitProofHash(deal, proofHash): Promise<TxResult>;
  releasePayment(deal): Promise<TxResult>;
  refundPayment(deal): Promise<TxResult>;
}
```

### Current prototype

```text
Mock adapter returns fake Rialo-like transaction hashes.
No real funds are moved.
No real Rialo program is deployed.
```

### Recommended real integration path

```text
Node.js backend
→ HTTP call
→ Rust Rialo service
→ rialo-cdk
→ Rialo devnet
```

### Why Rust microservice?

If Rialo CDK is Rust-first, a Rust service avoids awkward Node bindings and lets your Node app stay product-focused.

Suggested service methods:

```text
POST /rialo/wallet/create
GET  /rialo/wallet/:address/balance
POST /rialo/escrow/create
POST /rialo/escrow/fund
POST /rialo/escrow/proof
POST /rialo/escrow/release
POST /rialo/escrow/refund
```

---

## 17. On-chain program design

Do not put everything in one program. Split by responsibility.

### Escrow Program

```text
create_deal
fund_deal
submit_proof_hash
mark_verified
release_payment
refund_payment
open_dispute
resolve_dispute
```

### Vault Program

```text
create_vault
add_member
remove_member
set_policy
create_request
approve_request
execute_request
pause_vault
```

### Payment Program

```text
send_payment
create_recurring_payment
cancel_recurring_payment
claim_payment_link
execute_batch_payment
```

### Automation Program

```text
register_rule
pause_rule
resume_rule
execute_rule
record_trigger
record_failure
```

### Proof Registry

```text
submit_proof_hash
attest_proof
revoke_proof
get_proof_status
```

---

## 18. Example escrow state

```rust
pub struct EscrowDeal {
    pub id: [u8; 32],
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub arbiter: Option<Pubkey>,
    pub amount: u64,
    pub token_mint: Pubkey,
    pub status: DealStatus,
    pub condition_hash: [u8; 32],
    pub proof_hash: Option<[u8; 32]>,
    pub deadline_ts: i64,
    pub created_at: i64,
    pub funded_at: Option<i64>,
    pub verified_at: Option<i64>,
    pub released_at: Option<i64>,
}
```

```rust
pub enum DealStatus {
    Draft,
    Funded,
    AwaitingProof,
    Verified,
    Released,
    Expired,
    Refunded,
    Disputed,
}
```

---

## 19. Automation examples

### GitHub bounty

```text
IF GitHub PR #42 is merged before deadline
THEN release 100 MRD to developer
```

### Deadline refund

```text
IF deadline passed AND proof is not verified
THEN refund payer
```

### Vault policy

```text
IF payment amount > 1,000 MRD
THEN require 2-of-3 vault approvals
```

### Contractor payment

```text
IF monthly invoice proof is submitted AND manager approves
THEN release monthly contractor payment
```

### AI agent task

```text
IF judge agent approves submitted output
THEN release task bounty to agent
ELSE refund user after deadline
```

---

## 20. Roadmap

### Phase 0: Prototype foundation

```text
Express backend
Static UI
JSON persistence
Mock Rialo adapter
GitHub verifier
Proof hash generation
Timeline events
```

### Phase 1: MVP GitHub Escrow

```text
Create deal
Fund deal
Verify PR merge
Release/refund
Show tx hashes
```

### Phase 2: Vault demo

```text
Create vault
Add members
Define policy
Create payment request
Approve payment
Execute payment
```

### Phase 3: Programmable payments

```text
Scheduled payments
Recurring payments
Payment links
Invoice payment flow
Batch payments
```

### Phase 4: Automation builder

```text
Rule builder UI
Trigger history
Failed execution logs
Deadline triggers
Proof triggers
Approval triggers
```

### Phase 5: Proof registry

```text
Proof explorer
Verifier identity
Proof hash anchoring
Revocation flow
Private proof metadata
```

### Phase 6: Rialo-native upgrade

```text
Rialo CDK integration
Real devnet transactions
Escrow program deployment
Vault program deployment
Reactive predicates
Reduced backend polling
```

### Phase 7: Advanced modules

```text
AI agent escrow
Stripe invoice verifier
Delivery verifier
Market data trigger
Compliance policy engine
ZK/private proof layer
```

---

## 21. Demo script

Use this for a hackathon or community presentation.

### Step 1

Create a GitHub escrow:

```text
Title: Fix checkout bug
Amount: 100 MRD
Condition: PR #42 in my-org/my-app must be merged
Payee: rialo_freelancer_demo
Deadline: 2026-06-10
```

### Step 2

Fund the escrow.

Result:

```text
Status changes DRAFT → FUNDED
Mock funding tx hash appears
```

### Step 3

Verify GitHub proof.

Result if merged:

```text
Status changes FUNDED/AWAITING_PROOF → VERIFIED
Proof hash is generated
Mock proof tx hash appears
```

### Step 4

Release payment.

Result:

```text
Status changes VERIFIED → RELEASED
Mock release tx hash appears
```

### Step 5

Explain roadmap:

```text
Next: vault approvals, recurring payments, automation rules, and Rialo-native reactive execution.
```

---

## 22. Risks and mitigations

| Risk | Mitigation |
|---|---|
| GitHub API rate limit | Use GitHub App/OAuth token |
| User enters wrong PR | Allow editing before funding |
| PR merged then reverted | Add future checks for final commit/state |
| Client disputes result | Add manual dispute and arbiter flow |
| External API trust | Store response hash, verifier identity, and logs |
| Sensitive data exposure | Store only hashes on-chain |
| Rialo SDK changes | Keep adapter layer isolated |
| No real stablecoin in devnet | Use mock token/devnet token first |
| Complex UI scope | Build card-based modules like Playground |

---

## 23. What to build first

Recommended implementation order:

```text
1. UI create deal
2. Database state machine
3. GitHub verifier
4. Mock escrow adapter
5. Proof hash registry
6. Rialo transfer/devnet integration
7. Rialo escrow program
8. Vault approvals
9. Automation rules
10. Recurring payments
```

Do not start with ZK, full compliance, market data triggers, or a complex dispute court. They are useful later but unnecessary for the first strong demo.

---

## 24. Final positioning

ProofPay should be positioned as:

> A Rialo-powered payment automation suite where real-world proof controls escrow, vault, and payment workflows.

The strongest first demo is:

> GitHub PR merged → proof hash anchored → payment released.

The strongest long-term vision is:

> Any verified real-world event can trigger a secure, policy-aware payment.
