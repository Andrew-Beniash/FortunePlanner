import type { Blueprint } from './types'

const MOCK_BLUEPRINT: Blueprint = {
  id: 'bp_standard_v1',
  version: '1.0.0',
  name: 'Standard Product Clarity',
  description: 'The default guided interview flow.',
  sections: [
    { id: 'problem', title: 'Problem Space', questionIds: ['q1'] },
    { id: 'persona', title: 'Target Audience', questionIds: ['q2'] },
    { id: 'strategy', title: 'Strategic Fit', questionIds: ['q3', 'q4', 'q5'] }
  ]
}

export async function loadBlueprints(): Promise<Blueprint[]> {
  return Promise.resolve([MOCK_BLUEPRINT])
}
