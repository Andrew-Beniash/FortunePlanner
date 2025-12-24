import { useState, useEffect } from 'react'
import { useSessionStore } from '../../state/sessionStore'
import { renderPreview, type PreviewSection } from '../../templates/previewRenderer'
import { renderExport } from '../../templates/exportRenderer'
import { loadOutputs, getDefaultOutputId, type OutputFileConfig } from '../../config/outputs'

export default function DocumentationPreviewPanel() {
  // Global State
  const derivedInferences = useSessionStore((state) => state.derivedInferences)
  const gaps = useSessionStore((state) => state.gaps)
  // const completionBySection = useSessionStore((state) => state.completionBySection)
  const sessionState = useSessionStore((state) => state) // Access full state for generation

  const setUserOverride = useSessionStore((state) => state.setUserOverride)
  const resetUserOverride = useSessionStore((state) => state.resetUserOverride)
  const setOutputLanguage = useSessionStore((state) => state.setOutputLanguage)
  const outputLanguage = useSessionStore((state) => state.outputLanguage)

  // Local Component State
  const [sections, setSections] = useState<PreviewSection[]>([])
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editBuffer, setEditBuffer] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: any } | null>(null)

  // Output selection state
  const [availableOutputs, setAvailableOutputs] = useState<OutputFileConfig[]>([])
  const [selectedOutputId, setSelectedOutputId] = useState<string>(getDefaultOutputId())

  // Load available outputs on mount
  useEffect(() => {
    async function loadAvailableOutputs() {
      const outputs = await loadOutputs()
      setAvailableOutputs(outputs)
    }
    loadAvailableOutputs()
  }, [])

  // Regenerate when session or output selection changes
  useEffect(() => {
    let mounted = true

    async function updatePreview() {
      setIsGenerating(true)
      const newSections = await renderPreview(sessionState, selectedOutputId)
      if (mounted) {
        setSections(newSections)
        setIsGenerating(false)
      }
    }

    updatePreview()

    return () => { mounted = false }
  }, [
    sessionState.rawAnswers,
    sessionState.userOverrides,
    sessionState.derivedInferences,
    sessionState.outputLanguage,
    selectedOutputId
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
      const output = await renderExport(sessionState, format, selectedOutputId)

      // Find selected output config for filename
      const outputConfig = availableOutputs.find(o => o.id === selectedOutputId)
      let filename = `document-${sessionState.sessionId}.${format}`

      if (outputConfig?.fileNamePattern) {
        filename = outputConfig.fileNamePattern
          .replace('{sessionId}', sessionState.sessionId)
          .replace('{ext}', format)
      }

      if (typeof output === 'string') {
        // Markdown download
        const blob = new Blob([output], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Blob download (PDF/DOCX)
        const blob = output as Blob
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
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

  const handleMouseOver = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const source = target.getAttribute('data-source')
    const refs = target.getAttribute('data-refs')
    const assumptionsStr = target.getAttribute('data-assumptions')

    if (source || refs || assumptionsStr) {
      const assumptions = assumptionsStr
        ? JSON.parse(decodeURIComponent(assumptionsStr))
        : []

      setTooltip({
        x: e.clientX,
        y: e.clientY,
        content: { source, refs, assumptions }
      })
    }
  }

  const handleMouseOut = () => {
    setTooltip(null)
  }

  return (
    <div className="p-4 h-full bg-slate-800 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-100">Live Documentation Preview</h2>

        <div className="flex space-x-2">
          {isGenerating && <span className="text-xs text-blue-400 animate-pulse self-center mr-2">Updating...</span>}

          <div className="relative group">
            <button disabled={isExporting} className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded flex items-center space-x-1 border border-slate-600">
              <span className="uppercase">{outputLanguage}</span>
              <span>▼</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white rounded shadow-lg overflow-hidden hidden group-hover:block z-20">
              <button onClick={() => setOutputLanguage('en')} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 ${outputLanguage === 'en' ? 'font-bold bg-blue-50 text-blue-600' : 'text-slate-700'}`}>English</button>
              <button onClick={() => setOutputLanguage('es')} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 ${outputLanguage === 'es' ? 'font-bold bg-blue-50 text-blue-600' : 'text-slate-700'}`}>Español</button>
            </div>
          </div>

          {/* Output Type Selector */}
          <div className="relative group">
            <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded flex items-center space-x-1 border border-slate-600">
              <span>{availableOutputs.find(o => o.id === selectedOutputId)?.label || 'Product Brief'}</span>
              <span>▼</span>
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white rounded shadow-lg overflow-hidden hidden group-hover:block z-20">
              {availableOutputs.map(output => (
                <button
                  key={output.id}
                  onClick={() => setSelectedOutputId(output.id)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 ${selectedOutputId === output.id ? 'font-bold bg-blue-50 text-blue-600' : 'text-slate-700'}`}
                >
                  {output.label}
                </button>
              ))}
            </div>
          </div>

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

      {/* Provenance Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-slate-800 text-white text-xs p-3 rounded shadow-xl max-w-xs pointer-events-none border border-slate-600"
          style={{ top: tooltip.y + 10, left: tooltip.x + 10 }}
        >
          <div className="font-bold mb-1 border-b border-slate-600 pb-1 text-slate-200">Provenance</div>
          {tooltip.content.source && (
            <div className="mb-1">
              <span className="text-slate-400">Source:</span> {tooltip.content.source}
            </div>
          )}
          {tooltip.content.refs && (
            <div className="mb-1">
              <span className="text-slate-400">References:</span> {tooltip.content.refs}
            </div>
          )}
          {tooltip.content.assumptions && tooltip.content.assumptions.length > 0 && (
            <div className="mt-2">
              <span className="text-slate-400 block mb-1">Assumptions:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {tooltip.content.assumptions.map((a: string, i: number) => (
                  <li key={i} className="text-slate-300">{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar" onMouseLeave={handleMouseOut}>

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
                    dangerouslySetInnerHTML={{ __html: section.html }}
                    onMouseOver={handleMouseOver}
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
