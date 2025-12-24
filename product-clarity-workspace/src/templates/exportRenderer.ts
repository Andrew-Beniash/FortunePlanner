import type { SessionState } from '../state/sessionStore'
import { generateOutput } from './generation'

export async function renderExport(session: SessionState, format: 'md' | 'docx' | 'pdf'): Promise<string | Blob> {
  try {
    const { html } = await generateOutput(session, 'product-brief-v1')

    // Check for overrides on the full doc
    const sectionId = 'full-doc'
    const override = session.userOverrides[sectionId]
    const effectiveHtml = override ? override.editedText : html

    if (format === 'md') {
      // TODO: Use a specific Markdown template or convert HTML to MD
      return effectiveHtml // Returning HTML for now as placeholder
    }

    if (format === 'docx') {
      // TODO: Integration with 'docx' library to generate Blob
      return effectiveHtml
    }

    return effectiveHtml
  } catch (err) {
    console.error('[Export Renderer] Error:', err)
    throw err
  }
}
