import { useEffect, useState, useMemo } from 'react'
import { useSessionStore } from '../../state/sessionStore'
import { loadQuestions } from '../../config/questions'
import { loadBlueprints } from '../../config/blueprints'
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

  // Flatten Sections to Linear Sequence
  const questionSequence = useMemo(() => {
    if (!activeBlueprint) return []
    return activeBlueprint.sections.flatMap(s => s.questionIds)
  }, [activeBlueprint])

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

  // Progress Calculation
  const totalQuestions = questionSequence.length
  const answeredCount = questionSequence.filter(id => rawAnswers[id]?.value).length
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  if (isLoading) return <div className="p-8 text-slate-400">Loading interview...</div>
  if (!activeBlueprint || !currentQuestion) return <div className="p-8 text-slate-400">No active question.</div>

  const handleNext = () => goToNextQuestion(questionSequence)
  const handleBack = () => goToPreviousQuestion(questionSequence)
  const handleSkip = () => skipCurrentQuestion(questionSequence)

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
            <span className="inline-block px-2 py-1 rounded bg-slate-800 text-xs font-medium text-blue-400 border border-slate-700">
              {currentQuestion.category}
            </span>
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
                className="w-full h-40 bg-slate-800 border-slate-600 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                placeholder="Type your answer here..."
                value={currentAnswer || ''}
                onChange={(e) => recordAnswer(currentQuestion.id, e.target.value)}
              />
            ) : currentQuestion.inputType === 'select' ? (
              <select
                className="w-full bg-slate-800 border-slate-600 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500"
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
                type="text"
                className="w-full bg-slate-800 border-slate-600 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
                placeholder="Type your answer here..."
                value={currentAnswer || ''}
                onChange={(e) => recordAnswer(currentQuestion.id, e.target.value)}
              />
            )}
          </div>

        </div>
      </div>

      {/* Navigation Footer */}
      <div className="p-6 border-t border-slate-700 bg-slate-800/50">
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
              className="px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all transform active:scale-95"
            >
              {isLast ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
