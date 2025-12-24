import { useSessionStore } from '../../state/sessionStore'

export default function AppHeader() {
  const sessionId = useSessionStore((state) => state.sessionId)
  const resetSessionToDefault = useSessionStore((state) => state.resetSessionToDefault)

  const handleReset = () => {
    const confirmed = window.confirm(
      'Reset to Default State?\n\n' +
      'This will:\n' +
      '• Clear all answers and edits\n' +
      '• Reset derived analysis\n' +
      '• Start a fresh session\n\n' +
      'This action cannot be undone.'
    )

    if (confirmed) {
      resetSessionToDefault()
    }
  }

  // Show shortened session ID (first 8 chars)
  const shortSessionId = sessionId.substring(0, 8)

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* App Title */}
        <h1 className="text-xl font-bold text-slate-100">
          Product Clarity Workspace
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Session Badge */}
          <div className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded border border-slate-600">
            Session: <span className="font-mono text-slate-100">{shortSessionId}</span>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded border border-slate-600 transition-colors"
            title="Reset to default state"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </header>
  )
}
