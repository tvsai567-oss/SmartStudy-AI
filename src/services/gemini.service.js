// ─────────────────────────────────────────────
//  SmartStudy AI — Gemini AI Service
// ─────────────────────────────────────────────

const { GoogleGenAI } = require('@google/genai');
const config = require('../config/env');
const logger = require('../utils/logger');

let ai = null;

function getAI() {
  if (!ai) {
    if (!config.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in .env file');
    }
    ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return ai;
}

const MODELS_TO_TRY = [
  config.gemini.model || 'gemini-3.6-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
].filter((m, i, self) => m && self.indexOf(m) === i);

/**
 * Execute API call trying configured model and falling back if needed
 */
async function executeWithFallback(fn) {
  let lastErr = null;
  for (const modelName of MODELS_TO_TRY) {
    try {
      return await fn(modelName);
    } catch (err) {
      logger.warn(`Model ${modelName} failed: ${err.message}. Trying fallback...`);
      lastErr = err;
    }
  }
  throw lastErr || new Error('All Gemini API models failed');
}

/**
 * Sanitize and format message history for Gemini API (requires strictly alternating user/model roles)
 */
function formatContentsForGemini(history = [], userMessage = '') {
  const rawItems = [];

  for (const msg of history) {
    if (!msg || !msg.content || typeof msg.content !== 'string') continue;
    const text = msg.content.trim();
    if (!text) continue;

    const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
    rawItems.push({ role, text });
  }

  if (userMessage && userMessage.trim()) {
    rawItems.push({ role: 'user', text: userMessage.trim() });
  }

  if (rawItems.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  // Merge consecutive roles with same role name to maintain strict alternating sequence
  const sanitized = [];
  for (const item of rawItems) {
    if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === item.role) {
      sanitized[sanitized.length - 1].parts[0].text += '\n\n' + item.text;
    } else {
      sanitized.push({
        role: item.role,
        parts: [{ text: item.text }],
      });
    }
  }

  // Ensure first item is 'user'
  if (sanitized.length > 0 && sanitized[0].role !== 'user') {
    sanitized.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  // Ensure last item is 'user'
  if (sanitized.length > 0 && sanitized[sanitized.length - 1].role !== 'user') {
    sanitized.push({ role: 'user', parts: [{ text: userMessage.trim() || 'Continue' }] });
  }

  return sanitized;
}

/**
 * Generate a streaming chat response
 */
async function* streamChat({ systemPrompt, history = [], userMessage }) {
  const client = getAI();
  const contents = formatContentsForGemini(history, userMessage);

  let stream = null;
  let lastErr = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      stream = await client.models.generateContentStream({
        model: modelName,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      });
      break; // Success!
    } catch (err) {
      logger.warn(`streamChat model ${modelName} error: ${err.message}`);
      lastErr = err;
    }
  }

  if (!stream) {
    throw lastErr || new Error('Failed to start AI stream across all models');
  }

  for await (const chunk of stream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

/**
 * Generate a non-streaming text response
 */
async function generateText({ systemPrompt, userMessage, temperature = 0.5 }) {
  const client = getAI();
  const contents = [{ role: 'user', parts: [{ text: userMessage }] }];

  return await executeWithFallback(async (modelName) => {
    const response = await client.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature,
        maxOutputTokens: 8192,
      },
    });
    return response.text;
  });
}

/**
 * Generate response with image (multimodal)
 */
async function* streamWithImage({ systemPrompt, imageBase64, mimeType, textPrompt }) {
  const client = getAI();
  const contents = [
    {
      role: 'user',
      parts: [
        { text: textPrompt },
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
      ],
    },
  ];

  let stream = null;
  let lastErr = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      stream = await client.models.generateContentStream({
        model: modelName,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      });
      break;
    } catch (err) {
      logger.warn(`streamWithImage model ${modelName} error: ${err.message}`);
      lastErr = err;
    }
  }

  if (!stream) {
    throw lastErr || new Error('Failed to stream image response');
  }

  for await (const chunk of stream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

/**
 * Generate quiz JSON with robust parsing
 */
async function generateQuizJSON(prompt) {
  const client = getAI();

  return await executeWithFallback(async (modelName) => {
    const response = await client.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });

    const rawText = response.text ? response.text.trim() : '';

    let jsonStr = rawText;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = rawText.substring(firstBrace, lastBrace + 1).trim();
      }
    }

    return JSON.parse(jsonStr);
  });
}

module.exports = {
  streamChat,
  generateText,
  streamWithImage,
  generateQuizJSON,
};
