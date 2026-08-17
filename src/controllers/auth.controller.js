// ─────────────────────────────────────────────
//  SmartStudy AI — Auth Controller
// ─────────────────────────────────────────────

const supabase = require('../config/supabase');
const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 */
async function register(req, res) {
  const { email, password, full_name, class_level } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  const parsedClass = parseInt(class_level, 10) || 8;

  // Supabase Mode (if configured)
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name, class_level: parsedClass } },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').insert([
          { user_id: data.user.id, full_name, class_level: parsedClass },
        ]);
      }

      return res.json({
        success: true,
        token: data.session?.access_token || 'sb_token_' + Date.now(),
        user: {
          id: data.user?.id || 'usr_' + Date.now(),
          email,
          full_name,
          class_level: parsedClass,
        },
      });
    } catch (err) {
      logger.error('Supabase registration error:', err.message);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Local Persistent Database Mode
  try {
    const newUser = db.createUser({
      email,
      password,
      full_name,
      class_level: parsedClass,
    });

    const token = 'token_' + Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64');

    logger.info(`User registered: ${newUser.email} (${newUser.full_name})`);

    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        class_level: newUser.class_level,
      },
    });
  } catch (err) {
    logger.warn('Registration error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  // Supabase Mode (if configured)
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      return res.json({
        success: true,
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: profile?.full_name || email.split('@')[0],
          class_level: profile?.class_level || 8,
        },
      });
    } catch (err) {
      logger.error('Supabase login error:', err.message);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Local Persistent Database Mode
  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'No account found with this email address. Please sign up first.',
    });
  }

  if (!db.verifyPassword(password, user.passwordHash)) {
    return res.status(400).json({
      success: false,
      message: 'Incorrect password. Please try again or reset your password.',
    });
  }

  const token = 'token_' + Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

  logger.info(`User logged in successfully: ${user.email}`);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      class_level: user.class_level,
    },
  });
}

/**
 * POST /api/auth/forgot-password
 * Send 6-digit OTP to user's email
 */
async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'No account found with this email address.',
    });
  }

  const otpCode = db.createOTP(email);

  logger.info(`🔑 OTP generated for ${email}: ${otpCode}`);

  res.json({
    success: true,
    message: `OTP sent to ${email}. (Demo OTP: ${otpCode})`,
    otp: otpCode, // Included for easy user verification in demo UI
  });
}

/**
 * POST /api/auth/verify-otp
 */
async function verifyOTP(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
  }

  const isValid = db.verifyOTP(email, otp);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP code. Please request a new one.',
    });
  }

  res.json({
    success: true,
    message: 'OTP verified successfully.',
  });
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, OTP, and new password are required.',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long.',
    });
  }

  const isValid = db.verifyOTP(email, otp);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP code.',
    });
  }

  try {
    db.updateUserPassword(email, newPassword);
    db.clearOTP(email);

    logger.info(`Password reset successfully for ${email}`);

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/auth/me
 */
async function getProfile(req, res) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.name,
      class_level: req.user.classLevel,
    },
  });
}

/**
 * PUT /api/auth/me
 */
async function updateProfile(req, res) {
  const { full_name, class_level } = req.body;
  const user = req.user || {};

  const updatedName = full_name || user.name || 'Student';
  const updatedClass = parseInt(class_level, 10) || user.classLevel || 8;

  if (user.id && user.id !== 'guest') {
    try {
      db.updateUserProfile(user.id, {
        full_name: updatedName,
        class_level: updatedClass,
      });
    } catch (err) {
      logger.warn('Failed to update DB profile:', err.message);
    }
  }

  res.json({
    success: true,
    user: {
      id: user.id || 'guest',
      email: user.email || null,
      full_name: updatedName,
      class_level: updatedClass,
    },
  });
}

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
  updateProfile,
};
