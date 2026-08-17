// ─────────────────────────────────────────────
//  SmartStudy AI — Chat Controller
// ─────────────────────────────────────────────

const gemini = require('../services/gemini.service');
const promptService = require('../services/prompt.service');
const logger = require('../utils/logger');

/**
 * POST /api/chat
 * Streams an AI chat response
 */
async function sendMessage(req, res) {
  const { message, history = [], subject } = req.body;
  const user = req.user || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const systemPrompt = promptService.buildChatPrompt({
    classLevel: user.classLevel || 8,
    subject: subject || null,
    userName: user.name || null,
  });

  // Set up SSE (Server-Sent Events) for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let fullResponse = '';

  try {
    const stream = gemini.streamChat({
      systemPrompt,
      history,
      userMessage: message.trim(),
    });

    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true, fullText: fullResponse })}\n\n`);
    res.end();
  } catch (err) {
    logger.error('Chat stream error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'AI response failed: ' + err.message })}\n\n`);
    res.end();
  }
}

/**
 * GET /api/chat
 */
async function getChats(req, res) {
  res.json({
    success: true,
    chats: [],
  });
}

/**
 * GET /api/chat/:id
 */
async function getChatById(req, res) {
  res.json({
    success: true,
    id: req.params.id,
    title: 'Chat History',
    messages: [],
  });
}

module.exports = { sendMessage, getChats, getChatById };
