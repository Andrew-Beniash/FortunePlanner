// Frontend client for OpenAI backend API
import { API_BASE_URL } from '../config/api'

export interface AnalysisPayload {
  sessionData: {
    rawAnswers: Record<string, any>
    context?: string
  }
  analysisType: 'painPoints' | 'personas' | 'marketSizing' | 'viability'
}

export interface TranslationPayload {
  text: string
  targetLanguage: string
  sourceLanguage?: string
}

export async function callAnalysisAPI(payload: AnalysisPayload): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Analysis API failed: ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Analysis failed')
  }

  return data.data
}

export async function callTranslationAPI(payload: TranslationPayload): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Translation API failed: ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Translation failed')
  }

  return data.translatedText
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    const data = await response.json()
    return data.status === 'ok' && data.openaiConnected
  } catch (error) {
    console.error('Backend health check failed:', error)
    return false
  }
}
