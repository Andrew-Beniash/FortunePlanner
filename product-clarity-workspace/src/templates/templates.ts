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

export async function getTemplateForLanguage(templateId: string, lang: string): Promise<TemplateConfig | undefined> {
  const templates = await loadTemplates()

  // 1. Try exact match (e.g. 'product-brief-v1' and locale 'es')
  // Note: This assumes index.json allows multiple entries with same ID or we use a composite key in reality.
  // For v1 simple approach: We look for ID match AND locale match.
  // If templateId is generic like 'product-brief', we might have specific entries.
  // IF the system passes a specific ID like 'product-brief-es', this helper isn't needed.
  // BUT the requirement is to use outputLanguage state + base template ID.

  // Let's assume index.json will have unique IDs like 'product-brief-en' and 'product-brief-es'
  // OR we have one ID 'product-brief' with a 'variants' array?
  // The requirement says: "Load template metadata... includes language per template" or "single templateId has multiple entries".
  // A simpler way for v1: Use a naming convention or explicit 'locale' field filtering.
  // Let's go with: Filter by ID (base) and locale.

  // Strategy: The config list contains ALL variants. 
  // We look for one where `id` matches requested OR `id` is the base and `locale` matches.
  // Actually, distinct IDs in array is cleaner for the loader, but we need to know they belong to the same logical group.

  // Revised Strategy per spec: "getTemplateForLanguage(templateId, lang)"
  // We will assume `templateId` is the *base* ID (e.g. 'product-brief-v1').
  // The index.json will contain entries. We need to find the one that matches base ID + locale.
  // Since our index.json currently just has ID, we might need to update indices to be:
  // { id: 'product-brief-v1', locale: 'en' }, { id: 'product-brief-v1', locale: 'es' }
  // This implies non-unique IDs in the array? That's messy for 'find(t => t.id === ...)' usage elsewhere.

  // Better Strategy: `id` is unique (e.g. 'product-brief-v1-en').
  // We strip the suffix to find the group? Or we add a `groupId`?
  // Let's stick to the simplest valid JSON structure: 
  // [ { id: 'product-brief-v1', locale: 'en', path: ... }, { id: 'product-brief-v1', locale: 'es', path: ... } ]
  // Is non-unique ID allowed? `templates.find(t => t.id === templateId)` in generation.ts suggests unique ID is expected there.
  // If we duplicate IDs, `find` returns the first one (usually 'en').

  // So `getTemplateForLanguage` will be the smart resolver.

  const exact = templates.find(t => t.id === templateId && t.locale === lang)
  if (exact) return exact

  // Fallback: Default to 'en' if requested lang not found
  if (lang !== 'en') {
    const fallback = templates.find(t => t.id === templateId && t.locale === 'en')
    if (fallback) return fallback
  }

  // Fallback: Just the first one with that ID (legacy behavior)
  return templates.find(t => t.id === templateId)
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
