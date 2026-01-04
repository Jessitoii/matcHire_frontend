"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

type Job = {
  id: string
  title: string
  description: string
  CVs?: Array<any>
  missingKeywords?: MissingKeyword[]
}
interface MissingKeyword {
  requirement: string;
  advice: string;
  status: string;
  score: number;
}
// Skor için dairesel badge
function CircularScore({ score }: { score: number }) {
  const percent = Math.round(score * 100)
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const progress = (percent / 100) * circumference

  let color = "#ef4444"  // red
  if (percent >= 70) color = "#22c55e"    // green
  else if (percent >= 40) color = "#facc15"  // yellow

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {/* Gri daire */}
      <svg className="rotate-[-90deg]" width="64" height="64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="6"
          fill="transparent"
        />
        {/* Renkli yay */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeLinecap="round"
        />
      </svg>

      {/* Yazı */}
      <span className="absolute text-sm font-semibold">
        %{percent}
      </span>
    </div>
  )
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
  const [role, setRole] = useState<string | null>(null)   // 👈 YENİ STATE
  const [missingKeywords, setMissingKeywords] = useState<MissingKeyword[]>([]);

// 1) Profil yükleme
useEffect(() => {
  if (typeof window === "undefined") return; // SSR fix

  const token = window.localStorage.getItem("token");
  if (!token) {
    router.replace("/login");
    return;
  }

  async function loadProfile() {
    try {
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        router.replace("/login");
        return;
      }

      const data = await res.json();
      setRole(data.user.role);
    } catch (err) {
      router.replace("/login");
    }
  }

  loadProfile();
}, [router]);

