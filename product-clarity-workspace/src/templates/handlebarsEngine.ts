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
