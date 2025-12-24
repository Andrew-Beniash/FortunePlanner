import type { SessionState } from '../state/sessionStore'
import { generateOutput } from './generation'

export async function renderExport(session: SessionState, format: 'md' | 'docx' | 'pdf'): Promise<string | Blob> {
  try {
    const { html, metadata } = await generateOutput(session, 'product-brief-v1')

    // Check for overrides on the full doc
    const sectionId = 'full-doc'
    const override = session.userOverrides[sectionId]
    const effectiveHtml = override ? override.editedText : html

    if (format === 'md') {
      return convertHtmlToMarkdown(effectiveHtml, metadata)
    }

    if (format === 'docx') {
      // TODO: Use 'docx' library. For v1, returning HTML as placeholder until docx builder is implemented
      // Ideally we parse the HTML into IParagraph, TextRun etc.
      return effectiveHtml
    }

    if (format === 'pdf') {
      // PDF generation happens client-side usually with html2pdf
      // We return the HTML, and the UI component handles the lib call
      return effectiveHtml
    }

    return effectiveHtml
  } catch (err) {
    console.error('[Export Renderer] Error:', err)
    throw err
  }
}

function convertHtmlToMarkdown(html: string, metadata: any): string {
  // Simple naive converter for v1
  let md = html
    .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<ul>/g, '')
    .replace(/<\/ul>/g, '')
    .replace(/<li>(.*?)<\/li>/g, '- $1\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<div.*?>/g, '')
    .replace(/<\/div>/g, '\n')
    .replace(/<SECTION.*?>/gi, '') // varying casing
    .replace(/<\/SECTION>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '') // Strip remaining tags

  // Prepend Metadata
  const frontmatter = `---
sessionId: ${metadata.sessionId}
blueprintId: ${metadata.blueprintId}
timestamp: ${metadata.timestamp}
completion: ${metadata.completionPercentage}%
---\n\n`

  return frontmatter + md.trim()
}
