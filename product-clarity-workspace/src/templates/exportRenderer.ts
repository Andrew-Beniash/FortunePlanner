import type { SessionState } from '../state/sessionStore'
import { generateOutput, type GeneratedOutput } from './generation'
import { startTimer, endTimer } from '../utils/perfMonitor'
import { getOutputById, getDefaultOutputId } from '../config/outputs'

// Minimal Markdown conversion (placeholder)
function convertHtmlToMarkdown(html: string, metadata: any): string {
  const frontmatter = `---
title: ${metadata.documentTitle || 'Product Brief'}
sessionId: ${metadata.sessionId}
generated: ${metadata.exportedAt}
outputLanguage: ${metadata.outputLanguage}
---

`
  // Very basic HTML to Markdown (real implementation would use a library like turndown)
  let markdown = html
    .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
    .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<li>(.*?)<\/li>/g, '- $1\n')
    .replace(/<[^>]+>/g, '') // Strip remaining tags

  return frontmatter + markdown
}

export async function renderExport(
  session: SessionState,
  format: 'md' | 'docx' | 'pdf',
  outputId?: string
): Promise<string | Blob> {
  const actualOutputId = outputId || getDefaultOutputId()
  startTimer(`export-${format}`)

  try {
    // Load output config and validate format
    const outputConfig = await getOutputById(actualOutputId)
    if (!outputConfig) {
      throw new Error(`Output configuration not found: ${actualOutputId}`)
    }

    if (!outputConfig.formats.includes(format)) {
      throw new Error(`Format '${format}' not supported for output '${outputConfig.label}'`)
    }

    // Generate base content with metadata
    const { html, metadata } = await generateOutput(session, outputConfig)

    // Apply user overrides (prioritize edited content)
    const override = session.userOverrides['full-document']
    const effectiveHtml = override ? override.editedText : html

    let result: string | Blob

    if (format === 'md') {
      result = convertHtmlToMarkdown(effectiveHtml, metadata)
    } else if (format === 'docx') {
      // TODO: Implement DOCX generation using library
      result = effectiveHtml // Placeholder
    } else if (format === 'pdf') {
      // TODO: Implement PDF generation using library
      result = effectiveHtml // Placeholder
    } else {
      result = effectiveHtml
    }

    endTimer(`export-${format}`)
    return result
  } catch (err) {
    endTimer(`export-${format}`)
    console.error('[Export Renderer] Error:', err)
    throw err
  }
}
