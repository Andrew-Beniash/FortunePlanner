import { SessionState, DerivedInferences, Gap, Contradiction } from '../state/sessionStore'

export interface AnalyzerResult {
  id: string
  type: 'inference' | 'gap' | 'contradiction'
  content: any
  confidence: 'high' | 'medium' | 'low'
  provenance: string[] // question IDs
}

export type AnalyzerFunction = (session: SessionState) => AnalyzerResult[]
