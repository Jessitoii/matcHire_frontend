"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'



type Job = {
  id: string
  title: string
  description: string
  CVs?: Array<any>
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [creatingJob, setCreatingJob] = useState(false)
  const [newJobTitle, setNewJobTitle] = useState('')
  const [newJobDescription, setNewJobDescription] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.replace('/login')
  }, [router])

  async function handleSubmit() {
    setLoading(true)
    setResults(null)
    const jobText = selectedJob?.description || ''
    const cvs = selectedJob?.CVs || []
    console.log('Submitting for similarity:', { jobText, cvs })
    try {
      if (!jobText || cvs.length === 0) {
        setResults([{ error: 'Please provide job text and at least one CV.' }])
        return
      }

      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const endpoint = base + '/similarity/'
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) headers.Authorization = `Bearer ${token}`
      console.log('Using endpoint:', endpoint)
      // helper to extract a numeric score from different possible backend shapes
      const extractScore = (payload: any) => {
        if (!payload) return null
        if (payload.data && (payload.data.similarity !== undefined)) return payload.data.similarity
        if (payload.similarity !== undefined) return payload.similarity
        if (payload.score !== undefined) return payload.score
        return null
      }
      console.log('Using endpoint2:', endpoint)
      // Sequential version (one-by-one). Useful if backend rate-limits or order matters.
      async function submitSequential() {
        const out: any[] = []
        for (const cv of cvs) {
          try {
            const res = await fetch(endpoint + cv.id, {
              method: 'POST',
              headers,
              body: JSON.stringify({ job_text: jobText})
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
        console.log('Submitting CVs in parallel to', endpoint)
        const promises = cvs.map(async (cv) => {
          try {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify({ job_text: jobText, cvId: cv.id, jobId: selectedJobId })
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
      console.log('Submitting CVs for similarity...')
      // Choose the strategy here. Default to parallel for performance.
      const useParallel = true
      const allResults = useParallel ? await submitParallel() : await submitSequential()

      //refresh selected job details to get updated similarity scores
      const newList = await fetchJobs() // Taze listeyi al
      await loadSelectedJobDetails(selectedJobId!, newList) // Taze listeyi kullanarak detayı yükle
      // Map to simple { name, score } when possible, but keep error when present for debugging
      setResults(allResults.map((r: any) => ({ name: r.name, score: r.score, ...(r.error ? { error: r.error } : {}) })))
    } catch (err: any) {
      console.error(err)
      setResults([{ error: err.message || String(err) }])
    } finally {
      setLoading(false)
    }
  }


  // Fetch all jobs of authenticated employer
  async function fetchJobs() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/jobs', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    const list: Job[] = data.jobs || [] // Job[] olarak tip güvenliği sağla
    
    setJobs(list) // State'i güncelle
    return list  // Taze listeyi döndür
    
  } catch (err) {
    console.error('Failed to load jobs', err)
    return [] // Hata durumunda boş liste döndür
  }
}

  useEffect(() => { fetchJobs() }, [])

  // Load selected job details (CVs and similarity scores)
  async function loadSelectedJobDetails(jobId: string, jobsList?: Job[]) {
  try {
    // Eğer 'jobsList' parametresi geldiyse onu, gelmediyse state'teki 'jobs'u kullan
    const listToSearch = jobsList || jobs
    const basic = listToSearch.find(j => j.id === jobId) || null
    
    // ... (fonksiyonun geri kalanı aynı)
    const cvData  = basic?.CVs
    let cvsList: any[] = []
    if (!cvData) cvsList = []
    else if (Array.isArray(cvData)) cvsList = cvData
    else if (Array.isArray((cvData as any).CVs)) cvsList = (cvData as any).CVs
    else if (Array.isArray((cvData as any).data)) cvsList = (cvData as any).data
    else if ((cvData as any).CVs) cvsList = [(cvData as any).CVs]

    const merged: Job = {
      id: jobId,
      title: basic?.title || ((cvData && (cvData as any).jobTitle) || ''),
      description: basic?.description || ((cvData && (cvData as any).jobDescription) || ''),
      CVs: cvsList
    }
    setSelectedJob(merged)
  } catch (err) {
    console.error('Failed to load selected job details', err)
    setSelectedJob(null)
  }
}

  // Create a new job
  async function createJob() {
    if (!newJobTitle.trim() || !newJobDescription.trim()) return
    setCreatingJob(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ title: newJobTitle, description: newJobDescription })
      })
      if (!res.ok) throw new Error(await res.text())
      await fetchJobs()
      setNewJobTitle('')
      setNewJobDescription('')
    } catch (err) {
      console.error('Create job failed', err)
    } finally {
      setCreatingJob(false)
    }
  }

  // Delete a job
  async function deleteJob(jobId: string) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      if (!res.ok) throw new Error(await res.text())
      // refresh list
      await fetchJobs()
      if (selectedJobId === jobId) setSelectedJobId(null)
    } catch (err) {
      console.error('Delete job failed', err)
    }
  }

  // Upload CV files for a specific jobId
  async function uploadCvsForJob(files: FileList | null, jobId: string) {
    if (!files || files.length === 0) return
    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      const arr = Array.from(files)
      for (const f of arr) {
        const fd = new FormData()
        fd.append('jobId', jobId)
        fd.append('cvFile', f)
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/cv/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: fd
        })
        if (!res.ok) {
          console.error('Upload failed for', f.name, await res.text())
        }
      }
      // After uploading all, refresh selected job details (CVs & similarity)
      // After uploading all, refresh Jobs list
      const newList = await fetchJobs() // Taze listeyi al
      await loadSelectedJobDetails(selectedJobId!, newList) // Taze listeyi kullanarak detayı yükle
    } catch (err) {
      console.error('Upload error', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete a CV by id (assumes backend accepts ?cvId=...)
  async function deleteCv(cvId: string) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/cv/delete?cvId=${encodeURIComponent(cvId)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      if (!res.ok) throw new Error(await res.text())
      // refresh selected job if present
      const newList = await fetchJobs()
    
    // loadSelectedJobDetails'e taze listeyi yolla
    if (selectedJobId) await loadSelectedJobDetails(selectedJobId, newList)
    } catch (err) {
      console.error('Delete CV failed', err)
    }
  }

  async function downloadCv(cvId: string) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/cv/download?cvId=' + encodeURIComponent(cvId), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })  
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)    
      const a = document.createElement('a')
      a.href = url
      a.download = 'cv_' + cvId + '.pdf' // İndirilen dosya adı
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download CV failed', err)
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
        {/* Main column: create job + selected job details and CV upload */}
        <div className="md:col-span-2 bg-white p-4 rounded shadow space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Create a new job</h2>
            <input placeholder="Job title" value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} className="w-full rounded border-gray-200 p-2 mb-2" />
            <textarea placeholder="Job description" value={newJobDescription} onChange={e => setNewJobDescription(e.target.value)} className="w-full rounded border-gray-200 p-2 mb-2" />
            <div className="flex items-center gap-2">
              <button onClick={createJob} disabled={creatingJob} className="px-4 py-2 bg-indigo-600 text-white rounded">{creatingJob ? 'Creating...' : 'Create job'}</button>
              <button onClick={fetchJobs} className="px-3 py-2 bg-gray-100 rounded">Refresh jobs</button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Selected job</h2>
            {!selectedJobId ? (
              <div className="text-sm text-slate-600">No job selected. Choose a job from the list to upload CVs.</div>
            ) : (
                    (() => {
                const selected = selectedJob || jobs.find(j => j.id === selectedJobId)
                if (!selected) return <div className="text-sm text-red-600">Selected job not found</div>
                return (
                  <div className="space-y-4">
                    <div className="p-3 border rounded bg-gray-50">
                      <div className="font-medium">{selected.title}</div>
                      <div className="text-sm text-slate-600">{selected.description}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div>
                        <label className="block text-sm font-medium">Upload CVs for this job</label>
                        <input type="file" accept="application/pdf,.pdf" multiple onChange={e => uploadCvsForJob(e.target.files, selectedJobId!)} className="mt-2" />
                        {loading && <div className="mt-2"><LoadingSpinner /></div>}
                      </div>
                      <div className="ml-auto">
                        <button onClick={handleSubmit} className="px-3 py-2 bg-emerald-600 text-white rounded cursor-pointer">Calculate similarity</button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium">Uploaded CVs</h3>
                      <table className="w-full mt-2 text-sm">
                        <thead>
                          <tr className="text-left">
                            <th className="pb-2">Name</th>
                            <th className="pb-2">Size</th>
                            <th className="pb-2">Similarity</th>
                            <th className="pb-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {((selectedJob?.CVs) || []).map((cv: any) => (
                            <tr key={cv.id} className="border-t">
                              <td className="py-2">{cv.originalName || cv.name}</td>
                              <td className="py-2">{cv.size ? `${(cv.size/1024).toFixed(1)} KB` : '-'}</td>
                              <td className="py-2">{cv.similarity !== undefined && cv.similarity !== null ? (typeof cv.similarity === 'number' ? (cv.similarity * 100).toFixed(1) + '%' : String(cv.similarity)) : '-'}</td>
                              <td className="py-2">
                                <button onClick={() => deleteCv(cv.id)} className="text-sm text-red-600 cursor-pointer">Delete</button>
                                {cv.filePath && (
                                  <button onClick={() => {
                                    downloadCv(cv.id)
                                  }} className="ml-3 text-sm text-indigo-600 cursor-pointer">Download</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()
            )}
          </div>
        </div>

        {/* Right column: jobs list */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium mb-2">Your jobs</h2>
          <ul className="space-y-2">
            {jobs.map(job => (
              <li key={job.id} className={`p-2 rounded border ${selectedJobId === job.id ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50'}`}>
                <div className="flex flex-col justify-between">
                  <div className='w-full'>
                    <div className="font-medium">{job.title}</div>
                    <div className="text-xs text-slate-600 truncate max-w-xs">{job.description}</div>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <button onClick={() => { setSelectedJobId(job.id); loadSelectedJobDetails(job.id) }} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-400 cursor-pointer">Select</button>
                    <button onClick={() => deleteJob(job.id)} className="px-2 py-1 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 cursor-pointer">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {jobs.length === 0 && <div className="text-sm text-slate-500 mt-2">No jobs yet — create one above.</div>}
        </div>
      </section>
    </div>
  )
}
