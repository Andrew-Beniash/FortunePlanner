import { useSessionStore } from '../state/sessionStore'

export default function GuidedInterviewPanel() {
  const currentQuestionId = useSessionStore((state) => state.currentQuestionId)
  const setCurrentQuestion = useSessionStore((state) => state.setCurrentQuestion)
  const recordAnswer = useSessionStore((state) => state.recordAnswer)
  const rawAnswers = useSessionStore((state) => state.rawAnswers)

  // Debug / Test Controls
  const handleSimulateAnswer = () => {
    const qId = currentQuestionId || 'q1'
    recordAnswer(qId, `Answer for ${qId} at ${new Date().toLocaleTimeString()}`, 'high')
  }

  const handleNextQuestion = () => {
    const nextId = currentQuestionId === 'q1' ? 'q2' : 'q1'
    setCurrentQuestion(nextId)
  }

  return (
    <div className="p-4 border-r border-slate-700 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-slate-100">Guided Interview</h2>

      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="p-3 bg-slate-800 rounded border border-slate-600">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
            Current Question ID
          </label>
          <div className="text-slate-100 font-mono">
            {currentQuestionId || 'No active question'}
          </div>
        </div>

        <div className="p-3 bg-slate-800 rounded border border-slate-600">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
            Current Answer
          </label>
          <div className="text-sm text-slate-300">
            {currentQuestionId && rawAnswers[currentQuestionId]
              ? JSON.stringify(rawAnswers[currentQuestionId].value)
              : '(Not answered)'}
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <button
            onClick={handleSimulateAnswer}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
          >
            Record Answer
          </button>
          <button
            onClick={handleNextQuestion}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition-colors"
          >
            Next Question / Toggle
          </button>
        </div>

        {/* Debug View */}
        <div className="mt-8 pt-4 border-t border-slate-700">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Store Debug</h3>
          <pre className="text-[10px] text-slate-500 overflow-x-auto bg-slate-900/50 p-2 rounded">
            {JSON.stringify(rawAnswers, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
