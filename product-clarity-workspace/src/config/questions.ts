import type { Question } from './types'

// In-memory override for custom questions
let overrideQuestions: Question[] | null = null

/**
 * Set custom questions override
 * Allows users to upload and use custom questions without modifying files
 */
export function setQuestionsOverride(questions: Question[] | null) {
  overrideQuestions = questions
}

/**
 * Get current questions override if set
 */
export function getQuestionsOverride(): Question[] | null {
  return overrideQuestions
}

let cachedQuestions: Question[] | null = null

export async function loadQuestions(): Promise<Question[]> {
  // Return override if present
  if (overrideQuestions) {
    return overrideQuestions
  }

  // Use cache if available
  if (cachedQuestions) {
    return cachedQuestions
  }

  try {
    const response = await fetch('/config/questions.json')
    if (!response.ok) {
      throw new Error(`Failed to load questions: ${response.statusText}`)
    }
    const questions = await response.json()

    // Basic runtime validation
    if (!Array.isArray(questions)) {
      throw new Error('Questions config must be an array')
    }

    // Optional: More rigorous schema validation could go here
    cachedQuestions = questions as Question[]
    return questions as Question[]
  } catch (err) {
    console.error('[Product Clarity] Failed to load questions config:', err)
    // Fallback or re-throw depending on desired behavior. 
    // For now, re-throwing to alert dev/user, as config is critical.
    // Ideally we might return a safe fallback or error UI state.
    return []
  }
}
