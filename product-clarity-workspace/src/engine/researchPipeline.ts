import type { SessionState } from '../state/sessionStore'
import type { ResearchQuestion } from '../config/types'
import { getResearchQuestionsByArea, getOrderedResearchQuestions } from '../config/researchQuestions'

/**
 * Research Pipeline Orchestrator
 * 
 * Executes sequential OpenAI research questions with dependency management
 * Future implementation will:
 * - Load ordered research questions for an area
 * - Resolve dependencies (dependsOn)
 * - Build prompts from inputSources (answers, inferences, prior research)
 * - Call OpenAI for each question
 * - Store results via setResearchAnswer
 * - Return aggregated analysis
 */

/**
 * Run sequential research questions for a given area
 * 
 * @param area - The research area to execute (e.g., 'viability', 'market')
 * @param session - Current session state
 * @returns Promise that resolves when all questions complete
 */
export async function runResearchPipeline(
  area: ResearchQuestion['area'],
  session: SessionState
): Promise<void> {
  try {
    // Load research questions in dependency order
    const questions = await getOrderedResearchQuestions(area)

    console.log(`[Research Pipeline] Would run ${questions.length} questions for ${area}:`)
    questions.forEach(q => {
      console.log(`  - ${q.id}: ${q.label}${q.dependsOn ? ` (depends on: ${q.dependsOn.join(', ')})` : ''}`)
    })

    // TODO: Implement sequential execution
    // For each question:
    //   1. Build prompt using Handlebars template and inputSources
    //   2. Fetch data from rawAnswers, derivedInferences, researchAnswers
    //   3. Call OpenAI API
    //   4. Parse response
    //   5. Store via session.setResearchAnswer({ questionId, outputKey, data, timestamp })
    //   6. Continue to next question

    console.log('[Research Pipeline] Placeholder - actual execution not yet implemented')
  } catch (error) {
    console.error(`[Research Pipeline] Error running pipeline for ${area}:`, error)
    throw error
  }
}

/**
 * Get research answer for a specific question
 */
export function getResearchAnswer(
  session: SessionState,
  questionId: string
): any | null {
  return session.researchAnswers[questionId]?.data || null
}

/**
 * Check if research has been run for an area
 */
export function hasResearchForArea(
  session: SessionState,
  area: string
): boolean {
  return Object.keys(session.researchAnswers).some(id => id.startsWith(`${area}_`))
}
