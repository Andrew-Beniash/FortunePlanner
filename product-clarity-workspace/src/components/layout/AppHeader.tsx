import { useState } from 'react'
import { useSessionStore } from '../../state/sessionStore'
import ConfigModal from './ConfigModal'

export default function AppHeader() {
  const sessionId = useSessionStore((state) => state.sessionId)
  const resetSessionToDefault = useSessionStore((state) => state.resetSessionToDefault)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

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
    <>
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

            {/* Config Button */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded border border-slate-600 transition-colors"
              title="Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

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

      {/* Config Modal */}
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  )
}
