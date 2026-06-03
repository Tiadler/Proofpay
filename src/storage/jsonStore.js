import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const bundledDataFile = path.resolve(process.cwd(), 'data', 'proofpay.json');
const runsOnReadonlyServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);
const defaultDataDir = runsOnReadonlyServerless
  ? path.join(os.tmpdir(), 'proofpay-rialo')
  : path.resolve(process.cwd(), 'data');
const DATA_DIR = path.resolve(process.env.DATA_DIR || defaultDataDir);
const DATA_FILE = path.join(DATA_DIR, 'proofpay.json');

const initialState = {
  deals: [],
  vaults: [],
  payments: [],
  automations: [],
  proofs: [],
  events: []
};

async function initialStore() {
  if (DATA_FILE === bundledDataFile) return initialState;

  try {
    const raw = await fs.readFile(bundledDataFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return initialState;
  }
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
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

export async function writeStore(state) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2));
  return state;
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
