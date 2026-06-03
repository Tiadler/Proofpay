import test from 'node:test';
import assert from 'node:assert/strict';
import { GithubPrVerifier } from '../src/verifiers/githubPrVerifier.js';

test('GitHub PR verifier rejects missing repository fields without network calls', async () => {
  const verifier = new GithubPrVerifier({ token: null });
  const result = await verifier.verify({ owner: '', repo: '', pullNumber: 0 });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'MISSING_GITHUB_FIELDS');
  assert.match(result.proofHash, /^[a-f0-9]{64}$/);
  assert.deepEqual(result.metadata, {});
});

test('GitHub PR verifier accepts merged PR metadata from fetch', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        merged_at: '2026-06-01T00:00:00.000Z',
        user: { login: 'dev' },
        title: 'Ship fix',
        state: 'closed',
        merge_commit_sha: 'abc123',
        base: { ref: 'main' },
        head: { ref: 'feature' }
      };
    }
  });

  try {
    const verifier = new GithubPrVerifier({ token: null });
    const result = await verifier.verify({
      owner: 'proofpay',
      repo: 'demo',
      pullNumber: 7,
      expectedAuthor: 'dev',
      deadline: '2026-06-02T00:00:00.000Z'
    });

    assert.equal(result.ok, true);
    assert.equal(result.reason, 'PR_MERGED');
    assert.equal(result.metadata.author, 'dev');
    assert.match(result.proofHash, /^[a-f0-9]{64}$/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
