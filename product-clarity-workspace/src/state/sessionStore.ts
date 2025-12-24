import { create } from 'zustand'

// --- Domain Types ---

export interface RawAnswer {
  value: any
  confidence: 'high' | 'medium' | 'low'
  timestamp: string // ISO string
}

export interface DerivedInferences {
  painPoints: any[]
  personas: any[]
  risks: any[]
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

interface SessionState {
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

  // Validation / Computed
  recomputeValidation: () => void

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
        derivedInferences: { painPoints: [], personas: [], risks: [], assumptions: [] },
        gaps: [],
        contradictions: [],
        completionBySection: {}
      })
      // Immediate save for new session creation is usually good UX
      get().saveActiveSession()
    },

    setCurrentQuestion: (questionId) => {
      // Navigating doesn't necessarily need to be persisted immediately or count as a modification
      // depending on requirement. The prompt says "mostly answers, etc."
      // But we persist 'currentQuestionId' so we should track it.
      set({
        currentQuestionId: questionId,
        // We can choose NOT to update lastModifiedAt if we consider nav transient, 
        // but robust session restoration usually wants to return to the same place.
        lastModifiedAt: new Date().toISOString()
      })
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

    setUserOverride: (sectionId, override) => {
      const now = new Date().toISOString()
      set((state) => ({
        userOverrides: { ...state.userOverrides, [sectionId]: override },
        timestamp: now,
        lastModifiedAt: now
      }))
    },

    recomputeValidation: () => {
      const state = get()
      const totalQuestions = 10;
      const answeredCount = Object.keys(state.rawAnswers).length;

      set({
        completionBySection: {
          'general': {
            completeness: Math.min(100, Math.round((answeredCount / totalQuestions) * 100)),
            clarity: 80
          }
        },
        // Recomputing validation updates derived state, so we mark modified
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
