import { SessionState } from '../state/sessionStore'
import { normalizeAnswers } from './normalize'
// import analyzers...

export interface AnalysisSummary {
  inferences: any[]
  gaps: any[]
  contradictions: any[]
}

export function runAnalysis(session: SessionState): AnalysisSummary {
  const normalized = normalizeAnswers(session.rawAnswers)
  // TODO: Run analyzers
  return {
    inferences: [],
    gaps: [],
    contradictions: []
  }
}
