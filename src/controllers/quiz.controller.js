// ─────────────────────────────────────────────
//  SmartStudy AI — Quiz Controller
// ─────────────────────────────────────────────

const gemini = require('../services/gemini.service');
const promptService = require('../services/prompt.service');
const logger = require('../utils/logger');

/**
 * POST /api/quiz/generate
 * Body: { subject, topic, classLevel, count, difficulty }
 */
async function generateQuiz(req, res) {
  const { subject, topic, count = 10, difficulty = 'medium' } = req.body;
  const user = req.user || {};

  if (!subject) {
    return res.status(400).json({ success: false, error: 'Subject is required' });
  }

  try {
    const prompt = promptService.buildQuizPrompt({
      subject,
      topic,
      classLevel: user.classLevel || 8,
      count: Math.min(parseInt(count) || 10, 20), // max 20 questions
      difficulty,
    });

    const quizData = await gemini.generateQuizJSON(prompt);

    res.json({
      success: true,
      quiz: quizData,
    });
  } catch (err) {
    logger.error('Quiz generation error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz. Please try again.',
    });
  }
}

/**
 * POST /api/quiz/evaluate
 * Body: { questions: [{...}], answers: [selectedIndex, ...] }
 */
async function evaluateQuiz(req, res) {
  const { questions = [], answers = [] } = req.body;

  if (!questions.length || !answers.length) {
    return res.status(400).json({ success: false, error: 'Questions and answers are required' });
  }

  try {
    let correct = 0;
    const results = questions.map((q, idx) => {
      const isCorrect = answers[idx] === q.correct;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        question: q.question,
        selectedAnswer: answers[idx],
        correctAnswer: q.correct,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const score = Math.round((correct / questions.length) * 100);

    res.json({
      success: true,
      results: {
        score,
        correct,
        total: questions.length,
        percentage: score,
        grade: getGrade(score),
        breakdown: results,
      },
    });
  } catch (err) {
    logger.error('Quiz evaluation error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to evaluate quiz' });
  }
}

function getGrade(score) {
  if (score >= 90) return { label: 'Excellent! 🏆', color: 'success' };
  if (score >= 75) return { label: 'Great Job! 🌟', color: 'primary' };
  if (score >= 60) return { label: 'Good Effort! 👍', color: 'info' };
  if (score >= 40) return { label: 'Keep Practicing! 📚', color: 'warning' };
  return { label: 'Needs Revision 💪', color: 'error' };
}

module.exports = { generateQuiz, evaluateQuiz };
