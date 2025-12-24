import { useSessionStore } from './state/sessionStore'
import GuidedInterviewPanel from './components/GuidedInterviewPanel'
import DocumentationPreviewPanel from './components/DocumentationPreviewPanel'

function App() {
  const sessionId = useSessionStore((state) => state.sessionId)

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Proof of state integration - normally this might be in a header or debug panel */}
      <div className="fixed top-0 right-0 p-2 text-xs text-slate-600 pointer-events-none">
        Session: {sessionId}
      </div>

      <div className="w-full md:w-1/2 h-[50vh] md:h-screen border-b md:border-b-0 md:border-r border-slate-700 overflow-y-auto">
        <GuidedInterviewPanel />
      </div>
      <div className="w-full md:w-1/2 h-[50vh] md:h-screen overflow-y-auto">
        <DocumentationPreviewPanel />
      </div>
    </div>
  )
}

export default App
