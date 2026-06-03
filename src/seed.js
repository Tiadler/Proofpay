import { updateStore, appendEvent } from './storage/jsonStore.js';
import crypto from 'node:crypto';

const id = crypto.randomUUID();
const conditionPayload = {
  owner: 'vercel',
  repo: 'next.js',
  pullNumber: 1,
  expectedAuthor: undefined,
  deadline: new Date(Date.now() + 7 * 86400000).toISOString()
};
const conditionHash = crypto.createHash('sha256').update(JSON.stringify({ conditionType: 'github_pr_merged', conditionPayload })).digest('hex');

await updateStore((state) => {
  state.deals.unshift({
    id,
    title: 'Demo GitHub escrow',
    description: 'Seed deal: verify a GitHub PR and release mock Rialo payment.',
    payerAddress: 'rialo_client_demo',
    payeeAddress: 'rialo_freelancer_demo',
    amount: '100',
    tokenSymbol: 'MRD',
    status: 'DRAFT',
    conditionType: 'github_pr_merged',
    conditionPayload,
    conditionHash,
    deadline: conditionPayload.deadline,
    rialoEscrowAccount: `rialo_escrow_${id}`,
    rialoProgramId: 'proofpay_escrow_program_mock',
    fundingTxHash: null,
    proofTxHash: null,
    releaseTxHash: null,
    refundTxHash: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
});
await appendEvent(id, 'DEAL_CREATED', { seeded: true });
console.log(`Seeded deal ${id}`);
