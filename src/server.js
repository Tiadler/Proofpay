import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dealsRouter } from './routes/deals.js';
import { systemRouter } from './routes/system.js';
import { githubRouter } from './routes/github.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api/deals', dealsRouter);
app.use('/api/system', systemRouter);
app.use('/api/github', githubRouter);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`ProofPay prototype running at http://localhost:${port}`);
});
