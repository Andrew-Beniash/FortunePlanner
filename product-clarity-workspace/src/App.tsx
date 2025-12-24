import { useEffect } from 'react'
import { useSessionStore } from './state/sessionStore'
import GuidedInterviewPanel from './components/interview/GuidedInterviewPanel'
import DocumentationPreviewPanel from './components/preview/DocumentationPreviewPanel'
import AppHeader from './components/layout/AppHeader'

function App() {
  const saveActiveSession = useSessionStore((state) => state.saveActiveSession)

  // Auto-save loop (10s) + save on exit
  useEffect(() => {
    const intervalId = setInterval(() => {
      saveActiveSession()
    }, 10_000)

    const handleUnload = () => {
      saveActiveSession()
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [saveActiveSession])

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* App Header */}
      <AppHeader />

      {/* Main Content: Two Panels */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Guided Interview */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full border-r border-slate-700 overflow-hidden">
          <GuidedInterviewPanel />
        </div>

        {/* Right: Documentation Preview */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-hidden">
          <DocumentationPreviewPanel />
        </div>
      </div>
    </div>
  )
}

export default App
