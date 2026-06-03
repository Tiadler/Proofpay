const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  deals: [],
  selectedDeal: null,
  network: null,
  summary: null,
  loadingAction: null,
  route: 'dashboard',
  theme: 'dark',
  wallet: null,
  profile: null,
  githubStatus: null
};

let routeRefreshToken = 0;

const routes = {
  dashboard: 'ProofPay Console',
  escrows: 'Escrows',
  create: 'Create Deal',
  proofs: 'Proofs',
  adapter: 'Adapter',
  profile: 'Profile / Settings'
};

const STORAGE_KEYS = {
  theme: 'proofpay.theme',
  wallet: 'proofpay.wallet',
  ledger: 'proofpay.ledger',
  profile: 'proofpay.profile',
  auditLog: 'proofpay.auditLog',
  githubOauthResult: 'proofpay.github.oauthResult'
};

const walletMocks = {
  metamask: {
    label: 'MetaMask',
    address: '0xA7f4c02D9B71E7C6488F271B8A0d8c3f6c32F6A1',
    balance: '1240.50',
    network: 'Ethereum-style wallet (simulated)'
  },
  phantom: {
    label: 'Phantom',
    address: '9Yw1Sg9eYH3jGmDk7bP2nR8LxQ5cV4KzTfP1WqH7aLm',
    balance: '860.00',
    network: 'Solana-style wallet (simulated)'
  }
};

const initialLedger = {
  balances: {},
  escrows: {},
  faucetClaims: {}
};

const programs = [
  {
    title: 'Conditional Escrow',
    status: 'active',
    icon: 'CE',
    description: 'Lock funds and release them when GitHub proof is verified before the deadline.',
    tags: ['Escrow', 'Proofs', 'Live']
  },
  {
    title: 'Guarded Vault',
    status: 'preview',
    icon: 'GV',
    description: 'Team treasury approvals, spend policies, timelocks, and emergency controls.',
    tags: ['Vault', 'Approvals', 'Preview']
  },
  {
    title: 'Programmable Payments',
    status: 'preview',
    icon: 'PP',
    description: 'Scheduled, recurring, claimable, invoice, and batch payment workflows.',
    tags: ['Payments', 'Rules', 'Preview']
  },
  {
    title: 'Automation Rules',
    status: 'experimental',
    icon: 'AR',
    description: 'IF proof, deadline, approval, or oracle event THEN release, refund, or escalate.',
    tags: ['Workflow', 'Signals', 'Beta']
  }
];

const statusLabels = {
  DRAFT: 'Draft',
  FUNDED: 'Funded',
  AWAITING_PROOF: 'Awaiting Proof',
  VERIFIED: 'Verified',
  RELEASED: 'Released',
  REFUNDED: 'Refunded',
  DISPUTED: 'Disputed',
  REJECTED: 'Rejected'
};

