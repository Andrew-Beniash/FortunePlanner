import type { SessionState } from '../state/sessionStore'
import { generateOutput } from './generation'

export interface PreviewSection {
  id: string
  title: string
  html: string
  status: 'complete' | 'incomplete'
}

export async function renderPreview(session: SessionState): Promise<PreviewSection[]> {
  try {
    // Generate full document HTML
    const { html } = await generateOutput(session, 'product-brief-v1')

    // For now, return the whole doc as one section
    // Future: Parse HTML or use distinct templates per section to split them
    return [
      {
        id: 'full-doc',
        title: 'Full Product Brief',
        html: html,
        status: 'complete' // Logic for status can be added later
      }
    ]
  } catch (err) {
    console.error('[Preview Renderer] Error:', err)
    return [
      {
        id: 'error',
        title: 'Error',
        html: `<div class="error">Failed to generate preview: ${(err as Error).message}</div>`,
        status: 'incomplete'
      }
    ]
  }
}
