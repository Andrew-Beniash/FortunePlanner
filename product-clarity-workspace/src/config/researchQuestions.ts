import type { ResearchQuestion } from './types'

let cached: ResearchQuestion[] | null = null

/**
 * Load all research questions from configuration file
 */
export async function loadResearchQuestions(): Promise<ResearchQuestion[]> {
  if (cached) return cached

  const response = await fetch('/config/research-questions.json')
  if (!response.ok) {
    throw new Error(`Failed to load research questions: ${response.statusText}`)
  }

  const data = await response.json()
  cached = data as ResearchQuestion[]
  return cached
}

/**
 * Get research questions filtered by area
 */
export async function getResearchQuestionsByArea(
  area: ResearchQuestion['area']
): Promise<ResearchQuestion[]> {
  const all = await loadResearchQuestions()
  return all.filter(rq => rq.area === area)
}

/**
 * Get a specific research question by ID
 */
export async function getResearchQuestionById(
  id: string
): Promise<ResearchQuestion | undefined> {
  const all = await loadResearchQuestions()
  return all.find(rq => rq.id === id)
}

/**
 * Get research questions in dependency order for an area
 * Ensures questions with dependencies come after their dependencies
 */
export async function getOrderedResearchQuestions(
  area: ResearchQuestion['area']
): Promise<ResearchQuestion[]> {
  const questions = await getResearchQuestionsByArea(area)

  // Topological sort based on dependsOn
  const ordered: ResearchQuestion[] = []
  const remaining = [...questions]

  while (remaining.length > 0) {
    const canRun = remaining.filter(q => {
      if (!q.dependsOn || q.dependsOn.length === 0) return true
      return q.dependsOn.every((depId: string) => ordered.some(oq => oq.id === depId))
    })

    if (canRun.length === 0) {
      // Circular dependency or missing dependency
      console.warn('[Research Questions] Circular or missing dependencies detected')
      break
    }

    ordered.push(...canRun)
    canRun.forEach(q => {
      const idx = remaining.indexOf(q)
      if (idx > -1) remaining.splice(idx, 1)
    })
  }

  return ordered
}