async function api(path, options = {}) {
  const res = await fetch(path, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? new Intl.NumberFormat('en-US').format(number) : String(value || 0);
}

function formatDate(value) {
  if (!value) return 'No deadline';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function shortHash(value, size = 8) {
  if (!value) return 'none';
  const text = String(value);
  if (text.length <= size * 2 + 3) return text;
  return `${text.slice(0, size)}...${text.slice(-size)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toast(message, type = 'info') {
  const toastEl = $('#toast');
  toastEl.textContent = message;
  toastEl.className = `toast ${type === 'error' ? 'error' : ''}`.trim();
  toastEl.hidden = false;
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => {
    toastEl.hidden = true;
  }, 4200);
}

function loadJson(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = state.theme;
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  const button = $('#themeToggle');
  if (button) {
    button.setAttribute('aria-label', state.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    button.setAttribute('title', state.theme === 'light' ? 'Dark mode' : 'Light mode');
  }
}

function toggleTheme() {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
}

function getLedger() {
  return loadJson(STORAGE_KEYS.ledger, structuredClone(initialLedger));
}

function setLedger(ledger) {
  saveJson(STORAGE_KEYS.ledger, ledger);
}

function saveWallet() {
  if (state.wallet) {
    saveJson(STORAGE_KEYS.wallet, state.wallet);
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.wallet);
  }
}

function currentLedgerBalance(address) {
  if (!address) return 0;
  const ledger = getLedger();
  return Number(ledger.balances[address] || 0);
}

function ensureWalletBalance(address) {
  if (!address) return;
  const ledger = getLedger();
  if (ledger.balances[address] == null) {
    ledger.balances[address] = 0;
    setLedger(ledger);
  }
}

function setLedgerBalance(address, amount) {
  const ledger = getLedger();
  ledger.balances[address] = Number(amount.toFixed(2));
  setLedger(ledger);
}

function updateLedgerBalance(address, delta) {
  const current = currentLedgerBalance(address);
  setLedgerBalance(address, current + Number(delta));
}

function escrowRecord(dealId) {
  const ledger = getLedger();
  return ledger.escrows[dealId] || null;
}

function setEscrowRecord(dealId, record) {
  const ledger = getLedger();
  ledger.escrows[dealId] = record;
  setLedger(ledger);
}

function faucetClaimCount(address) {
  const ledger = getLedger();
  return ledger.faucetClaims[address] || 0;
}

function markFaucetClaim(address) {
  const ledger = getLedger();
  ledger.faucetClaims[address] = (ledger.faucetClaims[address] || 0) + 1;
  setLedger(ledger);
}

function addAudit(type, message, payload = {}) {
  const logs = loadJson(STORAGE_KEYS.auditLog, []);
  logs.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    message,
    payload,
    createdAt: new Date().toISOString()
  });
  saveJson(STORAGE_KEYS.auditLog, logs.slice(0, 80));
}

function auditLogs() {
  return loadJson(STORAGE_KEYS.auditLog, []);
}

function renderPrograms() {
  $('#programs').innerHTML = programs.map((program) => `
    <article class="program-card">
      <header>
        <span class="program-icon">${program.icon}</span>
        <span class="status-badge ${program.status}">${program.status.toUpperCase()}</span>
      </header>
      <h3>${program.title}</h3>
      <p>${program.description}</p>
      <div class="tag-row">
        ${program.tags.map((tag) => `<span>${tag}</span>`).join('')}
      </div>
    </article>
  `).join('');
}

function walletTokenSymbol() {
  return 'RIALO';
}

function renderWallet() {
  const wallet = state.wallet;
  const summaryEl = $('#walletSummary');
  const faucetButton = $('#faucetButton');
  const connectButton = $('#openWalletModal');
  const profileButton = $('#openProfileMenu');
  const profileAvatar = $('#profileAvatar');

  if (!wallet) {
    summaryEl.innerHTML = `
      <strong>No wallet connected</strong>
      <span>Connect MetaMask or Phantom to simulate ${walletTokenSymbol()} payments</span>
    `;
    $('#createWalletBanner').textContent = `Connect a wallet to use its address as payer and simulate ${walletTokenSymbol()} funding.`;
    $('#walletPanel').innerHTML = `
      <div>
        This environment does not call a real MetaMask or Phantom extension yet. It simulates wallet identity and ${walletTokenSymbol()} balance so you can design the payout flow before Rialo wallet integration is finalized.
      </div>
      <div class="wallet-card-grid">
        <div class="wallet-card">
          <span class="eyebrow">Wallet</span>
          <strong>Disconnected</strong>
        </div>
        <div class="wallet-card">
          <span class="eyebrow">Balance</span>
          <strong>0 ${walletTokenSymbol()}</strong>
        </div>
        <div class="wallet-card">
          <span class="eyebrow">Payer Source</span>
          <strong>Manual input</strong>
        </div>
      </div>
    `;
    faucetButton.hidden = true;
    connectButton.hidden = false;
    profileButton.hidden = true;
    return;
  }

  const balance = currentLedgerBalance(wallet.address).toFixed(2);
  const claims = faucetClaimCount(wallet.address);
  summaryEl.innerHTML = `
    <strong>${wallet.label} | ${shortHash(wallet.address, 6)}</strong>
    <span>${balance} ${walletTokenSymbol()} available | Faucet claims ${claims}</span>
  `;
  $('#createWalletBanner').textContent = `${wallet.label} connected. Payer defaults to ${shortHash(wallet.address, 8)} and token defaults to ${walletTokenSymbol()}.`;
  $('#walletPanel').innerHTML = `
    <div>
      Wallet session is simulated in-browser. Use it to test payer identity, displayed ${walletTokenSymbol()} balance, and payment intent before real Rialo wallet support is wired in.
    </div>
    <div class="wallet-card-grid">
      <div class="wallet-card">
        <span class="eyebrow">Wallet</span>
        <strong>${wallet.label}</strong>
      </div>
      <div class="wallet-card">
        <span class="eyebrow">Address</span>
        <strong class="mono">${wallet.address}</strong>
      </div>
      <div class="wallet-card">
        <span class="eyebrow">Balance</span>
        <strong>${balance} ${walletTokenSymbol()}</strong>
      </div>
      <div class="wallet-card">
        <span class="eyebrow">Faucet Claims</span>
        <strong>${claims}</strong>
      </div>
    </div>
  `;
  faucetButton.hidden = false;
  connectButton.hidden = true;
  profileButton.hidden = false;
  profileAvatar.textContent = (state.profile?.name || wallet.label).slice(0, 2).toUpperCase();
}

function renderGithubProductionPanel() {
  const github = state.profile?.github;
  $('#githubProductionPanel').innerHTML = `
    <div>
      Production verification for private repositories should use a GitHub App with scoped permissions. Raw private repo data stays off-chain; only proof metadata, verifier identity, condition hash, and proof hash move into the payment workflow.
    </div>
    <div class="wallet-card-grid">
      <div class="wallet-card">
        <span class="eyebrow">GitHub App</span>
        <strong>${github?.connected ? 'Installed (simulated)' : 'Not installed'}</strong>
      </div>
      <div class="wallet-card">
        <span class="eyebrow">Verifier Identity</span>
        <strong>${github?.connected ? 'proofpay-github-app/v1' : 'Pending'}</strong>
      </div>
      <div class="wallet-card">
        <span class="eyebrow">Permission Scope</span>
        <strong>${github?.connected ? 'Pull Requests: Read | Checks: Read' : 'None'}</strong>
      </div>
    </div>
    <div class="profile-actions">
      <button class="button ghost" id="openProfileFromAdapter" type="button">${github?.connected ? 'View Connected GitHub' : 'Connect GitHub in Profile'}</button>
    </div>
  `;
}

function renderProfilePage() {
  const profile = state.profile;
  const wallet = state.wallet;
  const github = profile?.github;
  const status = state.githubStatus;
  const balance = wallet ? currentLedgerBalance(wallet.address).toFixed(2) : '0.00';

  $('#profileDetailsPanel').innerHTML = profile && wallet ? `
    <div class="profile-block">
      <strong>${escapeHtml(profile.name)}</strong>
      <span>Created from ${escapeHtml(profile.walletType)} wallet session.</span>
    </div>
    <div class="profile-block">
      <strong>Wallet Address</strong>
      <span class="mono">${escapeHtml(wallet.address)}</span>
    </div>
    <div class="profile-block">
      <strong>RIALO Balance</strong>
      <span>${balance} ${walletTokenSymbol()}</span>
    </div>
    <div class="profile-actions">
      <button class="button danger" id="logoutFromSettingsButton" type="button">Logout</button>
    </div>
  ` : `
    <div class="profile-block">
      <strong>No profile</strong>
      <span>Connect a wallet first. A ProofPay profile is created automatically from the wallet address.</span>
    </div>
  `;

  $('#profileGithubPanel').innerHTML = `
    <div class="profile-block">
      <strong>${github?.connected ? `Connected as ${escapeHtml(github.username)}` : 'GitHub not connected'}</strong>
      <span>${github?.connected ? 'Private repo verification can be simulated for this profile.' : 'Connect GitHub to prepare private repository proof verification.'}</span>
    </div>
    <div class="profile-block">
      <strong>GitHub App Status</strong>
      <span>${status?.configured ? 'OAuth configured on backend' : 'OAuth not configured. Mock connection is available for demo.'}</span>
      <span>${status?.installUrl ? `Install URL: ${status.installUrl}` : 'Set GITHUB_APP_SLUG to generate an install URL.'}</span>
    </div>
    <div class="profile-block">
      <strong>Permissions</strong>
      <span>${github?.permissions?.join(', ') || 'pull_requests:read, checks:read, contents:metadata'}</span>
    </div>
    <div class="profile-actions">
      <button class="button ghost" id="connectGithubButton" type="button">${github?.connected ? 'Reconnect GitHub' : 'Connect GitHub'}</button>
      ${status?.oauthUrl ? `<a class="button primary" href="${status.oauthUrl}">GitHub OAuth</a>` : ''}
      ${status?.installUrl ? `<a class="button ghost" href="${status.installUrl}" target="_blank" rel="noreferrer">Install GitHub App</a>` : ''}
    </div>
  `;

  $('#privateRepoExamples').innerHTML = [
    {
      title: 'Client owns private repo',
      body: 'Client connects wallet, installs the GitHub App on the private repository, then creates an escrow for a developer.',
      points: ['App receives scoped read access', 'Developer does not need full repo admin', 'Payment proof checks PR metadata only']
    },
    {
      title: 'Developer works in invited repo',
      body: 'Developer connects wallet and GitHub identity. The client grants repo access through GitHub, not through ProofPay.',
      points: ['ProofPay sees only verification metadata', 'Raw code remains in GitHub', 'Proof hash anchors the result']
    },
    {
      title: 'Third party cannot see code',
      body: 'The verifier reads GitHub through the installed App, stores private response off-chain, and exposes only result hashes.',
      points: ['condition_hash for deal terms', 'proof_hash for verified result', 'verifier identity for audit']
    }
  ].map((item) => `
    <article class="example-card">
      <h3>${item.title}</h3>
      <p>${item.body}</p>
      <ul>${item.points.map((point) => `<li>${point}</li>`).join('')}</ul>
    </article>
  `).join('');

  const logs = auditLogs();
  $('#sessionAuditLog').innerHTML = logs.length ? logs.map((log) => `
    <div class="event-row">
      <header>
        <strong>${escapeHtml(log.type)}</strong>
        <span class="mono">${formatDate(log.createdAt)}</span>
      </header>
      <p>${escapeHtml(log.message)}</p>
    </div>
  `).join('') : '<div class="details-empty">No session activity yet.</div>';
}

function renderProfileMenu() {
  const profile = state.profile;
  const wallet = state.wallet;
  const github = profile?.github;
  const container = $('#profilePanelContent');

  if (!profile || !wallet) {
    container.innerHTML = `
      <div class="profile-block">
        <strong>No active profile</strong>
        <span>Connect a wallet to create a ProofPay profile.</span>
      </div>
    `;
    return;
  }

  const balance = currentLedgerBalance(wallet.address).toFixed(2);
  container.innerHTML = `
    <div class="profile-block">
      <strong>${escapeHtml(profile.name)}</strong>
      <span>Wallet profile created from ${escapeHtml(wallet.label)} session.</span>
    </div>
    <div class="profile-block">
      <strong>Connected Wallet</strong>
      <span class="mono">${escapeHtml(wallet.address)}</span>
      <span>${balance} ${walletTokenSymbol()} available</span>
    </div>
    <div class="profile-block">
      <strong>GitHub</strong>
      <span>${github?.connected ? `Connected as ${github.username}` : 'Not connected yet'}</span>
      <span>${github?.connected ? 'GitHub App install and OAuth are simulated for private-repo verification narrative.' : 'Connect GitHub to unlock private-repo verification flow.'}</span>
    </div>
    <div class="profile-actions">
      <button class="button ghost" id="connectGithubButton" type="button">${github?.connected ? 'Reconnect GitHub' : 'Connect GitHub'}</button>
      <button class="button danger" id="logoutProfileButton" type="button">Logout</button>
    </div>
  `;
}

function renderStats() {
  const summary = state.summary || {};
  const active = state.deals.filter((deal) => ['FUNDED', 'AWAITING_PROOF', 'VERIFIED', 'DISPUTED'].includes(deal.status)).length;
  const verified = state.deals.filter((deal) => deal.status === 'VERIFIED' || deal.status === 'RELEASED').length;
  const lockedRialo = state.deals.reduce((sum, deal) => {
    const record = escrowRecord(deal.id);
    return sum + Number(record?.lockedAmount || 0);
  }, 0);
  const stats = [
    { label: 'Total Locked', value: `${formatNumber(lockedRialo)} ${walletTokenSymbol()}`, change: `${active} active` },
    { label: 'Released', value: `${formatNumber(summary.releasedAmount)} ${walletTokenSymbol()}`, change: `${verified} verified` },
    { label: 'Escrows', value: formatNumber(summary.deals), change: `${state.deals.length} loaded` },
    { label: 'Proof Events', value: formatNumber(summary.proofs), change: `${formatNumber(summary.events)} logs` }
  ];

  $('#stats').innerHTML = stats.map((stat) => `
    <article class="stat-card">
      <header>
        <span class="program-icon">${stat.label.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span>
        <span class="change">${stat.change}</span>
      </header>
      <p>${stat.label}</p>
      <strong>${stat.value}</strong>
    </article>
  `).join('');
}

function renderNetwork() {
  const network = state.network || {};
  const mode = String(network.mode || 'mock').toUpperCase();
  $('#adapterState').textContent = network.mode ? 'connected' : 'loading';
  $('#adapterMode').textContent = mode;
  $('#sidebarNetwork').textContent = `${mode} ADAPTER`;
  $('#networkConsole').textContent = [
    '$ rialo adapter status',
    `> Mode: ${network.mode || 'mock'}`,
    `> Note: ${network.note || 'Adapter status unavailable'}`,
    '',
    '$ list programs',
    '> conditional_escrow (active)',
    '> guarded_vault (preview)',
    '> payment_automation (preview)',
    '',
    '$ latest selected deal',
    `> deal: ${state.selectedDeal ? shortHash(state.selectedDeal.id, 10) : 'none'}`,
    `> status: ${state.selectedDeal?.status || 'idle'}`
  ].join('\n');

  const adapterCards = [
    { label: 'Adapter Status', value: network.mode ? 'Connected & Ready' : 'Loading' },
    { label: 'Execution Mode', value: `${network.mode || 'mock'} adapter` },
    { label: 'Proof Verifier', value: 'GitHub PR verifier active' },
    { label: 'Pending Transactions', value: `${state.deals.filter((deal) => ['DRAFT', 'FUNDED', 'AWAITING_PROOF', 'VERIFIED'].includes(deal.status)).length}` },
    { label: 'Payment Token', value: walletTokenSymbol() },
    { label: 'Wallet Source', value: state.wallet ? `${state.wallet.label} simulated` : 'Disconnected' }
  ];

  $('#adapterCards').innerHTML = adapterCards.map((card) => `
    <div class="adapter-card">
      <span class="eyebrow">${card.label}</span>
      <b>${escapeHtml(card.value)}</b>
    </div>
  `).join('');

  $('#moduleList').innerHTML = [
    ['Conditional Escrow', 'v1.0.0 mock program', 'LIVE'],
    ['Guarded Vault', 'v0.1.0 roadmap module', 'PREVIEW'],
    ['Payment Automation', 'v0.2.0 roadmap module', 'BETA']
  ].map(([name, meta, status]) => `
    <div class="module-row">
      <div>
        <strong>${name}</strong>
        <p>${meta}</p>
      </div>
      <span class="status-badge ${status === 'LIVE' ? 'active' : status === 'PREVIEW' ? 'preview' : 'experimental'}">${status}</span>
    </div>
  `).join('');
}

function latestProof(deal) {
  return deal?.proofs?.[0] || null;
}

function proofStatusForDeal(deal) {
  const proof = latestProof(deal);
  if (deal?.status === 'VERIFIED' || deal?.status === 'RELEASED') return 'VERIFIED';
  if (proof?.verificationStatus) return proof.verificationStatus;
  if (deal?.proofTxHash) return 'SUBMITTED';
  return 'PENDING';
}

function pipelineSteps(deal) {
  if (!deal) {
    return [
      { title: 'Escrow Created', description: 'No escrow selected yet.', state: 'current' },
      { title: 'Funds Locked', description: 'Select a deal to inspect funding state.', state: 'pending' },
      { title: 'Proof Verified', description: 'GitHub proof has not been evaluated.', state: 'pending' },
      { title: 'Payment Action', description: 'Release or refund once policy allows it.', state: 'pending' }
    ];
  }

  const funded = ['FUNDED', 'AWAITING_PROOF', 'VERIFIED', 'RELEASED', 'DISPUTED'].includes(deal.status);
  const proofStatus = proofStatusForDeal(deal);
  const paymentDone = ['RELEASED', 'REFUNDED'].includes(deal.status);

  return [
    {
      title: 'Escrow Created',
      description: deal.createEscrowTxHash ? `tx ${shortHash(deal.createEscrowTxHash)}` : `account ${shortHash(deal.rialoEscrowAccount)}`,
      state: 'done'
    },
    {
      title: 'Funds Locked',
      description: deal.fundingTxHash ? `fund ${shortHash(deal.fundingTxHash)}` : 'Waiting for mock funding transaction.',
      state: funded ? 'done' : 'current'
    },
    {
      title: 'Proof Verified',
      description: proofStatus === 'VERIFIED'
        ? `proof ${shortHash(deal.proofTxHash || latestProof(deal)?.proofHash)}`
        : `status ${proofStatus.toLowerCase().replaceAll('_', ' ')}`,
      state: proofStatus === 'VERIFIED' ? 'done' : funded ? 'current' : 'pending'
    },
    {
      title: 'Payment Action',
      description: deal.releaseTxHash
        ? `released ${shortHash(deal.releaseTxHash)}`
        : deal.refundTxHash
          ? `refunded ${shortHash(deal.refundTxHash)}`
          : 'Release after verified proof or refund manually.',
      state: paymentDone ? 'done' : deal.status === 'VERIFIED' ? 'current' : 'pending'
    }
  ];
}

function renderPipeline() {
  const deal = state.selectedDeal;
  $('#selectedDealId').textContent = deal ? shortHash(deal.id, 10) : 'No deal';
  $('#pipeline').innerHTML = pipelineSteps(deal).map((step, index) => `
    <div class="pipeline-step ${step.state}">
      <div class="pipeline-dot">${step.state === 'done' ? 'OK' : String(index + 1).padStart(2, '0')}</div>
      <div>
        <h3>${step.title}</h3>
        <p>${escapeHtml(step.description)}</p>
      </div>
    </div>
  `).join('');

  if (!deal) {
    $('#selectedActions').innerHTML = '<span class="mono">Select a row in Recent Escrows.</span>';
    return;
  }

  $('#selectedActions').innerHTML = `
    <button class="button ghost" data-action="fund" ${canFund(deal) ? '' : 'disabled'}>Fund</button>
    <button class="button ghost" data-action="verify" ${canVerify(deal) ? '' : 'disabled'}>Verify GitHub</button>
    <button class="button primary" data-action="release" ${canRelease(deal) ? '' : 'disabled'}>Release</button>
    <button class="button danger" data-action="refund" ${canRefund(deal) ? '' : 'disabled'}>Refund</button>
  `;
}

function canFund(deal) {
  const enoughBalance = state.wallet
    ? currentLedgerBalance(state.wallet.address) >= Number(deal.amount || 0)
    : true;
  return ['DRAFT', 'AWAITING_FUNDING'].includes(deal.status) && enoughBalance;
}

function canVerify(deal) {
  return !['RELEASED', 'REFUNDED', 'DISPUTED'].includes(deal.status);
}

function canRelease(deal) {
  return deal.status === 'VERIFIED';
}

function canRefund(deal) {
  return deal.status !== 'RELEASED' && deal.status !== 'REFUNDED';
}

function conditionLabel(deal) {
  const payload = deal.conditionPayload || {};
  const repo = [payload.owner, payload.repo].filter(Boolean).join('/');
  const pr = payload.pullNumber ? `#${payload.pullNumber}` : 'PR missing';
  return repo ? `${repo} ${pr}` : 'GitHub PR condition';
}

function renderDeals() {
  const filter = $('#statusFilter').value;
  const deals = filter === 'all' ? state.deals : state.deals.filter((deal) => deal.status === filter);
  const selectedId = state.selectedDeal?.id;

  if (!deals.length) {
    $('#dealsTable').innerHTML = `
      <tr>
        <td colspan="6">
          <div class="details-empty">No escrows match the current filter.</div>
        </td>
      </tr>
    `;
    return;
  }

  $('#dealsTable').innerHTML = deals.map((deal) => `
    <tr data-deal-id="${deal.id}" class="${deal.id === selectedId ? 'selected' : ''}">
      <td class="deal-title-cell">
        <strong>${escapeHtml(deal.title)}</strong>
        <span>${shortHash(deal.id, 10)} | ${escapeHtml(deal.payerAddress)} -> ${escapeHtml(deal.payeeAddress)}</span>
      </td>
      <td><strong>${escapeHtml(deal.amount)} ${escapeHtml(deal.tokenSymbol)}</strong></td>
      <td><span class="status-badge ${deal.status}">${statusLabels[deal.status] || deal.status}</span></td>
      <td>${escapeHtml(conditionLabel(deal))}</td>
      <td>${formatDate(deal.deadline)}</td>
      <td>
        <div class="row-actions">
          <button class="button ghost" data-action="details" data-id="${deal.id}">View</button>
          <button class="button ghost" data-action="fund" data-id="${deal.id}" ${canFund(deal) ? '' : 'disabled'}>Fund</button>
          <button class="button ghost" data-action="verify" data-id="${deal.id}" ${canVerify(deal) ? '' : 'disabled'}>Verify</button>
          <button class="button primary" data-action="release" data-id="${deal.id}" ${canRelease(deal) ? '' : 'disabled'}>Release</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderDetails() {
  const deal = state.selectedDeal;
  if (!deal) {
    $$('.deal-details').forEach((detailsEl) => {
      detailsEl.className = 'deal-details details-empty';
      detailsEl.textContent = 'Select an escrow to inspect condition hashes, transaction hashes, proofs, and events.';
    });
    return;
  }

  const detailRows = [
    ['Status', statusLabels[deal.status] || deal.status],
    ['Escrow Account', deal.rialoEscrowAccount || 'not created'],
    ['Program ID', deal.rialoProgramId || 'not assigned'],
    ['Condition Hash', deal.conditionHash],
    ['Funding Tx', deal.fundingTxHash || 'pending'],
    ['Proof Tx', deal.proofTxHash || 'pending'],
    ['Release Tx', deal.releaseTxHash || 'pending'],
    ['Refund Tx', deal.refundTxHash || 'pending']
  ];
  const record = escrowRecord(deal.id);
  if (record) detailRows.splice(4, 0, ['Locked RIALO', String(record.lockedAmount)]);

  const proofs = deal.proofs || [];
  const events = deal.events || [];

  $$('.deal-details').forEach((detailsEl) => {
    detailsEl.className = 'deal-details details-content';
    detailsEl.innerHTML = `
    <div class="details-list">
      ${detailRows.map(([label, value]) => `
        <div class="detail-row">
          <strong>${label}</strong>
          <span class="mono">${escapeHtml(value)}</span>
        </div>
      `).join('')}
    </div>

    <h3>Proofs</h3>
    <div class="proof-list">
      ${proofs.length ? proofs.map((proof) => `
        <div class="proof-row">
          <header>
            <strong>${escapeHtml(proof.proofType)}</strong>
            <span class="status-badge ${proof.verificationStatus}">${escapeHtml(proof.verificationStatus)}</span>
          </header>
          <p>${escapeHtml(proof.verifierReason || 'No verifier reason')}</p>
          <p class="mono">${escapeHtml(proof.proofHash || 'no proof hash')}</p>
        </div>
      `).join('') : '<div class="details-empty">No proof records yet.</div>'}
    </div>

    <h3>Events</h3>
    <div class="event-list">
      ${events.length ? events.map((event) => `
        <div class="event-row">
          <header>
            <strong>${escapeHtml(event.eventType)}</strong>
            <span class="mono">${formatDate(event.createdAt)}</span>
          </header>
          <p>${escapeHtml(JSON.stringify(event.payload))}</p>
        </div>
      `).join('') : '<div class="details-empty">No event records yet.</div>'}
    </div>
  `;
  });
}

function renderAll() {
  renderStats();
  renderPrograms();
  renderWallet();
  renderGithubProductionPanel();
  renderNetwork();
  renderPipeline();
  renderDeals();
  renderDetails();
  renderProfileMenu();
  renderProfilePage();
  renderRoute();
}

async function loadSystem() {
  const [network, summary, githubStatus] = await Promise.all([
    api('/api/system/rialo'),
    api('/api/system/summary'),
    api('/api/github/status')
  ]);
  state.network = network;
  state.summary = summary;
  state.githubStatus = githubStatus;
}

async function loadDeals({ preserveSelection = true } = {}) {
  state.deals = await api('/api/deals');
  if (preserveSelection && state.selectedDeal) {
    const current = state.deals.find((deal) => deal.id === state.selectedDeal.id);
    state.selectedDeal = current ? await api(`/api/deals/${current.id}`) : null;
  } else if (state.deals.length) {
    state.selectedDeal = await api(`/api/deals/${state.deals[0].id}`);
  } else {
    state.selectedDeal = null;
  }
}

async function selectDeal(id) {
  state.selectedDeal = await api(`/api/deals/${id}`);
  renderAll();
}

async function refresh() {
  await loadSystem();
  await loadDeals();
  renderAll();
}

async function runAction(action, dealId = state.selectedDeal?.id) {
  if (!dealId || state.loadingAction) return;

  const paths = {
    details: `/api/deals/${dealId}`,
    fund: `/api/deals/${dealId}/fund`,
    verify: `/api/deals/${dealId}/verify/github`,
    release: `/api/deals/${dealId}/release`,
    refund: `/api/deals/${dealId}/refund`
  };

  try {
    state.loadingAction = action;
    if (action === 'details') {
      await selectDeal(dealId);
      return;
    }

    const deal = state.deals.find((item) => item.id === dealId) || state.selectedDeal;
    if (action === 'fund') enforceFundSimulation(deal);
    await api(paths[action], { method: 'POST', body: {} });
    if (action === 'release') applyReleaseSimulation(deal);
    if (action === 'refund') applyRefundSimulation(deal);
    toast(`${action} completed for ${shortHash(dealId, 8)}`);
    await loadSystem();
    await loadDeals();
    renderAll();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    state.loadingAction = null;
  }
}

function defaultDeadlineLocal() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function resetForm() {
  const form = $('#dealForm');
  form.reset();
  form.elements.title.value = 'Fix checkout bug';
  form.elements.amount.value = '100';
  form.elements.tokenSymbol.value = walletTokenSymbol();
  form.elements.payerAddress.value = state.wallet?.address || 'rialo_client_demo';
  form.elements.payeeAddress.value = 'rialo_freelancer_demo';
  form.elements.description.value = 'Payment releases automatically when the GitHub PR is merged before the deadline.';
  form.elements.deadline.value = defaultDeadlineLocal();
}

function connectWallet(type) {
  const mock = walletMocks[type];
  if (!mock) return;
  ensureWalletBalance(mock.address);
  state.wallet = { ...mock, type };
  saveWallet();
  state.profile = {
    name: `${mock.label} User`,
    walletAddress: mock.address,
    walletType: mock.label,
    github: null
  };
  saveJson(STORAGE_KEYS.profile, state.profile);
  addAudit('wallet.connect', `${mock.label} wallet connected`, { address: mock.address });
  resetForm();
  renderAll();
  toast(`${mock.label} connected in simulated mode`);
}

function logoutProfile() {
  state.wallet = null;
  state.profile = null;
  saveWallet();
  sessionStorage.removeItem(STORAGE_KEYS.profile);
  addAudit('profile.logout', 'Profile logged out');
  resetForm();
  closeProfileMenu();
  renderAll();
  toast('Profile logged out');
}

function openWalletModal() {
  $('#walletModal').hidden = false;
  $('#walletModalBackdrop').hidden = false;
}

function closeWalletModal() {
  $('#walletModal').hidden = true;
  $('#walletModalBackdrop').hidden = true;
}

function openProfileMenu() {
  if (!state.profile) return;
  renderProfileMenu();
  $('#profileMenu').hidden = false;
  $('#profileMenuBackdrop').hidden = false;
}

function closeProfileMenu() {
  $('#profileMenu').hidden = true;
  $('#profileMenuBackdrop').hidden = true;
}

function connectGithub() {
  if (!state.profile) return;
  state.profile = {
    ...state.profile,
    github: {
      connected: true,
      username: state.wallet?.type === 'phantom' ? 'proofpay-phantom-dev' : 'proofpay-metamask-dev',
      installation: 'proofpay-github-app',
      permissions: ['pull_requests:read', 'checks:read']
    }
  };
  saveJson(STORAGE_KEYS.profile, state.profile);
  addAudit('github.connect', `GitHub connected as ${state.profile.github.username}`, state.profile.github);
  renderAll();
  toast('GitHub connected in simulated production mode');
}

function applyGithubOauthResult() {
  const raw = sessionStorage.getItem(STORAGE_KEYS.githubOauthResult);
  if (!raw || !state.profile) return;
  try {
    const result = JSON.parse(raw);
    state.profile = {
      ...state.profile,
      github: {
        connected: true,
        username: result.username,
        installation: 'github-oauth',
        permissions: result.permissions || ['repo:read', 'pull_requests:read', 'checks:read'],
        verifier: result.verifier || 'proofpay-github-oauth/v1'
      }
    };
    saveJson(STORAGE_KEYS.profile, state.profile);
    addAudit('github.oauth', `GitHub OAuth connected as ${result.username}`, result);
  } finally {
    sessionStorage.removeItem(STORAGE_KEYS.githubOauthResult);
  }
}

function enforceFundSimulation(deal) {
  if (!deal) throw new Error('Deal not found');
  if (!state.wallet) throw new Error('Connect a wallet before funding a deal');
  if (deal.payerAddress !== state.wallet.address) {
    throw new Error('Connected wallet must match payer address to fund this deal');
  }

  const amount = Number(deal.amount || 0);
  const balance = currentLedgerBalance(state.wallet.address);
  const existing = escrowRecord(deal.id);
  if (existing?.funded) return;
  if (balance < amount) throw new Error(`Insufficient ${walletTokenSymbol()} balance. Use Faucet first.`);

  updateLedgerBalance(state.wallet.address, -amount);
  setEscrowRecord(deal.id, {
    payerAddress: deal.payerAddress,
    payeeAddress: deal.payeeAddress,
    tokenSymbol: walletTokenSymbol(),
    lockedAmount: amount,
    funded: true,
    released: false,
    refunded: false
  });
  addAudit('wallet.fund', `Locked ${amount} ${walletTokenSymbol()} for deal ${shortHash(deal.id, 8)}`, {
    dealId: deal.id,
    payerAddress: deal.payerAddress,
    amount
  });
}

function applyReleaseSimulation(deal) {
  if (!deal) return;
  const existing = escrowRecord(deal.id);
  if (!existing || existing.released || existing.refunded) return;

  ensureWalletBalance(deal.payeeAddress);
  updateLedgerBalance(deal.payeeAddress, existing.lockedAmount);
  setEscrowRecord(deal.id, {
    ...existing,
    lockedAmount: 0,
    released: true
  });
  addAudit('wallet.release', `Released ${existing.lockedAmount} ${walletTokenSymbol()} to ${shortHash(deal.payeeAddress, 8)}`, {
    dealId: deal.id,
    payeeAddress: deal.payeeAddress,
    amount: existing.lockedAmount
  });
}

function applyRefundSimulation(deal) {
  if (!deal) return;
  const existing = escrowRecord(deal.id);
  if (!existing || existing.refunded || existing.released) return;

  ensureWalletBalance(deal.payerAddress);
  updateLedgerBalance(deal.payerAddress, existing.lockedAmount);
  setEscrowRecord(deal.id, {
    ...existing,
    lockedAmount: 0,
    refunded: true
  });
  addAudit('wallet.refund', `Refunded ${existing.lockedAmount} ${walletTokenSymbol()} to ${shortHash(deal.payerAddress, 8)}`, {
    dealId: deal.id,
    payerAddress: deal.payerAddress,
    amount: existing.lockedAmount
  });
}

async function faucet() {
  if (!state.wallet || state.loadingAction) return;

  state.loadingAction = 'faucet';
  const button = $('#faucetButton');
  const originalLabel = button.textContent;
  button.textContent = 'Faucet processing...';
  button.disabled = true;
  try {
    const delay = 1000 + Math.floor(Math.random() * 1000);
    await new Promise((resolve) => setTimeout(resolve, delay));
    ensureWalletBalance(state.wallet.address);
    updateLedgerBalance(state.wallet.address, 100);
    markFaucetClaim(state.wallet.address);
    addAudit('wallet.faucet', `Faucet sent 100 ${walletTokenSymbol()} to ${shortHash(state.wallet.address, 8)}`, {
      address: state.wallet.address,
      amount: 100
    });
    renderAll();
    toast(`Faucet sent 100 ${walletTokenSymbol()} to ${shortHash(state.wallet.address, 6)}`);
  } finally {
    state.loadingAction = null;
    button.textContent = originalLabel;
    button.disabled = false;
  }
}

function bindEvents() {
  $('#themeToggle').addEventListener('click', toggleTheme);
  $('#reloadDeals').addEventListener('click', refresh);
  $('#statusFilter').addEventListener('change', () => {
    renderDeals();
  });
  $('#resetForm').addEventListener('click', resetForm);
  $('#openWalletModal').addEventListener('click', openWalletModal);
  $('#openProfileMenu').addEventListener('click', openProfileMenu);
  $('#closeProfileMenu').addEventListener('click', closeProfileMenu);
  $('#closeWalletModal').addEventListener('click', closeWalletModal);
  $('#walletModalBackdrop').addEventListener('click', closeWalletModal);
  $('#profileMenuBackdrop').addEventListener('click', closeProfileMenu);
  $('#faucetButton').addEventListener('click', faucet);
  $$('.wallet-provider').forEach((button) => {
    button.addEventListener('click', () => {
      connectWallet(button.dataset.wallet);
      closeWalletModal();
    });
  });

  $('#dealForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const deadlineRaw = form.get('deadline');
    const pullNumber = Number(form.get('pullNumber'));

    const payload = {
      title: form.get('title'),
      description: form.get('description'),
      amount: form.get('amount'),
      tokenSymbol: form.get('tokenSymbol'),
      payerAddress: form.get('payerAddress'),
      payeeAddress: form.get('payeeAddress'),
      conditionType: 'github_pr_merged',
      deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
      conditionPayload: {
        owner: String(form.get('owner') || '').trim(),
        repo: String(form.get('repo') || '').trim(),
        pullNumber: Number.isFinite(pullNumber) ? pullNumber : 0,
        expectedAuthor: String(form.get('expectedAuthor') || '').trim() || undefined,
        deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null
      }
    };

    try {
      const deal = await api('/api/deals', { method: 'POST', body: payload });
      toast(`Escrow created: ${shortHash(deal.id, 8)}`);
      state.selectedDeal = await api(`/api/deals/${deal.id}`);
      navigateTo('escrows');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  $('#dealsTable').addEventListener('click', async (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      event.stopPropagation();
      await runAction(actionButton.dataset.action, actionButton.dataset.id);
      return;
    }

    const row = event.target.closest('[data-deal-id]');
    if (row) await selectDeal(row.dataset.dealId);
  });

  $('#selectedActions').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (button) await runAction(button.dataset.action);
  });

  document.addEventListener('click', (event) => {
    if (event.target.id === 'connectGithubButton') connectGithub();
    if (event.target.id === 'logoutProfileButton') logoutProfile();
    if (event.target.id === 'logoutFromSettingsButton') logoutProfile();
    if (event.target.id === 'openProfileFromAdapter') {
      openProfileMenu();
      navigateTo('adapter');
    }
  });

  $('#openSidebar').addEventListener('click', openSidebar);
  $('#toggleSidebar').addEventListener('click', toggleSidebarControl);
  $('#mobileShade').addEventListener('click', closeMobileSidebar);

  $$('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      closeMobileSidebar();
    });
  });

  window.addEventListener('resize', syncSidebarControls);
  window.addEventListener('hashchange', () => {
    state.route = routeFromHash();
    renderRoute();
    refreshRouteData();
  });
}

function isMobileSidebar() {
  return window.matchMedia('(max-width: 860px)').matches;
}

function setSidebarCollapsed(collapsed) {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  localStorage.setItem('proofpay.sidebarCollapsed', collapsed ? 'true' : 'false');
  syncSidebarControls();
}

function openSidebar() {
  if (isMobileSidebar()) {
    $('#sidebar').classList.add('open');
    $('#mobileShade').hidden = false;
    return;
  }

  setSidebarCollapsed(false);
}

function closeMobileSidebar() {
  $('#sidebar').classList.remove('open');
  $('#mobileShade').hidden = true;
}

function toggleSidebarControl() {
  if (isMobileSidebar()) {
    closeMobileSidebar();
    return;
  }

  setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed'));
}

function syncSidebarControls() {
  const collapsed = document.body.classList.contains('sidebar-collapsed');
  const toggle = $('#toggleSidebar');
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  }

  if (!isMobileSidebar()) closeMobileSidebar();
}

function routeFromHash() {
  const route = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
  return routes[route] ? route : 'dashboard';
}

function navigateTo(route) {
  if (!routes[route]) return;
  if (window.location.hash !== `#/${route}`) {
    window.location.hash = `/${route}`;
    return;
  }
  state.route = route;
  renderRoute();
  refreshRouteData();
}

function renderRoute() {
  state.route = routes[state.route] ? state.route : routeFromHash();
  $$('.page').forEach((page) => {
    page.classList.toggle('active', page.dataset.page === state.route);
  });
  $$('.nav-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === state.route);
  });
  $('#pageTitle').textContent = routes[state.route] || routes.dashboard;
  window.scrollTo(0, 0);
}

async function refreshRouteData() {
  if (state.route !== 'escrows') return;

  const token = ++routeRefreshToken;
  try {
    await loadSystem();
    await loadDeals();
    if (token !== routeRefreshToken || state.route !== 'escrows') return;
    renderAll();
  } catch (err) {
    if (token === routeRefreshToken) toast(err.message, 'error');
    throw err;
  }
}

async function init() {
  applyTheme(loadTheme());
  if (localStorage.getItem('proofpay.sidebarCollapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
  }
  state.wallet = loadJson(STORAGE_KEYS.wallet, null);
  state.profile = loadJson(STORAGE_KEYS.profile, null);
  applyGithubOauthResult();
  bindEvents();
  syncSidebarControls();
  resetForm();
  state.route = routeFromHash();
  if (!window.location.hash) window.location.hash = '/dashboard';
  renderPrograms();
  try {
    await refresh();
    await refreshRouteData();
  } catch (err) {
    toast(err.message, 'error');
    renderAll();
  }
}

await init();
