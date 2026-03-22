/**
 * surveyAI.service.js
 *
 * AI-assisted survey question generation and quality review.
 * Uses Claude API (via ANTHROPIC_API_KEY) with Pulse Writing Style Filter applied.
 * Falls back to a rule-based generator if AI is unavailable.
 */

import Anthropic from '@anthropic-ai/sdk'
import { ValidationError } from '../core/errors/index.js'

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

/**
 * Pulse Writing Style Filter — survey edition.
 * Applied to all AI generation prompts.
 */
const SYSTEM_PROMPT = `You are a survey design specialist for Adventist Pulse — a church intelligence platform.

Your role is to generate high-quality survey questions that produce actionable, measurable data for Adventist church leaders.

RULES FOR EVERY QUESTION YOU WRITE:
- No leading questions ("Don't you think..." or "Wouldn't you agree...")
- No double-barreled questions (asking two things at once)
- No vague frequency words ("often", "sometimes") — use measurable scales
- Each question must produce data someone can act on
- Maximum 15 questions per survey
- Use plain language — no jargon
- Order questions: least sensitive first, most sensitive last
- Frame from an Adventist mission perspective — we are equipping leaders, not auditing them

QUESTION TYPES:
- likert: Likert scale 1-5 (1=Strongly Disagree, 5=Strongly Agree)
- yesno: Yes/No binary
- multiplechoice: predefined options, single or multi-select
- text: open free-response (use sparingly — max 2 per survey)
- nps: 0-10 scale (Net Promoter Style)

OUTPUT FORMAT (JSON array):
[
  {
    "questionId": "q1",
    "text": "Question text here",
    "type": "likert",
    "options": [],
    "scale": { "min": 1, "max": 5, "minLabel": "Strongly Disagree", "maxLabel": "Strongly Agree" },
    "required": true,
    "order": 1
  }
]

Return ONLY the JSON array. No explanation, no markdown, no extra text.`

/**
 * Generate survey questions from a plain-language intent.
 *
 * @param {string} intent         What the survey is trying to measure
 * @param {number} questionCount  Number of questions to generate (3-15)
 * @returns {Promise<object[]>}   Array of question objects
 */
export async function generateSurveyQuestions(intent, questionCount = 8) {
  if (client == null) {
    return fallbackGenerate(intent, questionCount)
  }

  const prompt = `Survey intent: "${intent}"

Generate exactly ${questionCount} survey questions that will help a church leader understand this topic.
Mix question types appropriately — not all Likert.
Make each question independently useful.`

  try {
    const message = await client.messages.create({
      model:      'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.text?.trim() ?? ''
    const questions = JSON.parse(text)

    if (!Array.isArray(questions)) throw new Error('AI returned non-array')
    return questions
  } catch (err) {
    console.error('[surveyAI] generate error:', err.message)
    return fallbackGenerate(intent, questionCount)
  }
}

/**
 * Review a single survey question and return quality feedback.
 *
 * @param {string} question  The question text
 * @param {string} type      The question type
 * @returns {Promise<{ok: boolean, issues: string[], suggestion: string|null}>}
 */
export async function reviewSurveyQuestion(question, type) {
  if (client == null) {
    return ruleBasedReview(question)
  }

  const prompt = `Review this survey question for quality issues:

Question: "${question}"
Type: ${type ?? 'unknown'}

Check for:
1. Leading language ("Don't you think...", "Wouldn't you agree...")
2. Double-barreled (asks two things at once)
3. Vague unmeasurable terms ("often", "regularly", "good")
4. Assumptions baked into the question
5. Anything that would produce unusable data

Return JSON only:
{
  "ok": true|false,
  "issues": ["issue 1", "issue 2"],
  "suggestion": "improved version of the question, or null if ok"
}`

  try {
    const message = await client.messages.create({
      model:      'claude-3-5-haiku-20241022',
      max_tokens: 500,
      system:     'You are a survey quality reviewer. Return only valid JSON.',
      messages:   [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.text?.trim() ?? ''
    return JSON.parse(text)
  } catch (err) {
    console.error('[surveyAI] review error:', err.message)
    return ruleBasedReview(question)
  }
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────

/** Rule-based review when AI is unavailable */
function ruleBasedReview(question) {
  const issues = []
  const q = question.toLowerCase()

  if (/don'?t you|wouldn'?t you|isn'?t it|don'?t you think/i.test(question)) {
    issues.push('Leading language detected — this may bias responses')
  }
  if (/and.*\?|or.*\?/i.test(question) && question.split('?').length < 2) {
    issues.push('Possible double-barreled question — consider splitting into two questions')
  }
  const vagueWords = ['often', 'sometimes', 'regularly', 'frequently', 'occasionally', 'rarely']
  const found = vagueWords.filter(w => q.includes(w))
  if (found.length > 0) {
    issues.push(`Vague frequency word(s): "${found.join(', ')}" — use a numbered scale instead`)
  }

  return { ok: issues.length === 0, issues, suggestion: null }
}

/** Simple fallback question generator */
function fallbackGenerate(intent, count) {
  // Returns generic high-quality template questions
  const templates = [
    { questionId: 'q1', text: 'How would you rate your overall experience in this area?', type: 'nps', options: [], scale: { min: 0, max: 10, minLabel: 'Very Poor', maxLabel: 'Excellent' }, required: true, order: 1 },
    { questionId: 'q2', text: 'I feel well-supported in this area by my church community.', type: 'likert', options: [], scale: { min: 1, max: 5, minLabel: 'Strongly Disagree', maxLabel: 'Strongly Agree' }, required: true, order: 2 },
    { questionId: 'q3', text: 'How many times per month do you engage with this aspect of church life?', type: 'multiplechoice', options: ['Never', '1-2 times', '3-4 times', 'Weekly or more'], scale: {}, required: true, order: 3 },
    { questionId: 'q4', text: 'What is working well in this area?', type: 'text', options: [], scale: {}, required: false, order: 4 },
    { questionId: 'q5', text: 'What one change would most improve this area?', type: 'text', options: [], scale: {}, required: false, order: 5 },
  ]
  return templates.slice(0, Math.min(count, templates.length))
}
