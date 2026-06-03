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
    const info = store.storageInfo();

    assert.equal(Array.isArray(state.deals), true);
    assert.equal(info.provider, 'temp-file');
    assert.equal(info.runsOnReadonlyServerless, true);
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

test('json store ignores read-only DATA_DIR on Vercel-like runtime', async () => {
  const previousVercel = process.env.VERCEL;
  const previousDataDir = process.env.DATA_DIR;
  process.env.VERCEL = '1';
  process.env.DATA_DIR = path.join(process.cwd(), 'data');

  try {
    const store = await import(`../src/storage/jsonStore.js?readonlyDataDir=${Date.now()}`);
    const state = await store.readStore();
    const info = store.storageInfo();

    assert.equal(Array.isArray(state.deals), true);
    assert.equal(info.ignoredReadonlyDataDir, true);
    await store.writeStore({ ...state, deals: [{ id: 'safe_tmp_deal' }] });
    const nextState = await store.readStore();
    assert.equal(nextState.deals[0].id, 'safe_tmp_deal');
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

test('json store uses remote KV REST store when credentials are present', async () => {
  const previousUrl = process.env.KV_REST_API_URL;
  const previousToken = process.env.KV_REST_API_TOKEN;
  const previousKey = process.env.PROOFPAY_STORE_KEY;
  const previousSeed = process.env.SEED_BUNDLED_DATA;
  const originalFetch = globalThis.fetch;
  const remote = new Map();
  const commands = [];

  process.env.KV_REST_API_URL = 'https://kv.example';
  process.env.KV_REST_API_TOKEN = 'token';
  process.env.PROOFPAY_STORE_KEY = 'proofpay:test';
  process.env.SEED_BUNDLED_DATA = 'false';

  globalThis.fetch = async (_url, options) => {
    const command = JSON.parse(options.body);
    commands.push(command);
    const [op, key, value] = command;

    if (op === 'GET') {
      return Response.json({ result: remote.get(key) || null });
    }
    if (op === 'SET') {
      remote.set(key, value);
      return Response.json({ result: 'OK' });
    }
    return Response.json({ error: 'unsupported command' }, { status: 400 });
  };

  try {
    const store = await import(`../src/storage/jsonStore.js?kv=${Date.now()}`);
    const state = await store.readStore();
    const info = store.storageInfo();
    assert.deepEqual(state.deals, []);
    assert.equal(info.provider, 'remote-kv');
    assert.equal(info.remoteKey, 'proofpay:test');

    await store.writeStore({ ...state, deals: [{ id: 'remote_deal' }] });
    const nextState = await store.readStore();

    assert.equal(nextState.deals[0].id, 'remote_deal');
    assert.deepEqual(commands[0], ['GET', 'proofpay:test']);
    assert.equal(commands.some((command) => command[0] === 'SET'), true);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl == null) {
      delete process.env.KV_REST_API_URL;
    } else {
      process.env.KV_REST_API_URL = previousUrl;
    }
    if (previousToken == null) {
      delete process.env.KV_REST_API_TOKEN;
    } else {
      process.env.KV_REST_API_TOKEN = previousToken;
    }
    if (previousKey == null) {
      delete process.env.PROOFPAY_STORE_KEY;
    } else {
      process.env.PROOFPAY_STORE_KEY = previousKey;
    }
    if (previousSeed == null) {
      delete process.env.SEED_BUNDLED_DATA;
    } else {
      process.env.SEED_BUNDLED_DATA = previousSeed;
    }
  }
});
