import type { TemplateConfig } from './types'

// In-memory overrides for custom templates
const overrideTemplates: Record<string, { content: string; locale?: string }> = {}

/**
 * Set custom template override
 * Allows users to upload and use custom templates without modifying files
 */
export function setTemplateOverride(
  templateId: string,
  content: string,
  locale?: string
) {
  overrideTemplates[templateId] = { content, locale }
}

/**
 * Clear all template overrides
 */
export function clearTemplateOverrides() {
  Object.keys(overrideTemplates).forEach(key => delete overrideTemplates[key])
}

/**
 * Get list of overridden template IDs
 */
export function getOverriddenTemplates(): string[] {
  return Object.keys(overrideTemplates)
}

const cache: Record<string, string> = {}

export async function loadTemplate(templateId: string, locale = 'en'): Promise<string> {
  // Check for override first
  const override = overrideTemplates[templateId]
  if (override && (!locale || !override.locale || override.locale === locale)) {
    return override.content
  }

  const cacheKey = `${templateId}-${locale}`
  if (cache[cacheKey]) {
    return cache[cacheKey]
  }

  // Try locale-specific first, fallback to base
  const paths = [
    `/config/templates/${templateId}.${locale}.hbs`,
    `/config/templates/${templateId}.hbs`
  ]

  for (const path of paths) {
    try {
      const response = await fetch(path)
      if (response.ok) {
        const content = await response.text()
        cache[cacheKey] = content
        return content
      }
    } catch (err) {
      // Continue to next path
    }
  }

  throw new Error(`Template not found: ${templateId}`)
}

export async function loadTemplates(): Promise<TemplateConfig[]> {
  // TODO: Fetch from public/config/templates/
  return []
}
