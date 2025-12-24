
// Simple in-memory cache: (hash of text + lang) -> translated text
const translationCache = new Map<string, string>()

// Mock translation function for v1
// In a real app, this would call an API (Google Translate, DeepL, etc.)
async function mockTranslate(text: string, targetLang: string): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 10))

  // Simple heuristic stub
  if (targetLang === 'es') return `[ES] ${text}`
  if (targetLang === 'fr') return `[FR] ${text}`
  if (targetLang === 'de') return `[DE] ${text}`

  return `[${targetLang.toUpperCase()}] ${text}`
}

// Tokenization to split text from placeholders/HTML
// We want to translate "Hello {{name}}" -> "Bonjour {{name}}"
// And "<b>Hello</b>" -> "<b>Bonjour</b>" 
// This is complex. For v1, we will assume sections are HTML.
// We will iterate text nodes.

export async function translateHtml(html: string, targetLang: string): Promise<string> {
  if (targetLang === 'en') return html

  // Simple regex-based tokenization for v1
  // We want to match tags and placeholders to KEEP them, and translate the rest.
  // Placeholders: {{...}} or {{{...}}}
  // Tags: <...>

  // Regex logic:
  // ({{.*?}})  -> Match handlebars
  // (<[^>]+>)  -> Match HTML tags

  // We split by these capturing groups.
  // The parts that don't match are the text content.

  const tokenRegex = /({{{?[\s\S]*?}?}?)|(<[^>]+>)/g

  const parts = html.split(tokenRegex).filter(p => p !== undefined) // filter undefined from capturing groups not matching

  const translatedParts = await Promise.all(parts.map(async (part) => {
    if (!part) return ''

    // Check if it's a tag or placeholder
    if (tokenRegex.test(part)) {
      return part // Preserve as-is
    }

    // It's text. Trim it.
    const trimmed = part.trim()
    if (!trimmed) return part // Whitespace preservation

    // Check cache
    const cacheKey = `${targetLang}:${trimmed}`
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!
    }

    // Translate
    // We only translate meaningful text, skipping short punctuation/symbols might be desired but for now translate all.
    const translated = await mockTranslate(trimmed, targetLang)

    // Cache it
    translationCache.set(cacheKey, translated)

    // Re-attach whitespace if needed (naive)
    // Ideally we translate the whole string including whitespace but APIs often trim.
    // For this stub, we return the translated version directly replacing the trimmed part, 
    // effectively losing surrounding whitespace if we aren't careful.
    // Let's just return the translated text for now.
    return part.replace(trimmed, translated)
  }))

  return translatedParts.join('')
}
