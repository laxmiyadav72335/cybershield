/**
 * /api/scan routes
 *   POST /api/scan/url      { url }                       → Module 1
 *   POST /api/scan/file     JSON { sha256, fileName, size, mimeType }  (hash-first lookup)
 *                           or multipart file + sha256    (upload when unknown)
 *   POST /api/scan/message  { text }                      → Module 3
 *   GET  /api/scan/ip?ip=   → Module 6
 */
import { Router } from 'express';
import { scanUrl } from '../services/urlScanner.js';
import { scanFile } from '../services/fileScanner.js';
import { scanMessage } from '../services/messageScanner.js';
import { scanIp } from '../services/ipScanner.js';
import { upload, uploadErrorHandler } from '../middleware/upload.js';
import { httpError } from '../middleware/errorHandler.js';

const router = Router();

router.post('/url', async (req, res) => {
  const { url } = req.body || {};
  if (typeof url !== 'string' || !url.trim()) throw httpError(400, 'missing_url', 'Please provide a link to scan.');
  res.json(await scanUrl(url, { skipCache: req.query.fresh === '1' }));
});

// multer only parses multipart bodies; JSON bodies pass straight through to express.json's result
router.post('/file', upload.single('file'), uploadErrorHandler, async (req, res) => {
  const body = req.body || {};
  const report = await scanFile({
    sha256: body.sha256,
    fileName: body.fileName || req.file?.originalname,
    size: Number(body.size) || req.file?.size,
    mimeType: body.mimeType || req.file?.mimetype,
    buffer: req.file?.buffer || null,
  });
  // Drop the reference to the upload as early as possible (never stored)
  if (req.file) req.file.buffer = null;
  res.json(report);
});

router.post('/message', async (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== 'string') throw httpError(400, 'missing_text', 'Paste the SMS or email text to check.');
  res.json(await scanMessage(text));
});

router.get('/ip', async (req, res) => {
  res.json(await scanIp(req.query.ip));
});

export default router;
