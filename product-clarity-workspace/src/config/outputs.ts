import type { OutputFileConfig } from './types'

export type { OutputFileConfig }

let cachedOutputs: OutputFileConfig[] | null = null

export async function loadOutputs(): Promise<OutputFileConfig[]> {
  try {
    if (cachedOutputs) return cachedOutputs

    const response = await fetch('/config/outputs.json')
    if (!response.ok) throw new Error('Failed to load outputs configuration')

    const outputs = await response.json()
    if (!Array.isArray(outputs)) throw new Error('Invalid outputs configuration')

    cachedOutputs = outputs as OutputFileConfig[]
    return cachedOutputs
  } catch (err) {
    console.error('[Outputs Loader] Error:', err)
    return []
  }
}

export async function getOutputById(id: string): Promise<OutputFileConfig | undefined> {
  const outputs = await loadOutputs()
  return outputs.find(output => output.id === id)
}

export function getDefaultOutputId(): string {
  return 'product-brief'
}
