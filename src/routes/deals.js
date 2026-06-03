import express from 'express';
import crypto from 'node:crypto';
import { updateStore, appendEvent, readStore } from '../storage/jsonStore.js';
import { rialoAdapter } from '../adapters/rialoAdapter.js';
import { githubPrVerifier } from '../verifiers/githubPrVerifier.js';

export const dealsRouter = express.Router();

function conditionHash(conditionType, conditionPayload) {
  return crypto.createHash('sha256').update(JSON.stringify({ conditionType, conditionPayload })).digest('hex');
}

function requireDeal(state, id) {
  const deal = state.deals.find((item) => item.id === id);
  if (!deal) {
    const err = new Error('Deal not found');
    err.status = 404;
    throw err;
  }
  return deal;
}

dealsRouter.get('/', async (_req, res) => {
  const state = await readStore();
  res.json(state.deals);
});

dealsRouter.get('/:id', async (req, res) => {
  const state = await readStore();
  const deal = requireDeal(state, req.params.id);
  const events = state.events.filter((event) => event.dealId === deal.id);
  const proofs = state.proofs.filter((proof) => proof.dealId === deal.id);
  res.json({ ...deal, events, proofs });
});

dealsRouter.post('/', async (req, res) => {
  const input = req.body;
  const now = new Date().toISOString();
  const deal = {
    id: crypto.randomUUID(),
    title: input.title || 'Untitled ProofPay deal',
    description: input.description || '',
    payerAddress: input.payerAddress || 'rialo_client_demo',
    payeeAddress: input.payeeAddress || 'rialo_freelancer_demo',
    amount: String(input.amount || '100'),
    tokenSymbol: input.tokenSymbol || 'MRD',
    status: 'DRAFT',
    conditionType: input.conditionType || 'github_pr_merged',
    conditionPayload: input.conditionPayload || {},
    conditionHash: conditionHash(input.conditionType || 'github_pr_merged', input.conditionPayload || {}),
    deadline: input.deadline || null,
    rialoEscrowAccount: null,
    rialoProgramId: null,
    fundingTxHash: null,
    proofTxHash: null,
    releaseTxHash: null,
    refundTxHash: null,
    createdAt: now,
    updatedAt: now
  };

  const escrow = await rialoAdapter.createEscrowAccount(deal);
  deal.rialoEscrowAccount = escrow.escrowAccount;
  deal.rialoProgramId = escrow.programId;
  deal.createEscrowTxHash = escrow.txHash;

  await updateStore((state) => {
    state.deals.unshift(deal);
    return deal;
  });
  await appendEvent(deal.id, 'DEAL_CREATED', { title: deal.title, createEscrowTxHash: escrow.txHash });
  res.status(201).json(deal);
});

dealsRouter.post('/:id/fund', async (req, res) => {
  const result = await updateStore(async (state) => {
    const deal = requireDeal(state, req.params.id);
    if (!['DRAFT', 'AWAITING_FUNDING'].includes(deal.status)) {
      const err = new Error(`Cannot fund deal in status ${deal.status}`);
      err.status = 409;
      throw err;
    }
    const tx = await rialoAdapter.fundEscrow(deal);
    deal.status = 'FUNDED';
    deal.fundingTxHash = tx.txHash;
    deal.updatedAt = new Date().toISOString();
    return { deal, tx };
  });
  await appendEvent(req.params.id, 'DEAL_FUNDED', result.tx);
  res.json(result);
});

dealsRouter.post('/:id/submit-proof', async (req, res) => {
  const proof = await updateStore((state) => {
    const deal = requireDeal(state, req.params.id);
    const proofRecord = {
      id: crypto.randomUUID(),
      dealId: deal.id,
      proofType: req.body.proofType || deal.conditionType,
      proofUrl: req.body.proofUrl || '',
      payload: req.body.payload || deal.conditionPayload,
      verificationStatus: 'SUBMITTED',
      proofHash: null,
      verifierReason: null,
      verifierMetadata: null,
      createdAt: new Date().toISOString(),
      verifiedAt: null
    };
    state.proofs.unshift(proofRecord);
    deal.status = deal.status === 'FUNDED' ? 'AWAITING_PROOF' : deal.status;
    deal.updatedAt = new Date().toISOString();
    return proofRecord;
  });
  await appendEvent(req.params.id, 'PROOF_SUBMITTED', { proofId: proof.id, proofUrl: proof.proofUrl });
  res.status(201).json(proof);
});

