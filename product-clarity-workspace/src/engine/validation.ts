import type { SessionState, RawAnswer, Gap } from '../state/sessionStore'
import type { Question } from '../config/types'
import { loadQuestions } from '../config/questions'
import { loadBlueprints } from '../config/blueprints'

export interface ValidationError {
  questionId: string
  code: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationSummary {
  isValid: boolean
  errors: ValidationError[]
  gaps: Gap[]
}

export function validateAnswer(question: Question, rawAnswer: RawAnswer | undefined): ValidationError[] {
  const errors: ValidationError[] = []
  const value = rawAnswer?.value
  const rules = question.validationRules || {}

  // Required Field Check
  if (rules.required) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      errors.push({
        questionId: question.id,
        code: 'required',
        message: 'This question is required',
        severity: 'error'
      })
      return errors // Stop if required and missing
    }
  }

  // Skip checks if empty (and not required)
  if (value === undefined || value === null || value === '') {
    return errors
  }

  // String Constraints
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push({
        questionId: question.id,
        code: 'min_length',
        message: `Must be at least ${rules.minLength} characters`,
        severity: 'error'
      })
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push({
        questionId: question.id,
        code: 'max_length',
        message: `Must be no more than ${rules.maxLength} characters`,
        severity: 'error'
      })
    }
    if (rules.pattern) {
      try {
        const regex = new RegExp(rules.pattern)
        if (!regex.test(value)) {
          errors.push({
            questionId: question.id,
            code: 'pattern_mismatch',
            message: 'Invalid format',
            severity: 'error'
          })
        }
      } catch (e) {
        console.warn('Invalid regex pattern in question config', rules.pattern)
      }
    }
  }

  // Allowed Values
  if (rules.allowedValues) {
    if (!rules.allowedValues.includes(value)) {
      errors.push({
        questionId: question.id,
        code: 'invalid_option',
        message: 'Selected option is not allowed',
        severity: 'error'
      })
    }
  }

  // Numeric Constraints (if input was parsed as number or strictly number)
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push({
        questionId: question.id,
        code: 'min_value',
        message: `Value must be at least ${rules.min}`,
        severity: 'error'
      })
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push({
        questionId: question.id,
        code: 'max_value',
        message: `Value must be no more than ${rules.max}`,
        severity: 'error'
      })
    }
  }

  return errors
}

export async function validateSession(session: SessionState): Promise<ValidationSummary> {
  const [questions, blueprints] = await Promise.all([loadQuestions(), loadBlueprints()])

  // Create quick lookup maps
  const questionMap = questions.reduce((acc, q) => ({ ...acc, [q.id]: q }), {} as Record<string, Question>)

  // Determine active questions from blueprint
  // Fallback to first blueprint if ID not matched, or handle gracefully
  const activeBlueprint = blueprints.find(b => b.id === session.blueprintId) || blueprints[0]
  const activeQuestionIds = activeBlueprint ? activeBlueprint.sections.flatMap(s => s.questionIds) : []

  const errors: ValidationError[] = []
  const gaps: Gap[] = []

  // Iterate over active questions
  for (const qId of activeQuestionIds) {
    const question = questionMap[qId]
    if (!question) continue

    const answer = session.rawAnswers[qId]
    const qErrors = validateAnswer(question, answer)

    errors.push(...qErrors)

    // Convert Errors to Gaps
    for (const err of qErrors) {
      gaps.push({
        questionId: qId,
        reason: err.message,
        severity: err.severity === 'error' ? 'high' : 'medium'
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    gaps
  }
}
