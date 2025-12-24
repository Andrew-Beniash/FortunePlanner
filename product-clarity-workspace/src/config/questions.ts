import type { Question } from './types'

export async function loadQuestions(): Promise<Question[]> {
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

    return questions as Question[]
  } catch (err) {
    console.error('[Product Clarity] Failed to load questions config:', err)
    // Fallback or re-throw depending on desired behavior. 
    // For now, re-throwing to alert dev/user, as config is critical.
    // Ideally we might return a safe fallback or error UI state.
    return []
  }
}
