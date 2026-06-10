import express from 'express';
import { readStore, storageInfo } from '../storage/jsonStore.js';
import { rialoAdapter } from '../adapters/rialoAdapter.js';

export const systemRouter = express.Router();

systemRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ProofPay Rialo prototype', time: new Date().toISOString() });
});

systemRouter.get('/rialo', async (_req, res) => {
  res.json(await rialoAdapter.getNetworkInfo());
});

systemRouter.get('/storage', async (_req, res) => {
  const state = await readStore();
  res.json({
    ...storageInfo(),
    counts: {
      users: state.users?.length || 0,
      sessions: state.sessions?.length || 0,
      githubInstallations: state.githubInstallations?.length || 0,
      githubRepositories: state.githubRepositories?.length || 0,
      deals: state.deals.length,
      proofs: state.proofs.length,
      events: state.events.length
    }
  });
});

systemRouter.get('/summary', async (_req, res) => {
  const state = await readStore();
  res.json({
    deals: state.deals.length,
    vaults: state.vaults.length,
    payments: state.payments.length,
    automations: state.automations.length,
    proofs: state.proofs.length,
    events: state.events.length,
    lockedAmount: state.deals.filter((d) => ['FUNDED', 'AWAITING_PROOF', 'VERIFIED', 'DISPUTED'].includes(d.status)).reduce((sum, d) => sum + Number(d.amount || 0), 0),
    releasedAmount: state.deals.filter((d) => d.status === 'RELEASED').reduce((sum, d) => sum + Number(d.amount || 0), 0)
  });
});
