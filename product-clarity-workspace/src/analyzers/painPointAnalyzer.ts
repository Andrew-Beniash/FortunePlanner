import type { SessionState } from '../state/sessionStore'
import type { AnalyzerResult, PainPoint, AnalyzerOutput } from './types'
import { loadQuestions } from '../config/questions'
import type { Question } from '../config/types'

// TODO: In a real app, we might load questions differently or pass them in context
// For now, we risk re-loading or assuming they are cached/fast.
// Alternatively, we could inspect session.rawAnswers keys and just use the text we have if we stored question text.
// But we need 'category' from config.

let cachedQuestions: Record<string, Question> | null = null

async function getQuestionsMap(): Promise<Record<string, Question>> {
  if (cachedQuestions) return cachedQuestions
  const questions = await loadQuestions()
  cachedQuestions = questions.reduce((acc, q) => ({ ...acc, [q.id]: q }), {} as Record<string, Question>)
  return cachedQuestions
}

export async function runPainPointAnalyzer(session: SessionState): Promise<AnalyzerResult> {
  const questionsMap = await getQuestionsMap()
  const outputs: AnalyzerOutput[] = []

  // Identify candidate questions (Category = Problem)
  // For now we scan all answers and check their question category

  for (const [qId, rawAnswer] of Object.entries(session.rawAnswers)) {
    const question = questionsMap[qId]
    if (!question || !rawAnswer?.value) continue

    // Heuristic: If it's a Problem category question, treat answer as a pain point source
    if (question.category.toLowerCase() === 'problem') {
      const text = String(rawAnswer.value)

      // Simple extraction: The whole answer is one pain point for now.
      // Future: NLP to split multiple points.

      const painPoint: PainPoint = {
        id: `pp_${Date.now()}_${qId}`, // simple unique ID
        description: text,
        severity: 'medium', // Default
        notes: 'Extracted from user answer'
      }

      outputs.push({
        type: 'painPoint',
        data: painPoint,
        provenance: {
          source: 'userInput',
          references: [qId],
          assumptions: []
        }
      })
    }
  }

  return {
    analyzerId: 'painPointAnalyzer',
    confidence: 'high', // Rule-based extraction is high confidence that "user said this"
    outputs,
    warnings: []
  }
}
