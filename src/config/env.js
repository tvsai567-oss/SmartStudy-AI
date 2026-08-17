// ─────────────────────────────────────────────
//  SmartStudy AI — Environment Config
// ─────────────────────────────────────────────

const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },

  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    // True only when both URL and service key are provided
    get isConfigured() {
      return !!(this.url && this.serviceRoleKey);
    },
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB) || 10,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedDocTypes: ['application/pdf'],
  },
};

// Warn about missing critical configs
if (!config.gemini.apiKey) {
  console.warn('[CONFIG] ⚠️  GEMINI_API_KEY not set. AI features will not work.');
}
if (!config.supabase.isConfigured) {
  console.warn('[CONFIG] ℹ️  Supabase not configured. Running in localStorage mode.');
}

module.exports = config;
