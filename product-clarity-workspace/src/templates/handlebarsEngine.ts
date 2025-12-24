import Handlebars from 'handlebars'

// Register common helpers (one-time setup if needed, or re-register ensuring safety)
// In a larger app, move helper registration to a setup function.

Handlebars.registerHelper('join', function (array: any[], separator: string) {
  if (!Array.isArray(array)) return ''
  return array.join(typeof separator === 'string' ? separator : ', ')
})

Handlebars.registerHelper('formatDate', function (dateString: string) {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
})

// Example: Safe access helper if needed
Handlebars.registerHelper('smartSpan', function (text: string, context: any) {
  if (!text) return ''

  // check for confidence and provenance in the context (this)
  const confidence = context?.confidence || 'high'
  const provenance = context?.provenance

  let classes = ''
  if (confidence === 'low') classes = 'uncertain-low'
  if (confidence === 'medium') classes = 'uncertain-medium'

  let attrs = ''
  if (provenance) {
    if (provenance.source) attrs += ` data-source="${provenance.source}"`
    if (provenance.references) attrs += ` data-refs="${provenance.references.join(',')}"`
    if (provenance.assumptions) attrs += ` data-assumptions="${encodeURIComponent(JSON.stringify(provenance.assumptions))}"`
  }

  if (!classes && !attrs) return text

  return new Handlebars.SafeString(`<span class="${classes}"${attrs}>${Handlebars.escapeExpression(text)}</span>`)
})

Handlebars.registerHelper('get', function (obj, prop) {
  return obj ? obj[prop] : undefined
})

export function compileTemplate(templateSource: string, context: any): string {
  try {
    const template = Handlebars.compile(templateSource)
    return template(context)
  } catch (err) {
    console.error('[Handlebars Engine] Compilation error:', err)
    return `Error generating content: ${(err as Error).message}`
  }
}
