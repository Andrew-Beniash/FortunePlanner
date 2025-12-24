import { useState } from 'react'
import { useSessionStore } from '../../state/sessionStore'
import { setQuestionsOverride } from '../../config/questions'
import { setTemplateOverride, clearTemplateOverrides, getOverriddenTemplates } from '../../config/templates'
import type { Question } from '../../config/types'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
  const outputLanguage = useSessionStore((state) => state.outputLanguage)
  const setOutputLanguage = useSessionStore((state) => state.setOutputLanguage)

  const [feedback, setFeedback] = useState<string | null>(null)
  const [uploadedQuestionsFile, setUploadedQuestionsFile] = useState<string | null>(null)
  const [uploadedTemplates, setUploadedTemplates] = useState<string[]>(getOverriddenTemplates())


  const handleQuestionsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const questions = JSON.parse(text) as Question[]

      // Basic validation
      if (!Array.isArray(questions)) {
        throw new Error('File must contain an array of questions')
      }

      if (questions.some(q => !q.id || !q.text)) {
        throw new Error('Invalid question format: missing id or text')
      }

      setQuestionsOverride(questions)
      setUploadedQuestionsFile(file.name)
      setFeedback(`✓ Loaded ${questions.length} questions from ${file.name}`)

      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setFeedback(`✗ Error loading questions: ${message}`)
      setTimeout(() => setFeedback(null), 5000)
    }

    // Reset input
    e.target.value = ''
  }

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const templateId = prompt('Enter template ID (e.g., "product-brief-v1"):')
    if (!templateId) {
      e.target.value = ''
      return
    }

    try {
      const content = await file.text()

      if (!content.trim()) {
        throw new Error('Template file is empty')
      }

      setTemplateOverride(templateId, content)
      setUploadedTemplates(getOverriddenTemplates())
      setFeedback(`✓ Template "${templateId}" loaded from ${file.name}`)

      setTimeout(() => setFeedback(null), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setFeedback(`✗ Error loading template: ${message}`)
      setTimeout(() => setFeedback(null), 5000)
    }

    // Reset input
    e.target.value = ''
  }

  const handleResetOverrides = () => {
    const confirmed = window.confirm(
      'Reset all custom configurations?\\n\\nThis will restore default questions and templates.'
    )

    if (confirmed) {
      setQuestionsOverride(null)
      clearTemplateOverrides()
      setUploadedQuestionsFile(null)
      setUploadedTemplates([])
      setFeedback('✓ Reset to defaults')
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl border border-slate-700 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Output Language Setting */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Default Output Language
            </label>
            <select
              value={outputLanguage}
              onChange={(e) => setOutputLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 text-slate-200 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish (Español)</option>
              <option value="fr">French (Français)</option>
              <option value="de">German (Deutsch)</option>
            </select>
            <p className="text-xs text-slate-400">
              This will be the default language for generated documentation.
            </p>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className={`p-3 rounded-lg text-sm ${feedback.startsWith('✓')
                ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-700'
                : 'bg-red-900/50 text-red-200 border border-red-700'
              }`}>
              {feedback}
            </div>
          )}

          {/* Questions Upload */}
          <div className="space-y-2 pt-4 border-t border-slate-700">
            <label className="block text-sm font-medium text-slate-200">
              Custom Questions
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleQuestionsUpload}
              className="block w-full text-sm text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-500
                file:cursor-pointer"
            />
            <p className="text-xs text-slate-400">
              Upload a JSON file containing custom interview questions.
              {uploadedQuestionsFile && (
                <span className="block mt-1 text-emerald-400">
                  ✓ Using: {uploadedQuestionsFile}
                </span>
              )}
            </p>
          </div>

          {/* Templates Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Custom Templates
            </label>
            <input
              type="file"
              accept=".hbs,.handlebars,.md"
              onChange={handleTemplateUpload}
              className="block w-full text-sm text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-500
                file:cursor-pointer"
            />
            <p className="text-xs text-slate-400">
              Upload Handlebars (.hbs) or Markdown (.md) template files.
              {uploadedTemplates.length > 0 && (
                <span className="block mt-1 text-emerald-400">
                  ✓ {uploadedTemplates.length} template(s) loaded: {uploadedTemplates.join(', ')}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-4 border-t border-slate-700">
          <button
            onClick={handleResetOverrides}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
