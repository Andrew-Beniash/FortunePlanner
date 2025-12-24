import type { SessionState } from '../state/sessionStore'
import { generateOutput } from './generation'

export interface PreviewSection {
  id: string
  title: string
  html: string
  status: 'complete' | 'incomplete' | 'needsReview'
  isEdited: boolean
}

export async function renderPreview(session: SessionState): Promise<PreviewSection[]> {
  try {
    // Generate full document HTML
    const { html } = await generateOutput(session, 'product-brief-v1')

    // Check for overrides on the "full-doc" section (since we only have one right now)
    const sectionId = 'full-doc'
    const override = session.userOverrides[sectionId]

    return [
      {
        id: sectionId,
        title: 'Product Clarity Brief',
        html: override ? override.editedText : html,
        status: 'complete', // TODO: derive from session.completionBySection
        isEdited: !!override
      }
    ]
  } catch (err) {
    console.error('[Preview Renderer] Error:', err)
    return [
      {
        id: 'error',
        title: 'Error',
        html: `<div class="error">Failed to generate preview: ${(err as Error).message}</div>`,
        status: 'incomplete',
        isEdited: false
      }
    ]
  }
}
