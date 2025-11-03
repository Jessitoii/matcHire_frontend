export default function SimilarityList({ results }: { results: any[] | null }) {
  if (!results) return <div className="text-sm text-slate-500">No results yet.</div>
  if (!Array.isArray(results)) return <div className="text-sm text-red-600">Unexpected result format</div>

  return (
    <div className="space-y-2">
      {results.map((r, i) => (
        <div key={i} className="p-2 rounded bg-gray-50">
          {r.error ? (
            <div className="text-sm text-red-600">{r.error}</div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{r.name || r.cvName || `CV ${i + 1}`}</div>
                <div className="text-xs text-slate-600">Score: {typeof r.score === 'number' ? (r.score * 100).toFixed(1) + '%' : String(r.score)}</div>
              </div>
              <div className="text-sm text-slate-500">{r.match || ''}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
