import type { SessionState } from '../state/sessionStore'

// Domain Types
export interface PainPoint {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high'
  segments?: string[]
  notes?: string
}

export interface Provenance {
  source: 'userInput' | 'template' | 'inference'
  references: string[] // IDs of questions/docs used
  assumptions: string[]
}

export interface AnalyzerOutput {
  type: string
  data: any
  provenance: Provenance
}

export interface AnalyzerResult {
  analyzerId: string
  confidence: 'high' | 'medium' | 'low'
  outputs: AnalyzerOutput[]
  warnings: string[]
}

export type AnalyzerFunction = (session: SessionState) => AnalyzerResult
