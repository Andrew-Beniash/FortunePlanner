import type { SessionState } from '../state/sessionStore'
import { runAnalysis } from '../engine/analysisEngine'
import { loadTemplateBody, getTemplateForLanguage } from './templates'
import { compileTemplate } from './handlebarsEngine'
import { translateHtml } from '../engine/translation'
import type { DocumentContext, OutputFileConfig } from '../config/types'
import { startTimer, endTimer } from '../utils/perfMonitor'
import { getOutputById, getDefaultOutputId } from '../config/outputs'

// Map Session to DocumentContext
function buildContext(session: SessionState, analysisResults: any): DocumentContext {
  return {
    session: {
      sessionId: session.sessionId,
      blueprintVersion: session.blueprintVersion,
      timestamp: session.timestamp
    },
    rawAnswers: session.rawAnswers,
    derivedInferences: analysisResults.inferences,
    gaps: analysisResults.gaps,
    completionBySection: session.completionBySection,
    documentTitle: 'Product Clarity Brief',
    generatedAt: new Date().toISOString(),
    outputLanguage: session.outputLanguage
  }
}

export interface GeneratedOutput {
  html: string
  templateId: string
  outputId: string
  metadata: any
}

export async function generateOutput(
  session: SessionState,
  outputIdOrConfig?: string | OutputFileConfig
): Promise<GeneratedOutput> {
  startTimer('generateOutput')

  // Resolve output config
  let outputConfig: OutputFileConfig
  if (typeof outputIdOrConfig === 'string') {
    const config = await getOutputById(outputIdOrConfig)
    if (!config) throw new Error(`Output not found: ${outputIdOrConfig}`)
    outputConfig = config
  } else if (outputIdOrConfig) {
    outputConfig = outputIdOrConfig
  } else {
    const defaultId = getDefaultOutputId()
    const config = await getOutputById(defaultId)
    if (!config) throw new Error(`Default output not found: ${defaultId}`)
    outputConfig = config
  }

  const templateId = outputConfig.templateId

  // 1. Run Analysis (fresh)
  const analysis = await runAnalysis(session)

  // 2. Build Context
  const context = buildContext(session, analysis)

  // 3. Resolve Template (Language-aware)
  let config = await getTemplateForLanguage(templateId, session.outputLanguage)
  let needsFallbackTranslation = false

  if (!config) {
    // Try fallback to 'en' basic template if specific lang not found
    console.warn(`Template not found for ${templateId} (${session.outputLanguage}), falling back to 'en' and translating.`)
    config = await getTemplateForLanguage(templateId, 'en')
    needsFallbackTranslation = true
  }

  if (!config) {
    throw new Error(`Template not found: ${templateId} (checked ${session.outputLanguage} and 'en')`)
  }

  const templateBody = await loadTemplateBody(config.path)
  if (!templateBody) {
    throw new Error(`Failed to load template body for ${templateId}`)
  }

  // 4. Compile & Render
  let html = compileTemplate(templateBody, context)

  // 5. Apply Translation Fallback if needed
  if (needsFallbackTranslation && session.outputLanguage !== 'en') {
    html = await translateHtml(html, session.outputLanguage)
  }

  // 5. Construct Metadata
  const metadata = {
    sessionId: session.sessionId,
    blueprintVersion: session.blueprintVersion,
    exportedAt: new Date().toISOString(),
    sections: outputConfig.sections || [],
    analysisResults: {
      painPoints: analysis.inferences.painPoints.length,
      personas: analysis.inferences.personas.length,
      marketSegments: analysis.inferences.marketSizing.length
    },
    outputLanguage: session.outputLanguage
  }

  endTimer('generateOutput')

  return {
    html,
    templateId,
    outputId: outputConfig.id,
    metadata
  }
}
