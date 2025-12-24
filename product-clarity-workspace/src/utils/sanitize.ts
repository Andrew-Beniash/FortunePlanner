// HTML sanitization utility to prevent XSS attacks

const ALLOWED_TAGS = new Set([
  'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u',
  'br', 'hr', 'a', 'blockquote', 'code', 'pre'
])

const ALLOWED_ATTRIBUTES = new Set([
  'class', 'id', 'style', 'href', 'title',
  // Provenance attributes
  'data-source', 'data-refs', 'data-assumptions'
])

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,  // Event handlers like onclick=
  /on\w+\s*=\s*[^\s>]*/gi,          // Event handlers without quotes
  /javascript:/gi,
  /data:text\/html/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi
]

export function sanitizeHtml(html: string): string {
  if (!html) return ''

  let sanitized = html

  // Remove dangerous patterns first
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Parse and rebuild HTML with allowed tags/attributes only
  // This is a basic implementation; for production, consider using DOMPurify
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = sanitized

  const cleanHtml = sanitizeNode(tempDiv)
  return cleanHtml
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent || '')
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element
    const tagName = element.tagName.toLowerCase()

    // Skip disallowed tags but keep their text content
    if (!ALLOWED_TAGS.has(tagName)) {
      return Array.from(element.childNodes)
        .map(child => sanitizeNode(child))
        .join('')
    }

    // Build clean element
    let result = `<${tagName}`

    // Add allowed attributes
    for (const attr of Array.from(element.attributes)) {
      if (ALLOWED_ATTRIBUTES.has(attr.name)) {
        // Extra check for href to prevent javascript: URLs
        if (attr.name === 'href' && attr.value.toLowerCase().includes('javascript:')) {
          continue
        }
        result += ` ${attr.name}="${escapeHtml(attr.value)}"`
      }
    }

    result += '>'

    // Self-closing tags
    if (['br', 'hr'].includes(tagName)) {
      return result.replace('>', ' />')
    }

    // Add children
    result += Array.from(element.childNodes)
      .map(child => sanitizeNode(child))
      .join('')

    result += `</${tagName}>`
    return result
  }

  return ''
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Sanitize user input before it goes into templates
export function sanitizeUserInput(input: string): string {
  if (!input) return ''
  return escapeHtml(input)
}
