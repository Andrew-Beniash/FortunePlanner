import { useSessionStore } from './state/sessionStore'
import GuidedInterviewPanel from './components/GuidedInterviewPanel'
import DocumentationPreviewPanel from './components/DocumentationPreviewPanel'

function App() {
  const sessionId = useSessionStore((state) => state.sessionId)

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Proof of state integration - normally this might be in a header or debug panel */}
      <div className="fixed top-2 right-2 z-50 px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-[10px] text-slate-500 pointer-events-none">
        Session: {sessionId?.slice(0, 8)}...
      </div>

      <div className="w-full md:w-1/2 h-[50vh] md:h-full border-b md:border-b-0 md:border-r border-slate-700">
        <GuidedInterviewPanel />
      </div>
      <div className="w-full md:w-1/2 h-[50vh] md:h-full">
        <DocumentationPreviewPanel />
      </div>
    </div>
  )
}

export default App
