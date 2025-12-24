import type { Question } from './types'

const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'What is the primary problem this product solves?',
    category: 'Problem',
    inputType: 'textarea',
    helpText: 'Focus on the "burning need" or specific pain point.',
    validationRules: { required: true, minLength: 10 }
  },
  {
    id: 'q2',
    text: 'Who is the ideal customer persona?',
    category: 'Persona',
    inputType: 'text',
    helpText: 'e.g., "Mid-sized Enterprise CTO" or "Busy suburban parent".',
    validationRules: { required: true }
  },
  {
    id: 'q3',
    text: 'What is the implementation difficulty?',
    category: 'Viability',
    inputType: 'select',
    validationRules: { allowedValues: ['Low', 'Medium', 'High'] }
  },
  {
    id: 'q4',
    text: 'Is this a B2B or B2C product?',
    category: 'Strategy',
    inputType: 'select',
    validationRules: { allowedValues: ['B2B', 'B2C', 'Both'] }
  },
  {
    id: 'q5',
    text: 'Describe the B2B sales cycle.',
    category: 'Strategy',
    inputType: 'textarea',
    conditionalLogic: { dependsOn: 'q4', showIfValue: 'B2B' }
  }
]

export async function loadQuestions(): Promise<Question[]> {
  // Simulator: In real app, fetch from JSON or API
  return Promise.resolve(MOCK_QUESTIONS)
}
