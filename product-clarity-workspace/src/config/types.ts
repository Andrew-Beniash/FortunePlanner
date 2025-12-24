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
    dependsOn?: string // Deprecated, mapped to showIf
    showIfValue?: any // Deprecated
    showIf?: { questionId: string; value: any }
    hideIf?: { questionId: string; value: any }
  }
}

export interface TemplateConfig {
  id: string
  name: string
  description?: string
  path: string
  version: string
  locale?: string
  sections?: string[] // optional granular section tracking
}

export interface DocumentContext {
  documentTitle: string
  session: {
    sessionId: string
    blueprintId?: string
    blueprintVersion: string
    timestamp: string
  }
  rawAnswers: Record<string, any> // Simplified for flexibility in template
  derivedInferences: any // Will match AnalysisSummary.inferences
  gaps?: any[]
  completionBySection?: any
  generatedAt: string
  outputLanguage?: string
}

export interface ExportMetadata {
  sessionId: string
  blueprintVersion: string
  exportedAt: string
  sections: string[]
  analysisResults: {
    painPoints: number
    personas: number
    marketSegments: number
  }
  outputLanguage: string
}

export interface OutputFileConfig {
  id: string
  label: string
  description?: string
  formats: ('md' | 'docx' | 'pdf')[]
  templateId: string
  sections?: string[]
  analyzers?: string[]
  fileNamePattern?: string
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


