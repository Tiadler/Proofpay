import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'proofpay.json');

const initialState = {
  deals: [],
  vaults: [],
  payments: [],
  automations: [],
  proofs: [],
  events: []
};

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(initialState, null, 2));
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
