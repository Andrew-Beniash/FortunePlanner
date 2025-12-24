import type { SessionState, RawAnswer } from '../state/sessionStore'
import type { AnalyzerResult, Persona, AnalyzerOutput } from './types'
import { loadQuestions } from '../config/questions'
import type { Question } from '../config/types'

let cachedQuestions: Record<string, Question> | null = null

async function getQuestionsMap(): Promise<Record<string, Question>> {
  if (cachedQuestions) return cachedQuestions
  const questions = await loadQuestions()
  cachedQuestions = questions.reduce((acc, q) => ({ ...acc, [q.id]: q }), {} as Record<string, Question>)
  return cachedQuestions
}

function calculateConfidence(answer: RawAnswer): 'high' | 'medium' | 'low' {
  // If the underlying answer has low confidence, the extraction is low.
  if (answer.confidence === 'low') return 'low'

  // Heuristic: Very short answers might be less confident for extraction
  const text = String(answer.value || '')
  if (text.length < 5) return 'low'

  return answer.confidence || 'medium'
}

export async function runPersonaAnalyzer(session: SessionState): Promise<AnalyzerResult> {
  const questionsMap = await getQuestionsMap()
  const outputs: AnalyzerOutput[] = []

  // Identify candidate questions (Category = Persona or Target Audience)
  for (const [qId, rawAnswer] of Object.entries(session.rawAnswers)) {
    const question = questionsMap[qId]
    if (!question || !rawAnswer?.value) continue

    const category = question.category.toLowerCase()

    // Heuristic: Extract from Persona-related questions
    if (category === 'persona' || category === 'target audience') {
      const text = String(rawAnswer.value)

      const persona: Persona = {
        id: `p_${Date.now()}_${qId}`,
        label: text.split(/[.,\n]/)[0].substring(0, 30) + (text.length > 30 ? '...' : ''), // Simple label heuristic
        description: text,
        // Future: Extract role/industry using regex or NLP
      }

      const confidence = calculateConfidence(rawAnswer)

      outputs.push({
        type: 'persona',
        data: persona,
        provenance: {
          source: 'userInput',
          references: [qId],
          assumptions: []
        }
      })
    }
  }

  // Aggregate confidence logic could go here (e.g. lowest common denominator)

  return {
    analyzerId: 'personaAnalyzer',
    confidence: 'high', // Analyzer itself ran successfully
    outputs,
    warnings: []
  }
}
