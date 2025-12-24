import type { TemplateConfig } from '../config/types'

let cachedTemplates: TemplateConfig[] | null = null

export async function loadTemplates(): Promise<TemplateConfig[]> {
  try {
    if (cachedTemplates) return cachedTemplates

    const response = await fetch('/config/templates/index.json')
    if (!response.ok) throw new Error('Failed to load template index')

    const templates = await response.json()
    if (!Array.isArray(templates)) throw new Error('Invalid template index')

    cachedTemplates = templates as TemplateConfig[]
    return cachedTemplates
  } catch (err) {
    console.error('[Template Loader] Error:', err)
    return []
  }
}

export async function loadTemplateBody(path: string): Promise<string> {
  try {
    const response = await fetch(path)
    if (!response.ok) throw new Error(`Failed to load template body: ${path}`)
    return await response.text()
  } catch (err) {
    console.error('[Template Loader] Failed to load body:', err)
    return ''
  }
}
