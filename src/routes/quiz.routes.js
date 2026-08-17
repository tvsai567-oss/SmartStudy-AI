// ─────────────────────────────────────────────
//  SmartStudy AI — Quiz Routes
// ─────────────────────────────────────────────

const router = require('express').Router();
const { generateQuiz, evaluateQuiz } = require('../controllers/quiz.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.post('/generate', optionalAuth, generateQuiz);
router.post('/evaluate', optionalAuth, evaluateQuiz);
router.post('/submit', optionalAuth, evaluateQuiz);

module.exports = router;
