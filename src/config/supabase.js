// ─────────────────────────────────────────────
//  SmartStudy AI — Supabase Client
// ─────────────────────────────────────────────

const config = require('./env');
const logger = require('../utils/logger');

let supabase = null;

if (config.supabase.isConfigured) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    logger.info('Supabase client initialized successfully');
  } catch (err) {
    logger.error('Failed to initialize Supabase client:', err.message);
  }
} else {
  logger.info('Supabase not configured — running in localStorage/offline mode');
}

module.exports = supabase;
