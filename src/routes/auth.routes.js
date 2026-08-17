// ─────────────────────────────────────────────
//  SmartStudy AI — Auth Routes
// ─────────────────────────────────────────────

const router = require('express').Router();
const {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
  updateProfile,
} = require('../controllers/auth.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

router.get('/me', optionalAuth, getProfile);
router.put('/me', optionalAuth, updateProfile);

module.exports = router;
