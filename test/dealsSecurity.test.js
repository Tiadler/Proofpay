import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

let previousDataDir;
let dataDir;
let store;
let server;
let baseUrl;

function conditionHash(conditionType, conditionPayload) {
  return crypto.createHash('sha256').update(JSON.stringify({ conditionType, conditionPayload })).digest('hex');
}

function baseState(deals = []) {
  return {
    deals,
    vaults: [],
    payments: [],
    automations: [],
    proofs: [],
    events: []
  };
}

function makeDeal(overrides = {}) {
  const conditionType = 'github_pr_merged';
  const conditionPayload = {
    owner: 'proofpay',
    repo: 'demo',
    pullNumber: 7,
    expectedAuthor: 'dev',
    deadline: '2026-06-02T00:00:00.000Z'
  };
  const now = '2026-06-01T00:00:00.000Z';
  return {
    id: 'deal_test',
    title: 'Security test deal',
    description: '',
    payerAddress: 'rialo_client_demo',
    payeeAddress: 'rialo_freelancer_demo',
    amount: '100',
    tokenSymbol: 'MRD',
    status: 'DRAFT',
    conditionType,
    conditionPayload,
    conditionHash: conditionHash(conditionType, conditionPayload),
    deadline: conditionPayload.deadline,
    rialoEscrowAccount: 'rialo_escrow_deal_test',
    rialoProgramId: 'proofpay_escrow_program_mock',
    createEscrowTxHash: 'create_escrow_test',
    fundingTxHash: null,
    proofTxHash: null,
    releaseTxHash: null,
    refundTxHash: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

test.before(async () => {
  previousDataDir = process.env.DATA_DIR;
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proofpay-deals-security-'));
  process.env.DATA_DIR = dataDir;

  store = await import('../src/storage/jsonStore.js');
  const { dealsRouter } = await import('../src/routes/deals.js');
  const app = express();
  app.use(express.json());
  app.use('/api/deals', dealsRouter);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
  if (previousDataDir == null) {
    delete process.env.DATA_DIR;
  } else {
    process.env.DATA_DIR = previousDataDir;
  }
  if (dataDir) {
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});

async function withDealsApp(initialDeals, fn) {
  await store.writeStore(baseState(initialDeals));
  await fn({ baseUrl, store });
}

async function postJson(baseUrl, pathName, body = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload };
}

test('deal verification is rejected before escrow funding', async () => {
  await withDealsApp([makeDeal({ status: 'DRAFT' })], async ({ baseUrl }) => {
    const { response, payload } = await postJson(baseUrl, '/api/deals/deal_test/verify/github');

    assert.equal(response.status, 409);
    assert.equal(payload.error, 'Cannot verify deal in status DRAFT');
  });
});

test('deal verification uses the locked condition and ignores request body overrides', async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls = [];
  globalThis.fetch = async (url, options) => {
    const urlString = String(url);
    if (!urlString.startsWith('https://api.github.com/')) {
      return originalFetch(url, options);
    }
    requestedUrls.push(urlString);
    return Response.json({
      merged_at: '2026-06-01T00:00:00.000Z',
      user: { login: 'dev' },
      title: 'Ship locked PR',
      state: 'closed',
      merge_commit_sha: 'abc123',
      base: { ref: 'main' },
      head: { ref: 'feature' }
    });
  };

  try {
    await withDealsApp([makeDeal({ status: 'FUNDED', fundingTxHash: 'fund_test' })], async ({ baseUrl }) => {
      const { response, payload } = await postJson(baseUrl, '/api/deals/deal_test/verify/github', {
        owner: 'attacker',
        repo: 'other',
        pullNumber: 999,
        expectedAuthor: 'attacker'
      });

      assert.equal(response.status, 200);
      assert.equal(payload.verification.ok, true);
      assert.equal(payload.proof.payload.owner, 'proofpay');
      assert.equal(payload.proof.payload.repo, 'demo');
      assert.equal(payload.proof.payload.pullNumber, 7);
      assert.equal(requestedUrls[0], 'https://api.github.com/repos/proofpay/demo/pulls/7');
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('payment release is rejected when verified deal has no funding transaction', async () => {
  await withDealsApp([makeDeal({ status: 'VERIFIED', fundingTxHash: null })], async ({ baseUrl }) => {
    const { response, payload } = await postJson(baseUrl, '/api/deals/deal_test/release');

    assert.equal(response.status, 409);
    assert.equal(payload.error, 'Cannot release an unfunded deal');
  });
});

test('refund is only allowed from funded proof or disputed states', async () => {
  await withDealsApp([makeDeal({ status: 'DRAFT' })], async ({ baseUrl }) => {
    const { response, payload } = await postJson(baseUrl, '/api/deals/deal_test/refund');

    assert.equal(response.status, 409);
    assert.equal(payload.error, 'Cannot refund deal in status DRAFT');
  });

  await withDealsApp([makeDeal({ status: 'FUNDED', fundingTxHash: 'fund_test' })], async ({ baseUrl }) => {
    const { response, payload } = await postJson(baseUrl, '/api/deals/deal_test/refund');

    assert.equal(response.status, 200);
    assert.equal(payload.deal.status, 'REFUNDED');
    assert.match(payload.deal.refundTxHash, /^refund_/);
  });
});
