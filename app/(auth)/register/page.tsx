"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<"seeker" | "employer">("seeker")
  const [companyName, setCompanyName] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // API URL'ini env'den al, yoksa localhost kullan
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        firstName,
        lastName,
        email,
        password,
        role
      }

      // employer ise companyName'i ekle
      if (role === "employer") {
        payload.companyName = companyName
      }

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const text = await res.text()
        // Gelen hata mesajı JSON ise parse etmeye çalış, değilse text olarak al
        try {
            const jsonError = JSON.parse(text);
            throw new Error(jsonError.message || 'Registration failed');
        } catch {
            throw new Error(text || 'Registration failed');
        }
      }

      // Kayıt başarılıysa login sayfasına yönlendir
      router.replace('/login')
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white/50 flex items-center justify-center px-4">
      <div className="w-full max-w-md my-10"> {/* my-10 mobilde sıkışmayı önler */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-100 shadow-xl rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 19a8 8 0 0116 0"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Create account</h2>
              <p className="text-sm text-slate-500">
                Join Matchire and make job matching easy.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="firstName"
                  className="block text-xs font-medium text-slate-600 uppercase tracking-wide"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  type="text"
                  required
                />
              </div>

              <div>
                <label 
                  htmlFor="lastName"
                  className="block text-xs font-medium text-slate-600 uppercase tracking-wide"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  type="text"
                  required
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="role"
                className="block text-xs font-medium text-slate-600 uppercase tracking-wide"
              >
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={e => setRole(e.target.value as "seeker" | "employer")}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="seeker">Job Seeker</option>
                <option value="employer">Employer</option>
              </select>
            </div>

            {role === "employer" && (
              <div>
                <label 
                  htmlFor="companyName"
                  className="block text-xs font-medium text-slate-600 uppercase tracking-wide"
                >
                  Company Name
                </label>
                <input
                  id="companyName"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  type="text"
                  required
                />
              </div>
            )}

            <div>
              <label 
                htmlFor="email"
                className="block text-xs font-medium text-slate-600 uppercase tracking-wide"
              >
                Email
              </label>
              <input
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                type="email"
                required
              />
            </div>

            <div>
              <label 
                htmlFor="password"
                className="block text-xs font-medium text-slate-600 uppercase tracking-wide"
              >
                Password
              </label>
              <input
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                type="password"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-indigo-500 transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create account'}
              </button>

              <Link
                href="/login"
                className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Already have an account?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}