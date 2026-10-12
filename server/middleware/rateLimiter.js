import rateLimit from 'express-rate-limit';

/**
 * Per-IP rate limit for scan endpoints.
 * Default: 20 scans per 10 minutes. Protects our upstream API quotas
 * (VirusTotal free tier ≈ 4 req/min) and prevents abuse.
 */
const windowMinutes = Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 10;
const max = Number(process.env.RATE_LIMIT_MAX) || 20;

export const scanLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  limit: max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'rate_limited',
    message: `Too many scans. You can run ${max} scans every ${windowMinutes} minutes — please wait a bit.`,
  },
});
