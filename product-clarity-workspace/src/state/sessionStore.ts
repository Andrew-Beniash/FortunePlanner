import { create } from 'zustand'
import { validateSession } from '../engine/validation'

// --- Domain Types ---

export interface RawAnswer {
  value: any
  confidence: 'high' | 'medium' | 'low'
  timestamp: string // ISO string
}

import type { PainPoint, Persona, MarketSizing, ViabilityAssessment } from '../analyzers/types'

export interface DerivedInferences {
  painPoints: PainPoint[]
  personas: Persona[]
  marketSizing: MarketSizing[]
  viability: ViabilityAssessment[]
  risks: any[] // Legacy/Other risks
  assumptions: any[]
}

export interface Gap {
  questionId: string
  reason: string
  severity: 'low' | 'medium' | 'high'
}

export interface Contradiction {
  questions: string[]
  description: string
}

export interface UserOverride {
  originalText: string
  editedText: string
  timestamp: string
}

export interface SessionSummary {
  id: string
  createdAt: string
  updatedAt: string
  blueprintId: string
  completionStatus: number // 0-100 placeholder
}

// --- State Interface ---

// --- State Interface ---

export interface SessionState {
  // Core Session Data
  sessionId: string
  blueprintVersion: string
  timestamp: string // Last active timestamp

  // Persistence Tracking
  lastModifiedAt: string
  lastSavedAt: string | null

  // Guided Interview State
  currentQuestionId: string | null
  completedQuestionIds: string[]
  blueprintId: string | null

  // Answers & Data
  rawAnswers: Record<string, RawAnswer>
  userOverrides: Record<string, UserOverride>

  // Derived / Analysis Data
  derivedInferences: DerivedInferences
  gaps: Gap[]
  contradictions: Contradiction[]

  // UI Helpers
  completionBySection: Record<string, { completeness: number; clarity: number }>

  // Future-proofing
  sessionHistory: SessionSummary[]

  // --- Actions ---
  startNewSession: (blueprintId: string, blueprintVersion: string) => void
  setCurrentQuestion: (questionId: string) => void
  recordAnswer: (questionId: string, value: any, confidence?: 'high' | 'medium' | 'low') => void
  setDerivedInferences: (partial: Partial<DerivedInferences>) => void
  setGaps: (gaps: Gap[]) => void
  setContradictions: (contradictions: Contradiction[]) => void
  setUserOverride: (sectionId: string, override: UserOverride) => void
  resetUserOverride: (sectionId: string) => void

  // Validation / Computed
  recomputeValidation: () => void

  // Navigation Actions
  goToQuestion: (questionId: string) => void
  goToNextQuestion: (availableQuestions: string[]) => void
  goToPreviousQuestion: (availableQuestions: string[]) => void
  skipCurrentQuestion: (availableQuestions: string[]) => void

  // Persistence Actions
  saveActiveSession: () => void

  // History Actions (Definitions only for now)
  saveSessionToHistory: () => void
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

// --- Persistence Helpers ---

const STORAGE_KEY = 'pcw_active_session_v1'

// Define exactly what we persist to avoid saving internal state or functions
type PersistedSession = Pick<SessionState,
  | 'sessionId'
  | 'blueprintVersion'
  | 'timestamp'
  | 'currentQuestionId'
  | 'completedQuestionIds'
  | 'blueprintId'
  | 'rawAnswers'
  | 'userOverrides'
  | 'derivedInferences'
  | 'gaps'
  | 'contradictions'
  | 'completionBySection'
  | 'sessionHistory'
>

const loadFromStorage = (): Partial<SessionState> => {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Basic schema validation could go here
      if (parsed.sessionId && parsed.blueprintVersion) {
        return parsed
      }
    }
  } catch (e) {
    console.error('[PCW] Failed to load session from localStorage', e)
  }
  return {}
}

