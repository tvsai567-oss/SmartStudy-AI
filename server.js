// ─────────────────────────────────────────────
//  SmartStudy AI — Main Server Entry Point
//  (Upgraded from SmartKids AI)
//  Original: basic chat API
//  Upgraded: full educational AI platform
// ─────────────────────────────────────────────

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load config (also loads dotenv)
const config = require('./src/config/env');
const logger = require('./src/utils/logger');
const { errorHandler } = require('./src/middleware/error.middleware');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const chatRoutes = require('./src/routes/chat.routes');
const homeworkRoutes = require('./src/routes/homework.routes');
const quizRoutes = require('./src/routes/quiz.routes');
const progressRoutes = require('./src/routes/progress.routes');

const app = express();

// ─────────────────────────────────────────────
// Security & Core Middleware
// ─────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline scripts for our SPA
  })
);

app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
);

// General rate limiter
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { success: false, error: 'Too many requests. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Stricter rate limiter for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { success: false, error: 'Too many AI requests. Please slow down.' },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────────
// Static Files (Frontend SPA)
// ─────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.use('/api/auth',     authRoutes);
app.use('/api/chat',     aiRateLimit, chatRoutes);
app.use('/api/homework', aiRateLimit, homeworkRoutes);
app.use('/api/quiz',     aiRateLimit, quizRoutes);
app.use('/api/progress', progressRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SmartStudy AI',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    gemini: !!process.env.GEMINI_API_KEY,
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
});

// ─────────────────────────────────────────────
// SPA Fallback — serve index.html for all non-API routes
// ─────────────────────────────────────────────

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────

app.use(errorHandler);

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────

app.listen(config.port, () => {
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🧠  SmartStudy AI  v2.0.0');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info(`🚀  Server: http://localhost:${config.port}`);
  logger.info(`🌍  Mode:   ${config.nodeEnv}`);
  logger.info(`🤖  Gemini: ${config.gemini.apiKey ? '✅ Configured' : '❌ Missing API Key'}`);
  logger.info(`🗄️   Supabase: ${config.supabase.isConfigured ? '✅ Configured' : 'ℹ️  localStorage mode'}`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

module.exports = app;