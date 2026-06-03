import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const jsFiles = [
  'public/app.js',
  'src/adapters/rialoAdapter.js',
  'src/routes/deals.js',
  'src/routes/github.js',
  'src/routes/system.js',
  'src/server.js',
  'src/storage/jsonStore.js',
  'src/verifiers/githubPrVerifier.js'
];

const requiredAssets = [
  'public/index.html',
  'public/styles.css',
  'public/static/logo/logo.png'
];

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const file of requiredAssets) {
  await fs.access(file);
}

const html = await fs.readFile('public/index.html', 'utf8');
if (!html.includes('/static/logo/logo.png')) {
  throw new Error('Expected logo.png to be referenced by the UI/favicon.');
}

console.log('Build check passed.');
