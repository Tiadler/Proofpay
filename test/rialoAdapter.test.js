import test from 'node:test';
import assert from 'node:assert/strict';
import { MockRialoAdapter } from '../src/adapters/rialoAdapter.js';

test('mock adapter hides RPC by default', async () => {
  const adapter = new MockRialoAdapter();
  const info = await adapter.getNetworkInfo();

  assert.equal(info.mode, 'mock');
  assert.equal('rpcUrl' in info, false);
  assert.match(info.note, /Mock adapter/);
});

test('mock adapter returns transaction-shaped escrow operations', async () => {
  const adapter = new MockRialoAdapter();
  const deal = {
    id: 'deal_1',
    amount: '100',
    tokenSymbol: 'RIALO',
    payerAddress: 'rialo_client_demo',
    payeeAddress: 'rialo_freelancer_demo'
  };

  const escrow = await adapter.createEscrowAccount(deal);
  const funding = await adapter.fundEscrow(deal);
  const release = await adapter.releasePayment(deal);
  const refund = await adapter.refundPayment(deal);
  const proof = await adapter.submitProofHash(deal, 'proof_hash');

  assert.equal(escrow.escrowAccount, 'rialo_escrow_deal_1');
  assert.equal(escrow.programId, 'proofpay_escrow_program_mock');
  assert.match(funding.txHash, /^fund_/);
  assert.equal(funding.status, 'FUNDED');
  assert.match(release.txHash, /^release_/);
  assert.equal(release.status, 'RELEASED');
  assert.match(refund.txHash, /^refund_/);
  assert.equal(refund.status, 'REFUNDED');
  assert.match(proof.txHash, /^proof_/);
  assert.equal(proof.proofHash, 'proof_hash');
});
