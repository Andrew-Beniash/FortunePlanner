import type { SessionState } from '../state/sessionStore'
import { normalizeAnswers } from './normalize'
import { runPainPointAnalyzer } from '../analyzers/painPointAnalyzer'
import { runPersonaAnalyzer } from '../analyzers/personaAnalyzer'
import type { PainPoint, Persona } from '../analyzers/types'

export interface AnalysisSummary {
  inferences: {
    painPoints: PainPoint[]
    personas: Persona[]
  }
  gaps: any[]
  contradictions: any[]
}

export async function runAnalysis(session: SessionState): Promise<AnalysisSummary> {
  const normalized = normalizeAnswers(session.rawAnswers) // Keeping for now to avoid unused var

  // Run Analyzers Parallelly
  const [ppResult, personaResult] = await Promise.all([
    runPainPointAnalyzer(session),
    runPersonaAnalyzer(session)
  ])

  // Extract Data
  const painPoints = ppResult.outputs
    .filter(o => o.type === 'painPoint')
    .map(o => o.data as PainPoint)

  const personas = personaResult.outputs
    .filter(o => o.type === 'persona')
    .map(o => o.data as Persona)

  return {
    inferences: {
      painPoints,
      personas
    },
    gaps: [],
    contradictions: []
  }
}
