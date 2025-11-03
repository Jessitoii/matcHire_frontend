"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'
import CVUploader from '../../components/CVUploader'
import SimilarityList from '../../components/SimilarityList'

type CVItem = { name: string; text: string }

export default function DashboardPage() {
  const router = useRouter()
  const [jobText, setJobText] = useState('')
  const [cvs, setCvs] = useState<CVItem[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.replace('/login')
  }, [router])

  async function handleSubmit() {
    setLoading(true)
    setResults(null)
    try {
      if (!jobText || cvs.length === 0) {
        setResults([{ error: 'Please provide job text and at least one CV.' }])
        return
      }

      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const endpoint = base + '/similarity'
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) headers.Authorization = `Bearer ${token}`

      // helper to extract a numeric score from different possible backend shapes
      const extractScore = (payload: any) => {
        if (!payload) return null
        if (payload.data && (payload.data.similarity !== undefined)) return payload.data.similarity
        if (payload.similarity !== undefined) return payload.similarity
        if (payload.score !== undefined) return payload.score
        return null
      }

      // Sequential version (one-by-one). Useful if backend rate-limits or order matters.
      async function submitSequential() {
        const out: any[] = []
        for (const cv of cvs) {
          try {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify({ job_text: jobText, cv_text: cv.text })
            })
            if (!res.ok) {
              const txt = await res.text()
              out.push({ name: cv.name, score: null, error: txt || 'Request failed' })
              continue
            }
            const data = await res.json()
            out.push({ name: cv.name, score: extractScore(data) })
          } catch (e: any) {
            out.push({ name: cv.name, score: null, error: e?.message || String(e) })
          }
        }
        return out
      }

      // Parallel version (all requests in-flight). Faster for many CVs.
      async function submitParallel() {
        const promises = cvs.map(async (cv) => {
          try {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify({ job_text: jobText, cv_text: cv.text })
            })
            if (!res.ok) {
              const txt = await res.text()
              return { name: cv.name, score: null, error: txt || 'Request failed' }
            }
            const data = await res.json()
            return { name: cv.name, score: extractScore(data) }
          } catch (e: any) {
            return { name: cv.name, score: null, error: e?.message || String(e) }
          }
        })
        return Promise.all(promises)
      }

      // Choose the strategy here. Default to parallel for performance.
      const useParallel = true
      const allResults = useParallel ? await submitParallel() : await submitSequential()

      // Map to simple { name, score } when possible, but keep error when present for debugging
      setResults(allResults.map((r: any) => ({ name: r.name, score: r.score, ...(r.error ? { error: r.error } : {}) })))
    } catch (err: any) {
      console.error(err)
      setResults([{ error: err.message || String(err) }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div>
          <button className="mr-2 px-3 py-1 bg-gray-200 rounded" onClick={() => { localStorage.removeItem('token'); router.replace('/login') }}>Log out</button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          <label className="block text-sm font-medium">Job description</label>
          <textarea value={jobText} onChange={e => setJobText(e.target.value)} className="mt-2 w-full min-h-[180px] rounded border-gray-200 p-2" />

          <div className="mt-4">
            <CVUploader cvs={cvs} setCvs={setCvs} />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>Submit</button>
            {loading && <LoadingSpinner />}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium mb-2">Results</h2>
          <SimilarityList results={results} />
        </div>
      </section>
    </div>
  )
}
