import { create } from 'zustand'

interface SessionState {
  sessionId: string | null
  // Placeholder for future state
}

export const useSessionStore = create<SessionState>(() => ({
  sessionId: 'demo-session-id', // Placeholder
}))
