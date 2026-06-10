const localDomain = process.env.LOCAL_DOMAIN || 'proofpay-nu.localhost';
const listenPort = process.env.LOCAL_DOMAIN_PORT || '80';
const defaultOrigin = listenPort === '80'
  ? `http://${localDomain}`
  : `http://${localDomain}:${listenPort}`;

process.env.PORT = listenPort;
process.env.PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || defaultOrigin;

console.log(`Starting ProofPay for local domain: ${process.env.PUBLIC_BASE_URL}`);
await import('../src/server.js');
