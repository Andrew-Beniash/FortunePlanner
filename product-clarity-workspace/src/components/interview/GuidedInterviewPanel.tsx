import { useEffect, useState, useMemo } from 'react'
import { useSessionStore } from '../../state/sessionStore'
import { loadQuestions } from '../../config/questions'
import { loadBlueprints } from '../../config/blueprints'
import { validateAnswer } from '../../engine/validation'
import { isQuestionVisible } from '../../engine/visibility'
import type { Question, Blueprint } from '../../config/types'

export default function GuidedInterviewPanel() {
  const [questions, setQuestions] = useState<Record<string, Question>>({})
  const [activeBlueprint, setActiveBlueprint] = useState<Blueprint | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Store Selectors
  const currentQuestionId = useSessionStore((state) => state.currentQuestionId)
  const rawAnswers = useSessionStore((state) => state.rawAnswers)
  const recordAnswer = useSessionStore((state) => state.recordAnswer)
  const goToNextQuestion = useSessionStore((state) => state.goToNextQuestion)
  const goToPreviousQuestion = useSessionStore((state) => state.goToPreviousQuestion)
  const skipCurrentQuestion = useSessionStore((state) => state.skipCurrentQuestion)
  const setCurrentQuestion = useSessionStore((state) => state.setCurrentQuestion)
  const completeInterview = useSessionStore((state) => state.completeInterview)
  const isInterviewComplete = useSessionStore((state) => state.isInterviewComplete)
  const runFullAnalysis = useSessionStore((state) => state.runFullAnalysis)
  const isAnalyzing = useSessionStore((state) => state.isAnalyzing)

  // Load Config on Mount
  useEffect(() => {
    async function init() {
      try {
        const [qs, bps] = await Promise.all([loadQuestions(), loadBlueprints()])
        const qMap = qs.reduce((acc, q) => ({ ...acc, [q.id]: q }), {} as Record<string, Question>)
        setQuestions(qMap)
        setActiveBlueprint(bps[0]) // Default to first blueprint for now
      } catch (err) {
        console.error('Failed to load interview config', err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // Flatten Sections to Linear Sequence & Filter by Visibility
  const questionSequence = useMemo(() => {
    if (!activeBlueprint) return []
    const allIds = activeBlueprint.sections.flatMap(s => s.questionIds)
    return allIds.filter(id => {
      const q = questions[id]
      return q && isQuestionVisible(q, rawAnswers)
    })
  }, [activeBlueprint, questions, rawAnswers])

  // Initialize first question if needed
  useEffect(() => {
    if (!isLoading && !currentQuestionId && questionSequence.length > 0) {
      setCurrentQuestion(questionSequence[0])
    }
  }, [isLoading, currentQuestionId, questionSequence, setCurrentQuestion])

  // Current State Derivation
  const currentIndex = currentQuestionId ? questionSequence.indexOf(currentQuestionId) : -1
  const currentQuestion = currentQuestionId ? questions[currentQuestionId] : null
  const currentAnswer = currentQuestionId ? rawAnswers[currentQuestionId]?.value : ''
  const currentRawAnswer = currentQuestionId ? rawAnswers[currentQuestionId] : undefined

  // Validation State
  const validationErrors = useMemo(() => {
    if (!currentQuestion) return []
    return validateAnswer(currentQuestion, currentRawAnswer)
  }, [currentQuestion, currentRawAnswer])

  const isValid = validationErrors.length === 0
  const isRequired = currentQuestion?.validationRules?.required

  // Progress Calculation
  const totalQuestions = questionSequence.length
  const answeredCount = questionSequence.filter(id => rawAnswers[id]?.value).length
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  if (isLoading) return <div className="p-8 text-slate-400">Loading interview...</div>
  if (!activeBlueprint || !currentQuestion) return <div className="p-8 text-slate-400">No active question.</div>

  const handleNext = async () => {

    if (isRequired && !isValid) {
      alert('This question is required. Please provide a valid answer.')
      return
    }

    if (isLast) {
      // Complete the interview first
      completeInterview()
      // Then run full analysis
      await runFullAnalysis()
    } else {
      goToNextQuestion(questionSequence)
    }
  }
  const handleBack = () => goToPreviousQuestion(questionSequence)
  const handleSkip = () => skipCurrentQuestion(questionSequence)

  if (isInterviewComplete) {
    return (
      <div className="flex flex-col h-full bg-slate-900 p-8">
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-8 text-center max-w-2xl mx-auto mt-20">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-green-300 mb-4">Interview Complete!</h2>
          <p className="text-slate-300 mb-6">
            Your answers have been saved. Review the live documentation preview on the right and export when ready.
          </p>
          <div className="text-sm text-slate-400">
            You can now close this panel or start a new session.
          </div>
        </div>
      </div>
    )
  }

  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= questionSequence.length - 1

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
      {/* Header & Progress */}
      <div className="p-6 border-b border-slate-700 bg-slate-800/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-100">{activeBlueprint.name}</h2>
          <span className="text-xs font-mono text-slate-400">
            {answeredCount}/{totalQuestions} Answered
          </span>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="max-w-2xl mx-auto space-y-8">

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="inline-block px-2 py-1 rounded bg-slate-800 text-xs font-medium text-blue-400 border border-slate-700">
                {currentQuestion.category}
              </span>
              {isRequired && <span className="text-xs text-red-400 font-medium">Required</span>}
            </div>
            <h1 className="text-2xl font-bold text-slate-100 leading-tight">
              {currentQuestion.text}
            </h1>
            {currentQuestion.helpText && (
              <p className="text-slate-400 text-sm leading-relaxed">
                {currentQuestion.helpText}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {/* Input Renderer */}
            {currentQuestion.inputType === 'textarea' ? (
              <textarea
                className={`w-full h-40 bg-slate-800 border rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600 ${validationErrors.length > 0 && currentAnswer ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'
                  }`}
                placeholder="Type your answer here..."
                value={currentAnswer || ''}
                onChange={(e) => recordAnswer(currentQuestion.id, e.target.value)}
              />
            ) : currentQuestion.inputType === 'select' ? (
              <select
                className={`w-full bg-slate-800 border rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 ${validationErrors.length > 0 && currentAnswer ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'
                  }`}
                value={currentAnswer || ''}
                onChange={(e) => recordAnswer(currentQuestion.id, e.target.value)}
              >
                <option value="" disabled>Select an option...</option>
                {currentQuestion.validationRules?.allowedValues?.map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            ) : (
              <input
                type={currentQuestion.inputType === 'number' ? 'number' : 'text'}
                className={`w-full bg-slate-800 border rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600 ${validationErrors.length > 0 && currentAnswer ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'
                  }`}
                placeholder="Type your answer here..."
                value={currentAnswer || ''}
                onChange={(e) => recordAnswer(currentQuestion.id, e.target.value)}
                min={currentQuestion.validationRules?.min}
                max={currentQuestion.validationRules?.max}
              />
            )}

            {/* Validation Feedback */}
            {validationErrors.length > 0 && currentAnswer && (
              <div className="space-y-1">
                {validationErrors.map((err, i) => (
                  <div key={i} className="text-sm text-red-400 flex items-center">
                    <span className="mr-1">⚠</span> {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Navigation Footer */}
      <div className="p-6 border-t border-slate-700 bg-slate-800/50">
        {/* Analyzing Indicator */}
        {isAnalyzing && (
          <div className="mb-4 flex items-center justify-center space-x-2 text-blue-400">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Analyzing responses...</span>
          </div>
        )}

        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={isFirst}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isFirst
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-300 hover:bg-slate-700'
              }`}
          >
            ← Back
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={isRequired && !isValid}
              className={`px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all transform active:scale-95 ${isRequired && !isValid
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20'
                }`}
            >
              {isLast ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
