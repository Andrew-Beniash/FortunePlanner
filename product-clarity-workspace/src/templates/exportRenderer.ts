import type { SessionState } from '../state/sessionStore'
import { generateOutput } from './generation'

export async function renderExport(session: SessionState, format: 'md' | 'docx' | 'pdf'): Promise<string | Blob> {
  try {
    const { html } = await generateOutput(session, 'product-brief-v1')

    if (format === 'md') {
      // TODO: Use a specific Markdown template or convert HTML to MD
      return html // Returning HTML for now as placeholder
    }

    if (format === 'docx') {
      // TODO: Integration with 'docx' library to generate Blob
      return html
    }

    return html
  } catch (err) {
    console.error('[Export Renderer] Error:', err)
    throw err
  }
}
