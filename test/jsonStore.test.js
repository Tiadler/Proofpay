import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('json store can use an explicit writable data directory', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proofpay-store-'));
  const previousDataDir = process.env.DATA_DIR;
  process.env.DATA_DIR = dataDir;

  try {
    const store = await import(`../src/storage/jsonStore.js?dataDir=${Date.now()}`);
    const state = await store.readStore();

    assert.equal(Array.isArray(state.deals), true);
    assert.equal(Array.isArray(state.proofs), true);

    await store.writeStore({ ...state, deals: [{ id: 'deal_test' }] });
    const nextState = await store.readStore();
    assert.equal(nextState.deals[0].id, 'deal_test');
  } finally {
    if (previousDataDir == null) {
      delete process.env.DATA_DIR;
    } else {
      process.env.DATA_DIR = previousDataDir;
    }
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});

test('json store falls back to /tmp on Vercel-like runtime', async () => {
  const previousVercel = process.env.VERCEL;
  const previousDataDir = process.env.DATA_DIR;
  process.env.VERCEL = '1';
  delete process.env.DATA_DIR;

  try {
    const store = await import(`../src/storage/jsonStore.js?vercel=${Date.now()}`);
    const state = await store.readStore();

    assert.equal(Array.isArray(state.deals), true);
    await store.appendEvent('deal_tmp', 'TMP_STORE_CHECK', {});
    const nextState = await store.readStore();
    assert.equal(nextState.events[0].dealId, 'deal_tmp');
  } finally {
    if (previousVercel == null) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = previousVercel;
    }
    if (previousDataDir == null) {
      delete process.env.DATA_DIR;
    } else {
      process.env.DATA_DIR = previousDataDir;
    }
  }
});
