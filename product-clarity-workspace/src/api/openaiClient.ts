/**
 * OpenAI API Client
 * Provides frontend interface to OpenAI-powered analysis endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export interface ViabilityAnalysisRequest {
  sessionId: string
  blueprintId: string
  answers: Record<string, any>
}

export interface ViabilityAnalysisResponse {
  feasibility: 'low' | 'medium' | 'high'
  overallRisk: 'low' | 'medium' | 'high'
  keyConstraints: string[]
  assumptions: string[]
  suggestedFollowUpQuestions: Array<{
    questionId: string
    text: string
    section: string
    priority: 'high' | 'medium' | 'low'
  }>
}

/**
 * Analyze product viability using OpenAI
 */
export async function analyzeViability(
  payload: ViabilityAnalysisRequest
): Promise<ViabilityAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/viability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Viability analysis failed: ${error.message || response.statusText}`)
  }

  return response.json()
}
