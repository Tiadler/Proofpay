import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  createGithubAppJwt,
  fetchInstallationRepositories,
  getInstallationToken,
  githubAppConfig
} from '../src/github/githubAppClient.js';

function testPrivateKey() {
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  return privateKey.export({ type: 'pkcs8', format: 'pem' });
}

test('GitHub App config reads base64 private key env', () => {
  const privateKey = testPrivateKey();
  const config = githubAppConfig({
    GITHUB_APP_ID: '123',
    GITHUB_APP_SLUG: 'proofpay-test',
    GITHUB_APP_PRIVATE_KEY_BASE64: Buffer.from(privateKey).toString('base64')
  });

  assert.equal(config.configured, true);
  assert.equal(config.appId, '123');
  assert.equal(config.appSlug, 'proofpay-test');
  assert.equal(config.privateKey, privateKey);
});

test('GitHub App JWT has expected claims', () => {
  const jwt = createGithubAppJwt({
    appId: '123',
    privateKey: testPrivateKey(),
    now: Date.parse('2026-06-01T00:00:00.000Z')
  });
  const [header, payload, signature] = jwt.split('.');

  assert.equal(JSON.parse(Buffer.from(header, 'base64url').toString('utf8')).alg, 'RS256');
  assert.equal(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).iss, '123');
  assert.ok(signature);
});

test('GitHub App client exchanges installation token and lists repositories', async () => {
  const privateKey = testPrivateKey();
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url: String(url), method: options.method || 'GET', authorization: options.headers.Authorization });

    if (String(url).endsWith('/app/installations/999/access_tokens')) {
      return Response.json({
        token: 'installation-token',
        expires_at: '2026-06-01T01:00:00.000Z',
        permissions: { pull_requests: 'read' },
        repository_selection: 'selected'
      });
    }

    if (String(url).includes('/installation/repositories')) {
      return Response.json({
        repositories: [
          {
            id: 101,
            name: 'private-api',
            full_name: 'company/private-api',
            private: true,
            owner: { login: 'company' }
          }
        ]
      });
    }

    return Response.json({ message: 'unexpected' }, { status: 404 });
  };

  const token = await getInstallationToken('999', { appId: '123', privateKey, fetchImpl });
  const repositories = await fetchInstallationRepositories('999', { token: token.token, fetchImpl });

  assert.equal(token.token, 'installation-token');
  assert.equal(token.repositorySelection, 'selected');
  assert.deepEqual(repositories, [
    {
      id: 101,
      owner: 'company',
      name: 'private-api',
      fullName: 'company/private-api',
      private: true
    }
  ]);
  assert.equal(requests[0].method, 'POST');
  assert.match(requests[0].authorization, /^Bearer /);
  assert.equal(requests[1].authorization, 'Bearer installation-token');
});
