/**
 * CyberShield API — Express entry point.
 *
 * Responsibilities
 *  - Restrict CORS to CLIENT_ORIGIN
 *  - Parse JSON bodies (small limit; file uploads use multer)
 *  - Rate-limit all /api/scan routes
 *  - Mount scan routes and a health check
 *  - Central error handler (never leaks stack traces or API keys)
 */
import 'dotenv/config';
import express from 'express';

// Trim stray whitespace around values pasted into .env (a leading space in an
// API key would otherwise be sent in the header and rejected upstream).
for (const [k, v] of Object.entries(process.env)) if (/_KEY$|_MODEL$|ORIGIN$/.test(k) && typeof v === 'string') process.env[k] = v.trim();
import cors from 'cors';
import scanRouter from './routes/scan.js';
import { scanLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound, httpError } from './middleware/errorHandler.js';
import { configStatus } from './utils/config.js';
import { allowedClientOrigins } from './utils/origins.js';

const app = express();
const PORT = Number(process.env.PORT) || 5001;

// Hosting platforms sit behind a proxy; this makes req.ip the real client IP
app.set('trust proxy', 1);

// ─── CORS: only the configured client origin(s) may call this API ───────
const allowedOrigins = allowedClientOrigins(process.env.CLIENT_ORIGIN);

app.use(
  cors({
    origin(origin, cb) {
      // Allow server-to-server / curl (no Origin header) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(httpError(403, 'forbidden_origin', 'This browser origin is not allowed.'));
    },
    methods: ['GET', 'POST'],
  }),
);

app.use(express.json({ limit: '64kb' }));

// ─── Routes ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'cybershield-api', time: new Date().toISOString(), apis: configStatus() });
});

app.use('/api/scan', scanLimiter, scanRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  const status = configStatus();
  console.log(`🛡  CyberShield API listening on http://localhost:${PORT}`);
  console.log(`   CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(
    `   Keys: ${Object.entries(status)
      .map(([k, v]) => `${k}=${v ? '✓' : '✗'}`)
      .join('  ')}`,
  );
});
