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

interface SessionState {
  // Core Session Data
  sessionId: string
  blueprintVersion: string
  timestamp: string // Last active timestamp

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

  // History Actions (Definitions only for now)
  saveSessionToHistory: () => void
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

// --- Persistence Helpers ---

const STORAGE_KEY = 'pcw_session_v1'

const loadFromStorage = (): Partial<SessionState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load session from localStorage', e)
  }
  return {}
}

const saveToStorage = (state: SessionState) => {
  try {
    // Pick only serializable and necessary fields
    const toSave: Partial<SessionState> = {
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
    console.error('Failed to save session to localStorage', e)
  }
}

// --- Store Implementation ---

export const useSessionStore = create<SessionState>((set, get) => {

  // Initial Hydration
  const persistedState = loadFromStorage()

  const initialState = {
    sessionId: persistedState.sessionId || crypto.randomUUID(),
    blueprintVersion: persistedState.blueprintVersion || '1.0.0',
    timestamp: persistedState.timestamp || new Date().toISOString(),

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
      set({
        sessionId: crypto.randomUUID(),
        blueprintId,
        blueprintVersion,
        timestamp: new Date().toISOString(),
        currentQuestionId: null,
        completedQuestionIds: [],
        rawAnswers: {},
        userOverrides: {},
        derivedInferences: { painPoints: [], personas: [], risks: [], assumptions: [] },
        gaps: [],
        contradictions: [],
        completionBySection: {}
      })
      saveToStorage(get())
    },

    setCurrentQuestion: (questionId) => {
      set({ currentQuestionId: questionId })
      saveToStorage(get())
    },

    recordAnswer: (questionId, value, confidence = 'high') => {
      const timestamp = new Date().toISOString()
      set((state) => {
        const newAnswers = {
          ...state.rawAnswers,
          [questionId]: { value, confidence, timestamp }
        }

        // Simple logic: if answered, mark as completed
        const completed = new Set(state.completedQuestionIds)
        if (value) {
          completed.add(questionId)
        }

        return {
          rawAnswers: newAnswers,
          completedQuestionIds: Array.from(completed),
          timestamp
        }
      })
      get().recomputeValidation()
      saveToStorage(get())
    },

    setDerivedInferences: (partial) => {
      set((state) => ({
        derivedInferences: { ...state.derivedInferences, ...partial },
        timestamp: new Date().toISOString()
      }))
      saveToStorage(get())
    },

    setGaps: (gaps) => {
      set({ gaps, timestamp: new Date().toISOString() })
      saveToStorage(get())
    },

    setContradictions: (contradictions) => {
      set({ contradictions, timestamp: new Date().toISOString() })
      saveToStorage(get())
    },

    setUserOverride: (sectionId, override) => {
      set((state) => ({
        userOverrides: { ...state.userOverrides, [sectionId]: override },
        timestamp: new Date().toISOString()
      }))
      saveToStorage(get())
    },

    recomputeValidation: () => {
      // Placeholder for validation logic
      // In a real app, this might check against the blueprint rules
      const state = get()
      const totalQuestions = 10; // Mock total
      const answeredCount = Object.keys(state.rawAnswers).length;

      // Mock update of completion stats
      // Assume a single section 'general' for now
      set({
        completionBySection: {
          'general': {
            completeness: Math.min(100, Math.round((answeredCount / totalQuestions) * 100)),
            clarity: 80 // Hardcoded placeholder
          }
        }
      })
    },

    saveSessionToHistory: () => {
      // Placeholder
      console.log('saveSessionToHistory not implemented fully')
    },

    loadSession: (sessionId) => {
      // Placeholder - would load from a separate history store or DB
      console.log('loadSession not implemented fully', sessionId)
    },

    deleteSession: (sessionId) => {
      // Placeholder
      console.log('deleteSession not implemented fully', sessionId)
    }
  }
})
