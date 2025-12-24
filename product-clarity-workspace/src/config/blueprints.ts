import type { Blueprint } from './types'

export async function loadBlueprints(): Promise<Blueprint[]> {
  try {
    const response = await fetch('/config/blueprints.json')
    if (!response.ok) {
      throw new Error(`Failed to load blueprints: ${response.statusText}`)
    }
    const blueprints = await response.json()

    if (!Array.isArray(blueprints)) {
      throw new Error('Blueprints config must be an array')
    }

    return blueprints as Blueprint[]
  } catch (err) {
    console.error('[Product Clarity] Failed to load blueprints config:', err)
    return []
  }
}