// 2) Role geldikten sonra jobs çek
useEffect(() => {
  if (!role) return;
  fetchJobs();
}, [role]);

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

      const extractScore = (payload: any) => {
        if (!payload) return null
        if (payload.data && (payload.data.similarity !== undefined)) return payload.data.similarity
        if (payload.similarity !== undefined) return payload.similarity
        if (payload.score !== undefined) return payload.score
        return null
      }

      async function submitSequential() {
        const out: any[] = []
        for (const cv of cvs) {
          try {
            const res = await fetch(endpoint + cv.id, {
              method: 'POST',
              headers,
              body: JSON.stringify({ job_text: jobText })
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
      const useParallel = true
      const allResults = useParallel ? await submitParallel() : await submitSequential()

      const newList = await fetchJobs() // Taze listeyi al
      await loadSelectedJobDetails(selectedJobId!, newList) // Taze listeyi kullanarak detayı yükle
      const updatedJob = newList.find(j => j.id === selectedJobId);
      
      const rawKeywords = updatedJob?.missingKeywords || [];

      const parseDirtyJson = (str: string) => {
      try {
        // 1. Sadece sözlük yapısını belirleyen tırnakları hedefle
        let validJson = str
          .replace(/(\w+)'\s*:/g, '"$1":')       // Anahtarları (key) düzelt: 'key': -> "key":
          .replace(/:\s*'(.*?)'([,}])/g, ': "$1"$2'); // Değerleri (value) düzelt: : 'val' -> : "val"

        // 2. Eğer hala metin içinde tek tırnak kaldıysa (örn: "CV'nizde"), 
        // yukarıdaki regex onları korumuş olmalı.
        return JSON.parse(validJson);
      } catch (e) {
        // Eğer regex hala kaçırıyorsa, en çirkin ama en çalışan yöntem:
        // Bu sadece backend çok bozuksa son çaredir.
        try {
          return new Function(`return ${str}`)();
        } catch (finalError) {
          console.error("Artık bu veriyi kurtaramıyoruz:", finalError);
          return null;
        }
      }
    };

    // Kullanımı:
    const parsedKeywords = rawKeywords.map(parseDirtyJson).filter(Boolean);
    setMissingKeywords(parsedKeywords);
      console.log("missng : ", updatedJob?.missingKeywords)
      setResults(allResults.map((r: any) => ({ name: r.name, score: r.score, ...(r.error ? { error: r.error } : {}) })))
    } catch (err: any) {
      console.error(err)
      setResults([{ error: err.message || String(err) }])
    } finally {
      setLoading(false)
    }
    // Eğer iş arayan ise eksik kelimeleri de çek
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
      const list: Job[] = data.jobs || []

      setJobs(list)
      return list
    } catch (err) {
      console.error('Failed to load jobs', err)
      return []
    }
  }

  // Load selected job details (CVs and similarity scores)
  async function loadSelectedJobDetails(jobId: string, jobsList?: Job[]) {
    try {
      const listToSearch = jobsList || jobs
      const basic = listToSearch.find(j => j.id === jobId) || null

      const cvData = basic?.CVs
      let cvsList: any[] = []
      if (!cvData) cvsList = []
      else if (Array.isArray(cvData)) cvsList = cvData
      else if (Array.isArray((cvData as any).CVs)) cvsList = (cvData as any).CVs
      else if (Array.isArray((cvData as any).data)) cvsList = (cvData as any).data
      else if ((cvData as any).CVs) cvsList = [(cvData as any).CVs]

      // Skora göre sırala (yüksekten düşüğe)
      cvsList.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))

      const merged: Job = {
        id: jobId,
        title: basic?.title || ((cvData && (cvData as any).jobTitle) || ''),
        description: basic?.description || ((cvData && (cvData as any).jobDescription) || ''),
        CVs: cvsList,
        missingKeywords: basic?.missingKeywords || []
      }
      setSelectedJob(merged)
      setMissingKeywords(merged.missingKeywords || []);
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
      const newList = await fetchJobs()
      await loadSelectedJobDetails(selectedJobId!, newList)
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
      const newList = await fetchJobs()
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
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download CV failed', err)
    }
  }

  async function fetchMissingKeywords(cvId: string, jobId: string, jobText: string) {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/keywords/missing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cvId,
          jobId,
          jobText
        })
      });

      const data = await res.json();
      return data.missingKeywords || [];

    } catch (err) {
      console.error("Missing keywords error:", err);
      return [];
    }
  }

  return (
    <div>
      <div className="min-h-screen bg-white/90">
        <div className="w-full fixed top-0 left-0 z-50">
          <Navbar />
        </div>

        <div className="pt-[80px] px-4 md:px-8 pb-10 max-w-7xl mx-auto">
          {/* Üst grid: create job + selected job + sağda jobs list */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create job card */}
              <div className="bg-white/90 backdrop-blur border border-slate-100 p-5 md:p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Create a new job</h2>
                    <p className="text-sm text-slate-500">
                      Enter the job title and description, then upload and match CVs.
                    </p>
                  </div>
                </div>

                <input
                  placeholder="Job title"
                  value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <textarea
                  placeholder="Job description"
                  value={newJobDescription}
                  onChange={e => setNewJobDescription(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={createJob}
                    disabled={creatingJob}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-sm font-medium text-white rounded-xl shadow-sm hover:shadow-md hover:from-indigo-500 hover:to-indigo-500 transition disabled:opacity-60"
                  >
                    {creatingJob ? 'Creating...' : 'Create job'}
                  </button>
                </div>
              </div>

              {/* Selected job */}
              <div className="bg-white/90 backdrop-blur border border-slate-100 p-5 md:p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-semibold mb-3 text-slate-900">Selected job</h2>
                {!selectedJobId ? (
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-xs">
                      i
                    </span>
                    No job selected. Choose a job from the list to upload CVs.
                  </div>
                ) : (
                  (() => {
                    const selected = selectedJob
                    if (!selected) return <div className="text-sm text-red-600">Selected job not found</div>
                    return (
                      <div className="space-y-4">
                        <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/80">
                          <div className="font-medium text-slate-900">{selected.title}</div>
                          <div className="text-sm text-slate-600 mt-1 whitespace-pre-line max-h-40 overflow-y-auto">
                            {selected.description}
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700">
                              Upload CVs for this job
                            </label>
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              multiple
                              onChange={e => uploadCvsForJob(e.target.files, selectedJobId!)}
                              className="mt-2 text-sm"
                            />
                            {loading && (
                              <div className="mt-2">
                                <LoadingSpinner />
                              </div>
                            )}
                          </div>
                          <div className="md:ml-auto">
                            <button
                              onClick={handleSubmit}
                              className="px-4 py-2.5 bg-emerald-600 text-sm font-medium text-white rounded-xl shadow-sm hover:bg-emerald-500 transition cursor-pointer"
                            >
                              Calculate similarity
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                )}
              </div>
            </div>

            {/* Right column: jobs list */}
            <div className="bg-white/90 backdrop-blur border border-slate-100 p-4 md:p-5 rounded-2xl shadow-sm self-start max-h-[650px] overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-900">Your jobs</h2>
                {jobs.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {jobs.length} job{jobs.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {jobs.map(job => (
                  <li
                    key={job.id}
                    className={`p-3 rounded-xl border text-sm transition shadow-sm hover:shadow-md hover:-translate-y-[1px] cursor-pointer ${
                      selectedJobId === job.id
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="w-full">
                        <div className="font-medium text-slate-900">{job.title}</div>
                        <div className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                          {job.description}
                        </div>
                      </div>
                      <div className="flex flex-row items-center gap-2">
                        <button
                          onClick={() => { setSelectedJobId(job.id); loadSelectedJobDetails(job.id) }}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-500 cursor-pointer"
                        >
                          Select
                        </button>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {jobs.length === 0 && (
                <div className="text-sm text-slate-500 mt-2">
                  No jobs yet — create one on the left.
                </div>
              )}
            </div>
          </section>

          {/* Alt tarafta full-width CV listesi */}
          {selectedJob && selectedJob.CVs && selectedJob.CVs.length > 0 && (
            <section className="mt-6 bg-white/90 backdrop-blur border border-slate-100 p-5 rounded-2xl shadow-sm w-full">
              <h3 className="font-semibold mb-3 text-lg text-slate-900">Uploaded CVs</h3>
              <div className="overflow-x-auto">
                <table className="w-full mt-2 text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Size</th>
                      <th className="pb-2">Similarity</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedJob.CVs || []).map((cv: any, idx: number) => (
                      <tr
                        key={cv.id}
                        className={`border-t border-slate-100 ${
                          idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'
                        }`}
                      >
                        <td className="py-3 pr-4">{cv.originalName || cv.name}</td>
                        <td className="py-3 pr-4">
                          {cv.size ? `${(cv.size / 1024).toFixed(1)} KB` : '-'}
                        </td>
                        <td className="py-3 pr-4">
                          {cv.similarity !== undefined && cv.similarity !== null
                            ? <CircularScore score={cv.similarity} />
                            : '-'}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-4">
                            {/* Delete */}
                            <div onClick={() => deleteCv(cv.id)} title="Delete CV">
                              <svg xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-slate-500 hover:text-red-600 cursor-pointer transition"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </div>

                            {/* Download */}
                            {cv.filePath && (
                              <div onClick={() => downloadCv(cv.id)} title="Download CV">
                                <svg xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-slate-500 hover:text-slate-700 cursor-pointer transition"
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {role === "seeker" && selectedJob && (
            <div className="p-6 space-y-6 bg-white">
    {missingKeywords.length === 0 ? (
      <div className="text-center py-10">
        <span className="text-4xl">✅</span>
        <p className="text-emerald-600 font-semibold mt-2">Mükemmel! Eksik bileşen bulunamadı.</p>
      </div>
    ) : (
      missingKeywords.map((kw, i) => {
        // Python'daki mantığı değişkenlere atayalım
        const isCritical = kw.status === "EKSİK";
        const emoji = isCritical ? "❌" : "⚠️";
        const prefix = isCritical ? "KRİTİK EKSİK" : "GELİŞTİRİLMELİ";
        const bgColor = isCritical ? "bg-red-50" : "bg-amber-50";
        const borderColor = isCritical ? "border-red-200" : "border-amber-200";
        const textColor = isCritical ? "text-red-700" : "text-amber-700";

        return (
          <div 
            key={i} 
            className={`p-5 border-l-4 ${borderColor} ${bgColor} rounded-r-xl transition-all hover:shadow-sm`}
          >
            {/* Başlık ve Durum */}
            <div className="flex items-start gap-3">
              <span className="text-xl">{emoji}</span>
              <div>
                <h4 className={`font-bold ${textColor} text-sm uppercase tracking-tight`}>
                  {prefix}: {kw.requirement}
                </h4>
                
                {/* Tavsiye Kısmı (💡 TAVSİYE) */}
                <div className="mt-3 flex gap-2 text-slate-700">
                  <span className="flex-shrink-0">💡</span>
                  <p className="text-sm leading-relaxed italic">
                    <span className="font-semibold not-italic">TAVSİYE:</span> {kw.advice}
                  </p>
                </div>

                {/* Eşleşme Gücü (📊 Eşleşme Gücü) */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs">📊</span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Eşleşme Gücü:</span>
                  <div className="flex-1 h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} 
                      style={{ width: `${(kw.score * 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-bold ${textColor}`}>
                    %{(kw.score * 100).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })
    )}
  </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
