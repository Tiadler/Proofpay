import express from 'express';
import { updateStore, readStore } from '../storage/jsonStore.js';
import { fetchInstallationRepositories, githubAppConfig } from '../github/githubAppClient.js';

export const githubRouter = express.Router();

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function publicBaseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

function githubConfigured() {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

githubRouter.get('/status', (req, res) => {
  const configured = githubConfigured();
  const appConfig = githubAppConfig();
  const appSlug = appConfig.appSlug || null;
  const callbackUrl = `${publicBaseUrl(req)}/api/github/callback`;
  const setupCallbackUrl = `${publicBaseUrl(req)}/api/github/setup/callback`;

  res.json({
    configured,
    appConfigured: appConfig.configured,
    appSlug,
    callbackUrl,
    setupCallbackUrl,
    oauthUrl: configured
      ? `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(process.env.GITHUB_CLIENT_ID)}&scope=${encodeURIComponent('read:user repo')}&redirect_uri=${encodeURIComponent(callbackUrl)}`
      : null,
    installUrl: appSlug ? `https://github.com/apps/${appSlug}/installations/new` : null,
    requiredEnv: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_APP_ID', 'GITHUB_APP_SLUG', 'GITHUB_APP_PRIVATE_KEY_BASE64', 'PUBLIC_BASE_URL']
  });
});

githubRouter.get('/install', (req, res) => {
  const appSlug = process.env.GITHUB_APP_SLUG;
  if (!appSlug) {
    res.status(501).json({
      error: 'GitHub App slug is not configured',
      requiredEnv: ['GITHUB_APP_SLUG', 'PUBLIC_BASE_URL']
    });
    return;
  }

  const setupCallbackUrl = `${publicBaseUrl(req)}/api/github/setup/callback`;
  const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${encodeURIComponent(setupCallbackUrl)}`;
  res.redirect(installUrl);
});

githubRouter.get('/installations', asyncRoute(async (_req, res) => {
  const state = await readStore();
  res.json({
    installations: state.githubInstallations || [],
    repositories: state.githubRepositories || []
  });
}));

githubRouter.get('/setup/callback', asyncRoute(async (req, res) => {
  const installationId = req.query.installation_id ? String(req.query.installation_id) : '';
  const setupAction = req.query.setup_action ? String(req.query.setup_action) : '';

  if (!installationId) {
    res.status(400).send('Missing GitHub App installation_id.');
    return;
  }

  if (!githubAppConfig().configured) {
    res.status(501).send('GitHub App is not configured. Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY_BASE64.');
    return;
  }

  try {
    const repositories = await fetchInstallationRepositories(installationId);
    const now = new Date().toISOString();
    const installation = {
      id: `github_installation_${installationId}`,
      installationId,
      setupAction,
      accountLogin: repositories[0]?.owner || null,
      accountType: null,
      repositorySelection: null,
      repositories,
      installedByUserId: null,
      createdAt: now,
      updatedAt: now
    };

    await updateStore((state) => {
      state.githubInstallations = state.githubInstallations || [];
      state.githubRepositories = state.githubRepositories || [];
      const existingIndex = state.githubInstallations.findIndex((item) => item.installationId === installationId);
      if (existingIndex >= 0) {
        installation.createdAt = state.githubInstallations[existingIndex].createdAt || now;
        state.githubInstallations[existingIndex] = installation;
      } else {
        state.githubInstallations.unshift(installation);
      }

      const repositoryRecords = repositories.map((repo) => ({
        ...repo,
        installationId,
        updatedAt: now
      }));
      const repoKeys = new Set(repositoryRecords.map((repo) => `${repo.installationId}:${repo.id}`));
      state.githubRepositories = [
        ...repositoryRecords,
        ...state.githubRepositories.filter((repo) => !repoKeys.has(`${repo.installationId}:${repo.id}`))
      ];

      return installation;
    });

    res.send(`
      <script>
        sessionStorage.setItem('proofpay.github.installationResult', ${JSON.stringify(JSON.stringify({
          installed: true,
          installationId,
          repositories,
          setupAction
        }))});
        window.location.href = '/#/profile';
      </script>
    `);
  } catch (err) {
    res.status(502).send(`GitHub App installation sync failed: ${err.message}`);
  }
}));

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

githubRouter.get('/callback', asyncRoute(async (req, res) => {
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
}));
