import type { SessionState } from '../state/sessionStore'
import { runAnalysis } from '../engine/analysisEngine'
import { loadTemplates, loadTemplateBody } from './templates'
import { compileTemplate } from './handlebarsEngine'
import type { DocumentContext } from '../config/types'

// Map Session to DocumentContext
function buildContext(session: SessionState, analysisResults: any): DocumentContext {
  // Simplify rawAnswers for template consumption: { q1: "my value", q2: ... }
  const answers: Record<string, any> = {}
  for (const [key, val] of Object.entries(session.rawAnswers)) {
    answers[key] = val?.value
  }

  return {
    documentTitle: 'Product Clarity Document', // Could come from answers
    session: {
      sessionId: session.sessionId,
      blueprintId: session.blueprintId || 'unknown',
      blueprintVersion: session.blueprintVersion,
      timestamp: new Date().toISOString()
    },
    rawAnswers: answers,
    derivedInferences: analysisResults.inferences
  }
}

import type { ExportMetadata } from '../config/types'

export interface GeneratedOutput {
  html: string
  templateId: string
  metadata: ExportMetadata
}

export async function generateOutput(session: SessionState, templateId: string = 'product-brief-v1'): Promise<GeneratedOutput> {
  // 0. Null check
  if (!templateId) throw new Error('Template ID is required')

  // 1. Run Analysis (fresh)
  const analysis = await runAnalysis(session)

  // 2. Build Context
  const context = buildContext(session, analysis)

  // 3. Load Template
  const templates = await loadTemplates()
  const config = templates.find(t => t.id === templateId)
  if (!config) {
    throw new Error(`Template not found: ${templateId}`)
  }

  const templateBody = await loadTemplateBody(config.path)
  if (!templateBody) {
    throw new Error(`Failed to load template body for ${templateId}`)
  }

  // 4. Compile & Render
  const html = compileTemplate(templateBody, context)

  // 5. Construct Metadata
  const completionPercentage = session.completionBySection['general']?.completeness || 0

  const metadata: ExportMetadata = {
    sessionId: session.sessionId,
    blueprintId: session.blueprintId || 'unknown',
    blueprintVersion: session.blueprintVersion,
    timestamp: new Date().toISOString(),
    completionPercentage,
    assumptions: session.derivedInferences.assumptions || [] // Ensure fallback
  }

  return {
    html,
    templateId,
    metadata
  }
}
