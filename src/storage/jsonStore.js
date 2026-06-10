import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const bundledDataFile = path.resolve(process.cwd(), 'data', 'proofpay.json');
const remoteStoreUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const remoteStoreToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const remoteStoreKey = process.env.PROOFPAY_STORE_KEY || 'proofpay:state';
const usesRemoteStore = Boolean(remoteStoreUrl && remoteStoreToken);
const runsOnReadonlyServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);
const defaultDataDir = runsOnReadonlyServerless
  ? path.join(os.tmpdir(), 'proofpay-rialo')
  : path.resolve(process.cwd(), 'data');

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return Boolean(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function safeDataDir() {
  const requested = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : null;
  if (!requested) return defaultDataDir;
  if (!runsOnReadonlyServerless) return requested;

  const readonlyRoots = [
    process.cwd(),
    process.env.LAMBDA_TASK_ROOT
  ].filter(Boolean).map((dir) => path.resolve(dir));

  const pointsToReadonlyBundle = readonlyRoots.some((root) => requested === root || isInside(root, requested));
  return pointsToReadonlyBundle ? defaultDataDir : requested;
}

const DATA_DIR = safeDataDir();
const DATA_FILE = path.join(DATA_DIR, 'proofpay.json');

const initialState = {
  users: [],
  sessions: [],
  githubInstallations: [],
  githubRepositories: [],
  deals: [],
  vaults: [],
  payments: [],
  automations: [],
  proofs: [],
  events: []
};

async function initialStore() {
  if (runsOnReadonlyServerless && process.env.SEED_BUNDLED_DATA !== 'true') {
    return initialState;
  }

  if (DATA_FILE === bundledDataFile) return initialState;

  try {
    const raw = await fs.readFile(bundledDataFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return initialState;
  }
}

async function remoteCommand(command) {
  const response = await fetch(remoteStoreUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${remoteStoreToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    throw new Error(payload.error || `Remote store command failed: ${response.status}`);
  }
  return payload.result;
}

async function readRemoteStore() {
  const raw = await remoteCommand(['GET', remoteStoreKey]);
  if (!raw) {
    const state = await initialStore();
    await writeRemoteStore(state);
    return state;
  }
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function writeRemoteStore(state) {
  await remoteCommand(['SET', remoteStoreKey, JSON.stringify(state)]);
  return state;
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(await initialStore(), null, 2));
  }
}

export async function readStore() {
  if (usesRemoteStore) return readRemoteStore();

  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

export async function writeStore(state) {
  if (usesRemoteStore) return writeRemoteStore(state);

  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2));
  return state;
}

export function storageInfo() {
  return {
    provider: usesRemoteStore ? 'remote-kv' : runsOnReadonlyServerless ? 'temp-file' : 'local-file',
    dataDir: usesRemoteStore ? null : DATA_DIR,
    dataFile: usesRemoteStore ? null : DATA_FILE,
    remoteKey: usesRemoteStore ? remoteStoreKey : null,
    hasRemoteUrl: Boolean(remoteStoreUrl),
    hasRemoteToken: Boolean(remoteStoreToken),
    runsOnReadonlyServerless,
    requestedDataDir: process.env.DATA_DIR || null,
    ignoredReadonlyDataDir: Boolean(process.env.DATA_DIR && runsOnReadonlyServerless && path.resolve(process.env.DATA_DIR) !== DATA_DIR),
    cwd: process.cwd()
  };
}

export async function updateStore(mutator) {
  const state = await readStore();
  const result = await mutator(state);
  await writeStore(state);
  return result;
}

export async function appendEvent(dealId, eventType, payload = {}) {
  return updateStore((state) => {
    const event = {
      id: crypto.randomUUID(),
      dealId,
      eventType,
      payload,
      createdAt: new Date().toISOString()
    };
    state.events.unshift(event);
    return event;
  });
}
