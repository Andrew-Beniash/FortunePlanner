import { useState, useEffect } from 'react'
import { useSessionStore } from '../../state/sessionStore'
import { renderPreview, type PreviewSection } from '../../templates/previewRenderer'
import { renderExport } from '../../templates/exportRenderer'

export default function DocumentationPreviewPanel() {
  // Global State
  const derivedInferences = useSessionStore((state) => state.derivedInferences)
  const gaps = useSessionStore((state) => state.gaps)
  // const completionBySection = useSessionStore((state) => state.completionBySection)
  const sessionState = useSessionStore((state) => state) // Access full state for generation

  const setUserOverride = useSessionStore((state) => state.setUserOverride)
  const resetUserOverride = useSessionStore((state) => state.resetUserOverride)

  // Local Component State
  const [sections, setSections] = useState<PreviewSection[]>([])
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editBuffer, setEditBuffer] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Trigger Generation on relevant state changes
  useEffect(() => {
    let mounted = true

    async function updatePreview() {
      setIsGenerating(true)
      const newSections = await renderPreview(sessionState)
      if (mounted) {
        setSections(newSections)
        setIsGenerating(false)
      }
    }

    updatePreview()

    return () => { mounted = false }
  }, [
    // Dependencies that should trigger re-render
    sessionState.rawAnswers,
    sessionState.userOverrides,
    sessionState.derivedInferences
  ])

  // --- Handlers ---

  const handleStartEdit = (section: PreviewSection) => {
    setEditingSectionId(section.id)
    setEditBuffer(section.html) // Initialize editor with current content
  }

  const handleCancelEdit = () => {
    setEditingSectionId(null)
    setEditBuffer('')
  }

  const handleSaveEdit = (section: PreviewSection) => {
    setUserOverride(section.id, {
      originalText: section.isEdited ? '' : section.html,
      editedText: editBuffer,
      timestamp: new Date().toISOString()
    })
    setEditingSectionId(null)
  }

  const handleRevert = (sectionId: string) => {
    if (confirm('Are you sure you want to revert to the generated version? All manual edits will be lost.')) {
      resetUserOverride(sectionId)
    }
  }

  const handleExport = async (format: 'md' | 'docx' | 'pdf') => {
    try {
      setIsExporting(true)
      const output = await renderExport(sessionState, format)

      if (typeof output === 'string') {
        // Markdown download
        const blob = new Blob([output], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `product-brief-${sessionState.sessionId.substring(0, 8)}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Blob download (PDF/DOCX) - placeholder for now as logic in exportRenderer returns string always in v1
        const blob = output as Blob
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `product-brief-${sessionState.sessionId.substring(0, 8)}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export document. Check console for details.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-4 h-full bg-slate-800 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-100">Live Documentation Preview</h2>

        <div className="flex space-x-2">
          {isGenerating && <span className="text-xs text-blue-400 animate-pulse self-center mr-2">Updating...</span>}

          <div className="relative group">
            <button disabled={isExporting} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded flex items-center space-x-1 disabled:opacity-50">
              <span>{isExporting ? 'Exporting...' : 'Export As...'}</span>
            </button>
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-32 bg-white rounded shadow-lg overflow-hidden hidden group-hover:block z-10">
              <button onClick={() => handleExport('md')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Markdown (.md)</button>
              <button onClick={() => handleExport('docx')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Word (.docx)</button>
              <button onClick={() => handleExport('pdf')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">PDF (.pdf)</button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700/50 p-3 rounded border border-slate-600">
            <div className="text-2xl font-bold text-slate-100">
              {derivedInferences.painPoints.length}
            </div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Pain Points</div>
          </div>
          <div className="bg-slate-700/50 p-3 rounded border border-slate-600">
            <div className="text-2xl font-bold text-slate-100">
              {gaps.length}
            </div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Gaps</div>
          </div>
        </div>

        {/* Sections List */}
        <div className="space-y-6 pb-20">
          {sections.map(section => (
            <div key={section.id} className={`bg-white rounded shadow-sm overflow-hidden border-2 ${section.isEdited ? 'border-amber-300' : 'border-transparent'}`}>

              {/* Section Header */}
              <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center group">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-700">{section.title}</h3>
                  {section.isEdited && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium border border-amber-200">
                      Edited
                    </span>
                  )}
                </div>

                <div className="flex space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {editingSectionId !== section.id && (
                    <>
                      {section.isEdited && (
                        <button
                          onClick={() => handleRevert(section.id)}
                          className="text-xs text-red-600 hover:text-red-700 hover:underline px-2"
                        >
                          Revert
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit(section)}
                        className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Section Content */}
              <div className="p-4">
                {editingSectionId === section.id ? (
                  <div className="space-y-3">
                    <textarea
                      className="w-full h-64 p-3 border rounded font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editBuffer}
                      onChange={(e) => setEditBuffer(e.target.value)}
                    />
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(section)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="prose prose-sm max-w-none text-slate-800"
                    dangerouslySetInnerHTML={{ __html: section.html }} // Safe because generated from trusted templates or user input
                  />
                )}
              </div>
            </div>
          ))}

          {sections.length === 0 && !isGenerating && (
            <div className="text-center text-slate-500 italic p-8">
              Generating preview...
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
