// ─────────────────────────────────────────────
//  SmartStudy AI — Middleware: File Upload
// ─────────────────────────────────────────────

const multer = require('multer');
const config = require('../config/env');

const MAX_SIZE_BYTES = config.upload.maxFileSizeMB * 1024 * 1024;
const ALLOWED_TYPES = [
  ...config.upload.allowedImageTypes,
  ...config.upload.allowedDocTypes,
];

// Use memory storage — files become Buffer in req.file.buffer
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_TYPES.join(', ')}`
      ),
      false
    );
  }
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});

module.exports = { upload };
