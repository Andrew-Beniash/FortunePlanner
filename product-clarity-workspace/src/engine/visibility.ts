import type { Question } from '../config/types'
import type { RawAnswer } from '../state/sessionStore'

export function isQuestionVisible(question: Question, rawAnswers: Record<string, RawAnswer>): boolean {
  if (!question.conditionalLogic) return true

  const { showIf, hideIf, dependsOn, showIfValue } = question.conditionalLogic

  // Hide If Logic (Precedence)
  if (hideIf) {
    const answer = rawAnswers[hideIf.questionId]?.value
    if (isMatch(answer, hideIf.value)) {
      return false
    }
  }

  // Show If Logic
  if (showIf) {
    const answer = rawAnswers[showIf.questionId]?.value
    return isMatch(answer, showIf.value)
  }

  // Legacy/Deprecated compatibility
  if (dependsOn) {
    const answer = rawAnswers[dependsOn]?.value
    return isMatch(answer, showIfValue)
  }

  return true
}

function isMatch(actual: any, expected: any): boolean {
  if (Array.isArray(expected)) {
    return expected.includes(actual)
  }
  return actual === expected
}
