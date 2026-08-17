// ─────────────────────────────────────────────
//  SmartStudy AI — Homework Routes
// ─────────────────────────────────────────────

const router = require('express').Router();
const { processHomework } = require('../controllers/homework.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

// All homework routes accept an optional image file
const uploadMiddleware = upload.single('file');

router.post('/solve',   optionalAuth, uploadMiddleware, processHomework);
router.post('/explain', optionalAuth, uploadMiddleware, processHomework);
router.post('/hint',    optionalAuth, uploadMiddleware, processHomework);
router.post('/similar', optionalAuth, uploadMiddleware, processHomework);

module.exports = router;
