// Request/Response types for API endpoints

export interface AnalyzeRequest {
  sessionData: {
    rawAnswers: Record<string, any>
    context?: string
  }
  analysisType: 'painPoints' | 'personas' | 'marketSizing' | 'viability'
}

export interface AnalyzeResponse {
  success: boolean
  data?: any
  error?: string
}

export interface TranslateRequest {
  text: string
  targetLanguage: string
  sourceLanguage?: string
}

export interface TranslateResponse {
  success: boolean
  translatedText?: string
  error?: string
}

export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
  openaiConnected: boolean
}
