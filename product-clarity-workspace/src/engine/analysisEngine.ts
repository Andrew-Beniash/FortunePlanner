import type { SessionState } from '../state/sessionStore'
import { normalizeAnswers } from './normalize'
import { runPainPointAnalyzer } from '../analyzers/painPointAnalyzer'
import type { PainPoint } from '../analyzers/types'

export interface AnalysisSummary {
  inferences: {
    painPoints: PainPoint[]
  }
  gaps: any[]
  contradictions: any[]
}

export async function runAnalysis(session: SessionState): Promise<AnalysisSummary> {
  const normalized = normalizeAnswers(session.rawAnswers)

  // Run Analyzers
  const ppResult = await runPainPointAnalyzer(session)

  // Extract Pain Points from outputs
  const painPoints = ppResult.outputs
    .filter(o => o.type === 'painPoint')
    .map(o => o.data as PainPoint)

  return {
    inferences: {
      painPoints
    },
    gaps: [], // TODO: Merge gaps from validation if needed here, though validation is separate step
    contradictions: []
  }
}
