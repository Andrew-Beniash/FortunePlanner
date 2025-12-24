import type { SessionState } from '../state/sessionStore'
import type { AnalyzerResult, ViabilityAssessment, AnalyzerOutput } from './types'
import { loadQuestions } from '../config/questions'
import type { Question } from '../config/types'

let cachedQuestions: Record<string, Question> | null = null

async function getQuestionsMap(): Promise<Record<string, Question>> {
  if (cachedQuestions) return cachedQuestions
  const questions = await loadQuestions()
  cachedQuestions = questions.reduce((acc, q) => ({ ...acc, [q.id]: q }), {} as Record<string, Question>)
  return cachedQuestions
}

export async function runViabilityAnalyzer(session: SessionState): Promise<AnalyzerResult> {
  const questionsMap = await getQuestionsMap()
  const outputs: AnalyzerOutput[] = []

  const constraints: string[] = []
  let riskScore = 0

  const contributingQIds: string[] = []

  // Scan for viability signals
  for (const [qId, rawAnswer] of Object.entries(session.rawAnswers)) {
    const question = questionsMap[qId]
    if (!question || !rawAnswer?.value) continue

    const category = question.category.toLowerCase()

    if (category.includes('solution') || category.includes('viability') || category.includes('team')) {
      const val = String(rawAnswer.value).toLowerCase()
      contributingQIds.push(qId)

      // Heuristic Logic
      if (val.includes('small team') || val.includes('no budget')) {
        constraints.push(rawAnswer.value as string)
        riskScore += 2
      }

      if (question.inputType === 'select') {
        if (val === 'high' && question.text.includes('difficulty')) {
          riskScore += 3
        }
      }
    }
  }

  // Determine feasibility based on score
  let feasibility: 'low' | 'medium' | 'high' = 'high'
  if (riskScore > 5) feasibility = 'low'
  else if (riskScore > 2) feasibility = 'medium'

  const assessment: ViabilityAssessment = {
    id: `va_${Date.now()}`,
    feasibility,
    keyConstraints: constraints,
    overallRisk: riskScore > 5 ? 'high' : (riskScore > 2 ? 'medium' : 'low'),
    notes: `Calculated risk score: ${riskScore}`
  }

  outputs.push({
    type: 'viabilityAssessment',
    data: assessment,
    provenance: {
      source: 'userInput',
      references: contributingQIds,
      assumptions: []
    }
  })

  return {
    analyzerId: 'viabilityAnalyzer',
    confidence: 'medium',
    outputs,
    warnings: []
  }
}
