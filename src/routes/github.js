import express from 'express';

export const githubRouter = express.Router();

function publicBaseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

function githubConfigured() {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

githubRouter.get('/status', (req, res) => {
  const configured = githubConfigured();
  const appSlug = process.env.GITHUB_APP_SLUG || null;
  const callbackUrl = `${publicBaseUrl(req)}/api/github/callback`;

  res.json({
    configured,
    appSlug,
    callbackUrl,
    oauthUrl: configured
      ? `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(process.env.GITHUB_CLIENT_ID)}&scope=${encodeURIComponent('read:user repo')}&redirect_uri=${encodeURIComponent(callbackUrl)}`
      : null,
    installUrl: appSlug ? `https://github.com/apps/${appSlug}/installations/new` : null,
    requiredEnv: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_APP_SLUG', 'PUBLIC_BASE_URL']
  });
});

githubRouter.get('/connect', (req, res) => {
  if (!githubConfigured()) {
    res.status(501).json({
      error: 'GitHub OAuth is not configured',
      requiredEnv: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'PUBLIC_BASE_URL']
    });
    return;
  }

  const callbackUrl = `${publicBaseUrl(req)}/api/github/callback`;
  const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(process.env.GITHUB_CLIENT_ID)}&scope=${encodeURIComponent('read:user repo')}&redirect_uri=${encodeURIComponent(callbackUrl)}`;
  res.redirect(oauthUrl);
});

githubRouter.get('/callback', async (req, res) => {
  if (!githubConfigured()) {
    res.status(501).send('GitHub OAuth is not configured.');
    return;
  }

  const code = req.query.code;
  if (!code) {
    res.status(400).send('Missing GitHub OAuth code.');
    return;
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      res.status(502).send('GitHub OAuth token exchange failed.');
      return;
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'ProofPay-Rialo-Prototype'
      }
    });
    const user = await userRes.json();

    res.send(`
      <script>
        sessionStorage.setItem('proofpay.github.oauthResult', ${JSON.stringify(JSON.stringify({
          connected: true,
          username: user.login,
          id: user.id,
          permissions: ['repo:read', 'pull_requests:read', 'checks:read'],
          verifier: 'proofpay-github-oauth/v1'
        }))});
        window.location.href = '/#/profile';
      </script>
    `);
  } catch (err) {
    res.status(500).send(`GitHub OAuth failed: ${err.message}`);
  }
});
