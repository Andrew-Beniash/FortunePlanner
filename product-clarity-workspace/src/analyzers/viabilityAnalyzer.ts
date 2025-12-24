import type { SessionState } from '../state/sessionStore'
import type { AnalyzerResult, ViabilityAssessment } from './types'
import { analyzeViability } from '../api/openaiClient'

/**
 * Extract relevant answers for viability analysis
 */
function extractRelevantAnswers(rawAnswers: Record<string, any>): Record<string, any> {
  // Include all answers for comprehensive analysis
  // The backend will filter/format as needed
  return rawAnswers
}

/**
 * Viability Analyzer
 * Uses OpenAI to assess product feasibility, risks, and constraints
 */
export async function runViabilityAnalyzer(session: SessionState): Promise<AnalyzerResult> {
  try {
    // Extract answers
    const answers = extractRelevantAnswers(session.rawAnswers)

    // Skip if no substantial answers
    if (Object.keys(answers).length === 0) {
      return {
        analyzerId: 'viabilityAnalyzer',
        confidence: 0,
        outputs: []
      }
    }

    console.log('[Viability Analyzer] Calling OpenAI for session:', session.sessionId)

    // Call OpenAI backend
    const aiResult = await analyzeViability({
      sessionId: session.sessionId,
      blueprintId: session.blueprintId || 'default',
      answers
    })

    console.log('[Viability Analyzer] Received analysis:', {
      feasibility: aiResult.feasibility,
      risk: aiResult.overallRisk,
      constraints: aiResult.keyConstraints.length
    })

    // Map to ViabilityAssessment
    const viability: ViabilityAssessment = {
      feasibility: aiResult.feasibility,
      overallRisk: aiResult.overallRisk,
      keyConstraints: aiResult.keyConstraints,
      notes: aiResult.assumptions.join('; ')
    }

    return {
      analyzerId: 'viabilityAnalyzer',
      confidence: 0.85, // High confidence in GPT-4 analysis
      outputs: [{
        type: 'viabilityAssessment',
        data: viability,
        provenance: {
          source: 'inference',
          assumptions: aiResult.assumptions,
          references: Object.keys(answers)
        }
      }],
      // Store suggestions for potential needs_clarification mapping
      metadata: {
        suggestedFollowUpQuestions: aiResult.suggestedFollowUpQuestions
      }
    }
  } catch (error) {
    console.error('[Viability Analyzer] Error:', error)

    // Return empty result on error - don't break the flow
    return {
      analyzerId: 'viabilityAnalyzer',
      confidence: 0,
      outputs: [],
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
