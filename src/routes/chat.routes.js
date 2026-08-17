// ─────────────────────────────────────────────
//  SmartStudy AI — Chat Routes
// ─────────────────────────────────────────────

const router = require('express').Router();
const { sendMessage, getChats, getChatById } = require('../controllers/chat.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, getChats);
router.get('/:id', optionalAuth, getChatById);
router.post('/', optionalAuth, sendMessage);
router.post('/message', optionalAuth, sendMessage);

module.exports = router;
