import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import viabilityRouter from './routes/viabilityRouter'
import type { AnalyzeRequest, AnalyzeResponse, TranslateRequest, TranslateResponse, HealthResponse } from './types'

const app = express()

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

app.use(express.json())

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Mount routers
app.use('/api/analyze', viabilityRouter)

// Health check endpoint
app.get('/health', async (req, res) => {
  let openaiConnected = false

  try {
    // Simple test to verify OpenAI connection
    await openai.models.list()
    openaiConnected = true
  } catch (error) {
    console.error('OpenAI connection test failed:', error)
  }

  const response: HealthResponse = {
    status: openaiConnected ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    openaiConnected
  }

  res.json(response)
})

// Analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { sessionData, analysisType }: AnalyzeRequest = req.body

    if (!sessionData || !analysisType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionData and analysisType'
      })
    }

    // Build prompt based on analysis type
    const prompt = buildAnalysisPrompt(analysisType, sessionData)

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert product analyst. Analyze user inputs and provide structured insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const result = completion.choices[0]?.message?.content

    const response: AnalyzeResponse = {
      success: true,
      data: result ? parseAnalysisResult(result, analysisType) : null
    }

    res.json(response)
  } catch (error) {
    console.error('Analysis API error:', error)
    const response: AnalyzeResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    res.status(500).json(response)
  }
})

// Translation endpoint (for fallback translation)
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage }: TranslateRequest = req.body

    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text and targetLanguage'
      })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Preserve any HTML tags, placeholders like {{variable}}, and formatting. Only translate the actual text content.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const translatedText = completion.choices[0]?.message?.content || text

    const response: TranslateResponse = {
      success: true,
      translatedText
    }

    res.json(response)
  } catch (error) {
    console.error('Translation API error:', error)
    const response: TranslateResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    res.status(500).json(response)
  }
})

// Helper functions
function buildAnalysisPrompt(type: string, sessionData: any): string {
  const answers = JSON.stringify(sessionData.rawAnswers, null, 2)

  switch (type) {
    case 'painPoints':
      return `Analyze the following user responses and identify key pain points. Return a JSON array of objects with: id, description, severity (low/medium/high), and notes.\n\nUser Responses:\n${answers}`

    case 'personas':
      return `Based on these user responses, identify target user personas. Return a JSON array of objects with: id, label, description, role, industry, and notes.\n\nUser Responses:\n${answers}`

    case 'marketSizing':
      return `Estimate market sizing based on these responses. Return a JSON array with: id, segment, tam (optional), sam (optional), som (optional), and notes.\n\nUser Responses:\n${answers}`

    case 'viability':
      return `Assess product viability from these responses. Return a JSON array with: id, feasibility (low/medium/high), keyConstraints (array), timelineRisk, overallRisk, and notes.\n\nUser Responses:\n${answers}`

    default:
      return `Analyze these user responses:\n${answers}`
  }
}

function parseAnalysisResult(result: string, type: string): any {
  try {
    // Try to parse as JSON first
    return JSON.parse(result)
  } catch {
    // If not JSON, return raw text
    return { raw: result, type }
  }
}

// Start server
const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`✅ OpenAI server running on http://localhost:${port}`)
  console.log(`📝 Allowed origins: ${allowedOrigins.join(', ')}`)
  console.log(`🔑 OpenAI API key: ${process.env.OPENAI_API_KEY ? '***configured***' : '❌ MISSING'}`)
})
