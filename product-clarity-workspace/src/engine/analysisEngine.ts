import type { SessionState } from '../state/sessionStore'
import { normalizeAnswers } from './normalize'
import { runPainPointAnalyzer } from '../analyzers/painPointAnalyzer'
import { runPersonaAnalyzer } from '../analyzers/personaAnalyzer'
import { runMarketSizingAnalyzer } from '../analyzers/marketSizingAnalyzer'
import { runViabilityAnalyzer } from '../analyzers/viabilityAnalyzer'
import type { PainPoint, Persona, MarketSizing, ViabilityAssessment } from '../analyzers/types'

export interface AnalysisSummary {
  inferences: {
    painPoints: PainPoint[]
    personas: Persona[]
    marketSizing: MarketSizing[]
    viability: ViabilityAssessment[]
  }
  gaps: any[]
  contradictions: any[]
}

export async function runAnalysis(session: SessionState): Promise<AnalysisSummary> {
  const normalized = normalizeAnswers(session.rawAnswers) // Keeping for now to avoid unused var

  // Run Analyzers Parallelly
  const [ppResult, personaResult, marketResult, viabilityResult] = await Promise.all([
    runPainPointAnalyzer(session),
    runPersonaAnalyzer(session),
    runMarketSizingAnalyzer(session),
    runViabilityAnalyzer(session)
  ])

  // Extract Data
  const painPoints = ppResult.outputs
    .filter(o => o.type === 'painPoint')
    .map(o => o.data as PainPoint)

  const personas = personaResult.outputs
    .filter(o => o.type === 'persona')
    .map(o => o.data as Persona)

  const marketSizing = marketResult.outputs
    .filter(o => o.type === 'marketSizing')
    .map(o => o.data as MarketSizing)

  const viability = viabilityResult.outputs
    .filter(o => o.type === 'viabilityAssessment')
    .map(o => o.data as ViabilityAssessment)

  return {
    inferences: {
      painPoints,
      personas,
      marketSizing,
      viability
    },
    gaps: [],
    contradictions: []
  }
}
