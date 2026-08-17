// ─────────────────────────────────────────────
//  SmartStudy AI — Homework Controller
// ─────────────────────────────────────────────

const gemini = require('../services/gemini.service');
const promptService = require('../services/prompt.service');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * POST /api/homework/solve  (image optional)
 * POST /api/homework/explain
 * POST /api/homework/hint
 * POST /api/homework/similar
 */
async function processHomework(req, res) {
  const { message, question, action, type, subject } = req.body;
  const user = req.user || {};
  const file = req.file;

  const textQuestion = (message || question || '').trim();
  const effectiveAction = action || type || 'solve';

  if (!textQuestion && !file) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a question or upload an image',
    });
  }

  const systemPrompt = promptService.buildHomeworkPrompt({
    action: effectiveAction,
    classLevel: user.classLevel || 8,
    subject: subject || null,
  });

  // SSE streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const textPrompt = textQuestion || 'Please analyze this homework problem and help me.';

  try {
    let stream;

    if (file && config.upload.allowedImageTypes.includes(file.mimetype)) {
      // Image input
      const imageBase64 = file.buffer.toString('base64');
      stream = gemini.streamWithImage({
        systemPrompt,
        imageBase64,
        mimeType: file.mimetype,
        textPrompt,
      });
    } else {
      // Text-only input
      stream = gemini.streamChat({
        systemPrompt,
        history: [],
        userMessage: textPrompt,
      });
    }

    let fullResponse = '';

    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true, fullText: fullResponse })}\n\n`);
    res.end();
  } catch (err) {
    logger.error('Homework processing error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Could not process homework: ' + err.message })}\n\n`);
    res.end();
  }
}

module.exports = { processHomework };
