import multer from 'multer';

/**
 * Multer with MEMORY storage: the uploaded file lives only in a Buffer for
 * the duration of the request and is never written to disk. 32 MB cap
 * matches VirusTotal's direct-upload limit.
 */
export const MAX_FILE_BYTES = 32 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
});

/** Translate multer errors into our JSON error shape. */
export function uploadErrorHandler(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    const e = new Error(err.code === 'LIMIT_FILE_SIZE' ? 'File is larger than 32 MB.' : err.message);
    e.status = 400;
    e.code = 'upload_error';
    return next(e);
  }
  return next(err);
}
