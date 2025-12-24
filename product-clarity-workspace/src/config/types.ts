export interface Question {
  id: string
  text: string
  type: string
  // ... other fields
}

export interface Blueprint {
  id: string
  version: string
  sections: any[]
}

export interface TemplateConfig {
  id: string
  name: string
  // ...
}