const persistSession = (state: SessionState) => {
  try {
    const toSave: PersistedSession = {
      sessionId: state.sessionId,
      blueprintVersion: state.blueprintVersion,
      timestamp: state.timestamp,
      currentQuestionId: state.currentQuestionId,
      completedQuestionIds: state.completedQuestionIds,
      blueprintId: state.blueprintId,
      rawAnswers: state.rawAnswers,
      userOverrides: state.userOverrides,
      derivedInferences: state.derivedInferences,
      gaps: state.gaps,
      contradictions: state.contradictions,
      completionBySection: state.completionBySection,
      sessionHistory: state.sessionHistory
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('[PCW] Failed to save session to localStorage', e)
    throw e // Re-throw to let the store handle it (e.g. logging)
  }
}

// --- Store Implementation ---

export const useSessionStore = create<SessionState>((set, get) => {

  // Initial Hydration
  const persistedState = loadFromStorage()
  const initialTimestamp = new Date().toISOString()

  const initialState = {
    sessionId: persistedState.sessionId || crypto.randomUUID(),
    blueprintVersion: persistedState.blueprintVersion || '1.0.0',
    timestamp: persistedState.timestamp || initialTimestamp,

    lastModifiedAt: initialTimestamp,
    lastSavedAt: persistedState.timestamp || null, // Assume persisted state was saved at its timestamp

    currentQuestionId: persistedState.currentQuestionId || null,
    completedQuestionIds: persistedState.completedQuestionIds || [],
    blueprintId: persistedState.blueprintId || null,

    rawAnswers: persistedState.rawAnswers || {},
    userOverrides: persistedState.userOverrides || {},

    derivedInferences: persistedState.derivedInferences || {
      painPoints: [],
      personas: [],
      marketSizing: [],
      viability: [],
      risks: [],
      assumptions: []
    },
    gaps: persistedState.gaps || [],
    contradictions: persistedState.contradictions || [],

    completionBySection: persistedState.completionBySection || {},
    sessionHistory: persistedState.sessionHistory || []
  }

  return {
    ...initialState,

    startNewSession: (blueprintId, blueprintVersion) => {
      const now = new Date().toISOString()
      set({
        sessionId: crypto.randomUUID(),
        blueprintId,
        blueprintVersion,
        timestamp: now,
        lastModifiedAt: now, // Mark as modified
        currentQuestionId: null,
        completedQuestionIds: [],
        rawAnswers: {},
        userOverrides: {},
        derivedInferences: {
          painPoints: [],
          personas: [],
          marketSizing: [],
          viability: [],
          risks: [],
          assumptions: []
        },
        gaps: [],
        contradictions: [],
        completionBySection: {}
      })
      // Immediate save for new session creation is usually good UX
      get().saveActiveSession()
    },

    setCurrentQuestion: (questionId) => {
      set({
        currentQuestionId: questionId,
        lastModifiedAt: new Date().toISOString()
      })
    },

    goToQuestion: (questionId) => {
      get().setCurrentQuestion(questionId)
    },

    goToNextQuestion: (availableQuestions) => {
      const state = get()
      const currentId = state.currentQuestionId
      if (!currentId) return

      const idx = availableQuestions.indexOf(currentId)
      if (idx !== -1 && idx < availableQuestions.length - 1) {
        get().setCurrentQuestion(availableQuestions[idx + 1])
      }
    },

    goToPreviousQuestion: (availableQuestions) => {
      const state = get()
      const currentId = state.currentQuestionId
      if (!currentId) return

      const idx = availableQuestions.indexOf(currentId)
      if (idx !== -1 && idx > 0) {
        get().setCurrentQuestion(availableQuestions[idx - 1])
      }
    },

    skipCurrentQuestion: (availableQuestions) => {
      // For now, skipping just moves next. 
      // Future: add to skippedIds list.
      get().goToNextQuestion(availableQuestions)
    },

    recordAnswer: (questionId, value, confidence = 'high') => {
      const now = new Date().toISOString()
      set((state) => {
        const newAnswers = {
          ...state.rawAnswers,
          [questionId]: { value, confidence, timestamp: now }
        }

        const completed = new Set(state.completedQuestionIds)
        if (value) {
          completed.add(questionId)
        }

        return {
          rawAnswers: newAnswers,
          completedQuestionIds: Array.from(completed),
          timestamp: now,
          lastModifiedAt: now
        }
      })
      get().recomputeValidation()
    },

    setDerivedInferences: (partial) => {
      const now = new Date().toISOString()
      set((state) => ({
        derivedInferences: { ...state.derivedInferences, ...partial },
        timestamp: now,
        lastModifiedAt: now
      }))
    },

    setGaps: (gaps) => {
      const now = new Date().toISOString()
      set({ gaps, timestamp: now, lastModifiedAt: now })
    },

    setContradictions: (contradictions) => {
      const now = new Date().toISOString()
      set({ contradictions, timestamp: now, lastModifiedAt: now })
    },

    // --- Override Actions ---
    // "User edit wins" policy:
    // Any section with an entry in userOverrides will serve the editedText 
    // instead of the auto-generated template content.
    // Regeneration (via recomputeValidation/analyzers) only updates the derivedInferences,
    // it does NOT touch userOverrides. This ensures manual edits persist until explicitly reverted.
    setUserOverride: (sectionId, override) => {
      const now = new Date().toISOString()
      set((state) => ({
        userOverrides: { ...state.userOverrides, [sectionId]: override },
        timestamp: now,
        lastModifiedAt: now
      }))
    },

    resetUserOverride: (sectionId) => {
      const now = new Date().toISOString()
      set((state) => {
        const newOverrides = { ...state.userOverrides }
        delete newOverrides[sectionId]
        return {
          userOverrides: newOverrides,
          timestamp: now,
          lastModifiedAt: now
        }
      })
    },

    recomputeValidation: async () => {
      const state = get()
      const { gaps, isValid } = await validateSession(state)

      // Calculate simple completion based on gaps vs total fields
      // This is a simplified heuristic; usually we want explicit questions count
      // But validateSession already iterates active questions.
      // Ideally validateSession returns completeness stats too. 
      // For now, we update Gaps.

      const totalQuestions = 5 // TODO: dynamic from blueprint
      const validAnswers = totalQuestions - gaps.length // Rough proxy

      set({
        gaps,
        completionBySection: {
          'general': {
            completeness: Math.max(0, Math.min(100, Math.round((validAnswers / totalQuestions) * 100))),
            clarity: isValid ? 90 : 50
          }
        },
        lastModifiedAt: new Date().toISOString()
      })
    },

    saveActiveSession: () => {
      const state = get()

      // Optimization: No need to save if nothing changed since last save
      if (state.lastSavedAt && state.lastModifiedAt <= state.lastSavedAt) {
        return
      }

      try {
        persistSession(state)
        set({ lastSavedAt: state.lastModifiedAt })
      } catch (e) {
        // Already logged in persistSession
        // Potential future: set an error flag in state to show UI warning
      }
    },

    saveSessionToHistory: () => {
      console.log('saveSessionToHistory not implemented fully')
    },

    loadSession: (sessionId) => {
      console.log('loadSession not implemented fully', sessionId)
    },

    deleteSession: (sessionId) => {
      console.log('deleteSession not implemented fully', sessionId)
    }
  }
})