dealsRouter.post('/:id/verify/github', async (req, res) => {
  const stateBefore = await readStore();
  const dealBefore = requireDeal(stateBefore, req.params.id);
  const payload = { ...dealBefore.conditionPayload, ...(req.body || {}) };
  const verification = await githubPrVerifier.verify(payload);

  const result = await updateStore(async (state) => {
    const deal = requireDeal(state, req.params.id);
    const proofRecord = {
      id: crypto.randomUUID(),
      dealId: deal.id,
      proofType: 'github_pr_merged',
      proofUrl: verification.metadata?.url || '',
      payload,
      verificationStatus: verification.ok ? 'VERIFIED' : 'REJECTED',
      proofHash: verification.proofHash,
      verifierReason: verification.reason,
      verifierMetadata: verification.metadata,
      createdAt: new Date().toISOString(),
      verifiedAt: verification.ok ? new Date().toISOString() : null
    };
    state.proofs.unshift(proofRecord);
    const proofTx = await rialoAdapter.submitProofHash(deal, verification.proofHash);
    deal.proofTxHash = proofTx.txHash;
    if (verification.ok) deal.status = 'VERIFIED';
    deal.updatedAt = new Date().toISOString();
    return { deal, proof: proofRecord, verification, proofTx };
  });

  await appendEvent(req.params.id, 'GITHUB_PR_CHECKED', { ok: verification.ok, reason: verification.reason, proofHash: verification.proofHash });
  if (verification.ok) await appendEvent(req.params.id, 'CONDITION_VERIFIED', { proofHash: verification.proofHash });
  res.json(result);
});

dealsRouter.post('/:id/release', async (req, res) => {
  const result = await updateStore(async (state) => {
    const deal = requireDeal(state, req.params.id);
    if (!['VERIFIED'].includes(deal.status)) {
      const err = new Error(`Cannot release deal in status ${deal.status}. Verify proof first.`);
      err.status = 409;
      throw err;
    }
    const tx = await rialoAdapter.releasePayment(deal);
    deal.status = 'RELEASED';
    deal.releaseTxHash = tx.txHash;
    deal.updatedAt = new Date().toISOString();
    return { deal, tx };
  });
  await appendEvent(req.params.id, 'PAYMENT_RELEASED', result.tx);
  res.json(result);
});

dealsRouter.post('/:id/refund', async (req, res) => {
  const result = await updateStore(async (state) => {
    const deal = requireDeal(state, req.params.id);
    if (deal.status === 'RELEASED') {
      const err = new Error('Cannot refund a released deal');
      err.status = 409;
      throw err;
    }
    const tx = await rialoAdapter.refundPayment(deal);
    deal.status = 'REFUNDED';
    deal.refundTxHash = tx.txHash;
    deal.updatedAt = new Date().toISOString();
    return { deal, tx };
  });
  await appendEvent(req.params.id, 'REFUND_EXECUTED', result.tx);
  res.json(result);
});

dealsRouter.post('/:id/dispute', async (req, res) => {
  const result = await updateStore((state) => {
    const deal = requireDeal(state, req.params.id);
    if (['RELEASED', 'REFUNDED'].includes(deal.status)) {
      const err = new Error(`Cannot dispute deal in status ${deal.status}`);
      err.status = 409;
      throw err;
    }
    deal.status = 'DISPUTED';
    deal.disputeReason = req.body?.reason || 'No reason provided';
    deal.updatedAt = new Date().toISOString();
    return deal;
  });
  await appendEvent(req.params.id, 'DISPUTE_OPENED', { reason: req.body?.reason || 'No reason provided' });
  res.json(result);
});
