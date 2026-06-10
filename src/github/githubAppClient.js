import crypto from 'node:crypto';

const githubApiBaseUrl = 'https://api.github.com';
const userAgent = 'ProofPay-Rialo-Prototype';

function base64url(value) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function privateKeyFromEnv(env = process.env) {
  if (env.GITHUB_APP_PRIVATE_KEY_BASE64) {
    return Buffer.from(env.GITHUB_APP_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  }
  if (env.GITHUB_APP_PRIVATE_KEY) {
    return env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  return '';
}

export function githubAppConfig(env = process.env) {
  const privateKey = privateKeyFromEnv(env);
  return {
    appId: env.GITHUB_APP_ID || '',
    appSlug: env.GITHUB_APP_SLUG || '',
    privateKey,
    configured: Boolean(env.GITHUB_APP_ID && privateKey)
  };
}

export function createGithubAppJwt({ appId, privateKey, now = Date.now() }) {
  if (!appId || !privateKey) {
    throw new Error('GitHub App ID and private key are required to create a JWT');
  }

  const issuedAt = Math.floor(now / 1000) - 60;
  const expiresAt = Math.floor(now / 1000) + 540;
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ iat: issuedAt, exp: expiresAt, iss: String(appId) }));
  const data = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url');

  return `${data}.${signature}`;
}

async function githubFetch(url, { method = 'GET', token, body, fetchImpl = fetch }) {
  const response = await fetchImpl(url, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': userAgent,
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.message || `GitHub API request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function getInstallationToken(installationId, options = {}) {
  const { appId, privateKey } = githubAppConfig(options.env || process.env);
  const jwt = createGithubAppJwt({
    appId: options.appId || appId,
    privateKey: options.privateKey || privateKey,
    now: options.now || Date.now()
  });

  const payload = await githubFetch(`${githubApiBaseUrl}/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    token: jwt,
    fetchImpl: options.fetchImpl
  });

  return {
    token: payload.token,
    expiresAt: payload.expires_at,
    permissions: payload.permissions || {},
    repositorySelection: payload.repository_selection || null
  };
}

export async function fetchInstallationRepositories(installationId, options = {}) {
  const token = options.token || (await getInstallationToken(installationId, options)).token;
  const payload = await githubFetch(`${githubApiBaseUrl}/installation/repositories?per_page=100`, {
    token,
    fetchImpl: options.fetchImpl
  });

  return (payload.repositories || []).map((repo) => ({
    id: repo.id,
    owner: repo.owner?.login || repo.full_name?.split('/')[0] || '',
    name: repo.name,
    fullName: repo.full_name,
    private: Boolean(repo.private)
  }));
}

export async function fetchPullRequestWithInstallation({ installationId, owner, repo, pullNumber }, options = {}) {
  const token = options.token || (await getInstallationToken(installationId, options)).token;
  return githubFetch(`${githubApiBaseUrl}/repos/${owner}/${repo}/pulls/${pullNumber}`, {
    token,
    fetchImpl: options.fetchImpl
  });
}
