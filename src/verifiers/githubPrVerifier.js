import crypto from 'node:crypto';

function sha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export class GithubPrVerifier {
  constructor({ token = process.env.GITHUB_TOKEN } = {}) {
    this.token = token;
    this.type = 'github_pr_merged';
  }

  async verify(payload) {
    const { owner, repo, pullNumber, expectedAuthor, deadline } = payload || {};

    if (!owner || !repo || !pullNumber) {
      return {
        ok: false,
        reason: 'MISSING_GITHUB_FIELDS',
        proofHash: sha256({ ok: false, reason: 'MISSING_GITHUB_FIELDS', payload }),
        metadata: {}
      };
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`;
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ProofPay-Rialo-Prototype'
    };

    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const text = await response.text();
      const result = {
        ok: false,
        reason: `GITHUB_API_${response.status}`,
        metadata: { url, response: text.slice(0, 500) }
      };
      return { ...result, proofHash: sha256(result) };
    }

    const pr = await response.json();
    const mergedAt = pr.merged_at;
    const author = pr.user?.login;
    const deadlineIso = deadline ? new Date(deadline).toISOString() : null;

    if (!mergedAt) {
      const result = {
        ok: false,
        reason: 'PR_NOT_MERGED',
        metadata: { url, state: pr.state, author, title: pr.title }
      };
      return { ...result, proofHash: sha256(result) };
    }

    if (deadline && new Date(mergedAt) > new Date(deadline)) {
      const result = {
        ok: false,
        reason: 'MERGED_AFTER_DEADLINE',
        metadata: { url, mergedAt, deadline: deadlineIso, author, mergeCommitSha: pr.merge_commit_sha }
      };
      return { ...result, proofHash: sha256(result) };
    }

    if (expectedAuthor && author !== expectedAuthor) {
      const result = {
        ok: false,
        reason: 'AUTHOR_MISMATCH',
        metadata: { url, expectedAuthor, actualAuthor: author, mergedAt }
      };
      return { ...result, proofHash: sha256(result) };
    }

    const result = {
      ok: true,
      reason: 'PR_MERGED',
      metadata: {
        url,
        title: pr.title,
        author,
        mergedAt,
        mergeCommitSha: pr.merge_commit_sha,
        baseBranch: pr.base?.ref,
        headBranch: pr.head?.ref
      }
    };

    return { ...result, proofHash: sha256(result) };
  }
}

export const githubPrVerifier = new GithubPrVerifier();
