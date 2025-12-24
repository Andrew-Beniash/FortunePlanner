import express, { Request, Response } from 'express'
import OpenAI from 'openai'

const router = express.Router()

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Mixture-of-Experts prompt for viability analysis
const VIABILITY_EXPERT_PROMPT = `You are a panel of 3 expert advisors analyzing product idea viability:
1. **Feasibility Expert**: Evaluates technical and operational feasibility
2. **Risk Expert**: Identifies risks, constraints, and potential blockers
3. **Market Expert**: Assesses market viability and assumptions

**Instructions:**
- Think step-by-step internally (hidden chain-of-thought)
- Each expert should reason separately about the provided context
- Synthesize your collective expert analysis into a single JSON response
- Do NOT include reasoning text - only return the final structured JSON

**Response Format (JSON):**
{
  "feasibility": "low" | "medium" | "high",
  "overallRisk": "low" | "medium" | "high",
  "keyConstraints": ["constraint 1", "constraint 2", ...],
  "assumptions": ["assumption 1", "assumption 2", ...],
  "suggestedFollowUpQuestions": [
    {
      "questionId": "auto-generated-id",
      "text": "Question text to clarify X...",
      "section": "solution" | "market" | "team" | "business",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Analyze the provided product idea context and return ONLY the JSON response.`

/**
 * Extract and format relevant answers for analysis context
 */
function buildAnalysisContext(answers: Record<string, any>) {
  return {
    problem: answers['problem-statement']?.value || 'Not provided',
    solution: answers['solution-description']?.value || 'Not provided',
    targetMarket: answers['target-market']?.value || 'Not provided',
    personas: answers['user-personas']?.value || 'Not provided',
    teamSize: answers['team-size']?.value || 'Not provided',
    timeline: answers['timeline']?.value || 'Not provided',
    budget: answers['budget']?.value || 'Not provided',
    constraints: answers['constraints']?.value || 'Not provided',
    competitiveAdvantage: answers['competitive-advantage']?.value || 'Not provided',
    businessModel: answers['business-model']?.value || 'Not provided',
    allAnswers: answers // Include all for context
  }
}

/**
 * POST /api/analyze/viability
 * Analyzes product viability using OpenAI GPT-4
 */
router.post('/viability', async (req: Request, res: Response) => {
  try {
    const { sessionId, blueprintId, answers } = req.body

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Invalid request: answers required' })
    }

    // Build context from answers
    const context = buildAnalysisContext(answers)

    console.log('[Viability Analyzer] Requesting OpenAI analysis for session:', sessionId)

    // Call OpenAI with mixture-of-experts prompt
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: VIABILITY_EXPERT_PROMPT
        },
        {
          role: 'user',
          content: JSON.stringify(context, null, 2)
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse and validate JSON response
    const result = JSON.parse(content)

    console.log('[Viability Analyzer] Analysis complete:', {
      feasibility: result.feasibility,
      risk: result.overallRisk,
      constraints: result.keyConstraints?.length || 0,
      suggestions: result.suggestedFollowUpQuestions?.length || 0
    })

    res.json(result)
  } catch (error) {
    console.error('[Viability Analyzer] Error:', error)
    res.status(500).json({
      error: 'Viability analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
