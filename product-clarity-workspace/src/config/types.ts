export interface ValidationRules {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  allowedValues?: string[] // For select/multiselect
}

export interface Question {
  id: string
  text: string
  category: string
  inputType: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date'
  helpText?: string
  validationRules?: ValidationRules
  conditionalLogic?: {
    dependsOn: string
    showIfValue: any
  }
}

export interface Section {
  id: string
  title: string
  questionIds: string[]
}

export interface Blueprint {
  id: string
  version: string
  name: string
  description: string
  sections: Section[]
}

export interface TemplateConfig {
  id: string
  name: string
  description: string
}
