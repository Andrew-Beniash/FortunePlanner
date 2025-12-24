import { useSessionStore } from '../state/sessionStore'

export default function DocumentationPreviewPanel() {
  const derivedInferences = useSessionStore((state) => state.derivedInferences)
  const gaps = useSessionStore((state) => state.gaps)
  const completionBySection = useSessionStore((state) => state.completionBySection)

  return (
    <div className="p-4 h-full bg-slate-800 flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-slate-100">Live Documentation Preview</h2>

      <div className="space-y-6">

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
            <div className="text-xs text-slate-400 uppercase font-semibold">Gaps Identified</div>
          </div>
        </div>

        {/* Completion Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 mb-2">Completeness</h3>
          {Object.entries(completionBySection).length === 0 ? (
            <div className="text-sm text-slate-500 italic">No progress yet...</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(completionBySection).map(([section, stats]) => (
                <div key={section} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 capitalize">{section}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${stats.completeness}%` }}
                      />
                    </div>
                    <span className="text-slate-200 w-8 text-right">{stats.completeness}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Placeholder Content Area */}
        <div className="flex-1 bg-white p-6 rounded shadow-sm min-h-[200px] text-slate-800">
          <h1 className="text-2xl font-bold mb-4 border-b pb-2">Product Strategy Spec</h1>
          <p className="mb-4">
            This document is being generated live based on your interview session.
          </p>
          {derivedInferences.painPoints.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold mb-2">Identified Pain Points</h3>
              <ul className="list-disc pl-5">
                {derivedInferences.painPoints.map((pp, i) => (
                  <li key={i}>{JSON.stringify(pp)}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-sm text-slate-400 italic mt-8">
            (More content will appear here as you answer questions...)
          </p>
        </div>

      </div>
    </div>
  )
}
