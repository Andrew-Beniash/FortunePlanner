import type { SessionState } from '../state/sessionStore'
import { generateOutput } from './generation'
import { getDefaultOutputId } from '../config/outputs'

export interface PreviewSection {
  id: string
  title: string
  html: string  // Rendered content with potential overrides
  isEdited: boolean
}

export async function renderPreview(
  session: SessionState,
  outputId?: string
): Promise<PreviewSection[]> {
  try {
    // Use provided outputId or default
    const actualOutputId = outputId || getDefaultOutputId()

    // Generate with output config
    const { html } = await generateOutput(session, actualOutputId)

    // Check for overrides on the "full-doc" section (since we only have one right now)
    const sectionId = 'full-doc'
    const override = session.userOverrides[sectionId]

    return [
      {
        id: sectionId,
        title: 'Product Clarity Brief',
        html: override ? override.editedText : html,
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
        isEdited: false
      }
    ]
  }
}
