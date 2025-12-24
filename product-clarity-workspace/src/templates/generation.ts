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
      blueprintId: session.blueprintId,
      blueprintVersion: session.blueprintVersion,
      timestamp: new Date().toISOString()
    },
    rawAnswers: answers,
    derivedInferences: analysisResults.inferences
  }
}

export interface GeneratedOutput {
  html: string
  templateId: string
}

export async function generateOutput(session: SessionState, templateId: string = 'product-brief-v1'): Promise<GeneratedOutput> {
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

  return {
    html,
    templateId
  }
}
