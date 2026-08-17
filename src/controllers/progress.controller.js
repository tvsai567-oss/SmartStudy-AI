// ─────────────────────────────────────────────
//  SmartStudy AI — Progress Controller
// ─────────────────────────────────────────────

const gemini = require('../services/gemini.service');
const promptService = require('../services/prompt.service');
const logger = require('../utils/logger');

/**
 * GET /api/progress
 * Returns progress data from localStorage (client handles persistence)
 * or from Supabase if configured
 */
async function getProgress(req, res) {
  // In localStorage mode, the client manages progress
  // This endpoint returns a structure definition for the client
  res.json({
    success: true,
    message: 'Progress is managed client-side in localStorage mode',
    structure: {
      questionsAnswered: 0,
      topicsCompleted: 0,
      quizzesTaken: 0,
      averageScore: 0,
      subjectStats: {},
      weeklyActivity: [],
      recentActivity: [],
    },
  });
}

/**
 * POST /api/study-plan
 * Generate AI-powered study plan
 */
async function generateStudyPlan(req, res) {
  const { subject, daysAvailable, examTopic } = req.body;
  const user = req.user || {};

  if (!subject || !daysAvailable) {
    return res.status(400).json({
      success: false,
      error: 'Subject and number of days are required',
    });
  }

  // SSE streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const systemPrompt = promptService.buildStudyPlanPrompt({
      subject,
      daysAvailable: parseInt(daysAvailable) || 3,
      classLevel: user.classLevel || 8,
      examTopic: examTopic || null,
    });

    const stream = gemini.streamChat({
      systemPrompt: 'You are SmartStudy AI, an expert educational tutor.',
      history: [],
      userMessage: systemPrompt,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error('Study plan error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate study plan.' })}\n\n`);
    res.end();
  }
}

module.exports = { getProgress, generateStudyPlan };
