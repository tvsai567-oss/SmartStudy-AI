// ─────────────────────────────────────────────
//  SmartStudy AI — Progress Routes
// ─────────────────────────────────────────────

const router = require('express').Router();
const { getProgress, generateStudyPlan } = require('../controllers/progress.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.get('/',          optionalAuth, getProgress);
router.post('/study-plan', optionalAuth, generateStudyPlan);

module.exports = router;
