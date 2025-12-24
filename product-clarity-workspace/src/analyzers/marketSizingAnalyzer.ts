import type { SessionState } from '../state/sessionStore'
import type { AnalyzerResult, MarketSizing, AnalyzerOutput } from './types'
import { loadQuestions } from '../config/questions'
import type { Question } from '../config/types'

let cachedQuestions: Record<string, Question> | null = null

async function getQuestionsMap(): Promise<Record<string, Question>> {
  if (cachedQuestions) return cachedQuestions
  const questions = await loadQuestions()
  cachedQuestions = questions.reduce((acc, q) => ({ ...acc, [q.id]: q }), {} as Record<string, Question>)
  return cachedQuestions
}

export async function runMarketSizingAnalyzer(session: SessionState): Promise<AnalyzerResult> {
  const questionsMap = await getQuestionsMap()
  const outputs: AnalyzerOutput[] = []

  // Inputs needed (heuristic mapping)
  let segment: string | null = null
  let price: number | null = null
  let count: number | null = null
  const contributingQIds: string[] = []

  // Scan answers for relevant data
  for (const [qId, rawAnswer] of Object.entries(session.rawAnswers)) {
    const question = questionsMap[qId]
    if (!question || !rawAnswer?.value) continue

    const category = question.category.toLowerCase()

    // Attempt to extract data based on question Category or IDs (heuristic)
    if (category.includes('market') || category.includes('customer')) {
      const val = String(rawAnswer.value)

      // Heuristically identifying "Segment" from a text answer
      if (!segment && val.length < 50) {
        segment = val
        contributingQIds.push(qId)
      }

      // Check for numeric values for TAM (very naive)
      if (question.inputType === 'number') {
        const num = parseFloat(val)
        if (!isNaN(num)) {
          // Heuristic: smaller numbers might be price, larger might be count?
          // Without precise IDs, this is a guess.
          // Ideally we'd match on question.id or tag.
          if (num > 1000 && !count) count = num
          else if (num < 1000 && !price) price = num

          contributingQIds.push(qId)
        }
      }
    }
  }

  // If we have at least a segment, infer something
  if (segment) {
    const sizing: MarketSizing = {
      id: `ms_${Date.now()}`,
      segment: segment,
      notes: 'Estimated from market inputs'
    }

    if (price && count) {
      sizing.tam = price * count
      sizing.notes += ` (TAM calculated as ${price} * ${count})`
    }

    outputs.push({
      type: 'marketSizing',
      data: sizing,
      provenance: {
        source: 'userInput',
        references: contributingQIds,
        assumptions: ['Assuming provided numbers represent generic market volume and price']
      }
    })
  }

  return {
    analyzerId: 'marketSizingAnalyzer',
    confidence: segment ? 'medium' : 'low',
    outputs,
    warnings: !segment ? ['No market segment identified'] : []
  }
}
