// ─────────────────────────────────────────────
//  SmartStudy AI — Middleware: Auth
// ─────────────────────────────────────────────

const supabase = require('../config/supabase');
const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Optional auth middleware — verifies token from Supabase or Local DB
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Supabase Auth
  if (supabase && authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (user && !error) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('class_level, full_name')
          .eq('user_id', user.id)
          .single();

        req.user = {
          id: user.id,
          email: user.email,
          classLevel: profile?.class_level || 8,
          name: profile?.full_name || user.email?.split('@')[0] || 'Student',
        };
        return next();
      }
    } catch (err) {
      logger.warn('Supabase auth verify error:', err.message);
    }
  }

  // Local Persistent DB Token resolution
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const rawToken = authHeader.slice(7);
      if (rawToken.startsWith('token_')) {
        const encoded = rawToken.replace('token_', '');
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        const [userId] = decoded.split(':');

        const localUser = db.findUserById(userId);
        if (localUser) {
          req.user = {
            id: localUser.id,
            email: localUser.email,
            classLevel: localUser.class_level || 8,
            name: localUser.full_name || 'Student',
          };
          return next();
        }
      }
    } catch (e) {
      // Fall through to guest
    }
  }

  // Fallback Guest User
  req.user = {
    id: req.headers['x-user-id'] || 'guest',
    email: req.headers['x-user-email'] || null,
    classLevel: parseInt(req.headers['x-class-level']) || 8,
    name: req.headers['x-user-name'] || 'Student',
  };

  next();
}

/**
 * Strict auth middleware — requires authentication
 */
async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {
    if (!req.user || req.user.id === 'guest') {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    next();
  });
}

module.exports = { optionalAuth, requireAuth };
