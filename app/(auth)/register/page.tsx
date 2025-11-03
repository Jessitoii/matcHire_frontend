"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { log } from 'console'

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<"seeker" | "employer">("seeker")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, role})
      })
      console.log(res);
      
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Registration failed')
      }

      // after successful registration, redirect to login
      router.replace('/login')
    } catch (err: any) {
      setError(err.message || 'Unknown error')
      console.log("error : ", err);
      
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">First Name</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" type="text" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Last Name</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" type="text" required />
        </div>
        <div>
        <div>
            <label className="block text-sm font-medium">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as "seeker" | "employer")} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" required>
              <option value="seeker">Job Seeker</option>
              <option value="employer">Employer</option>
            </select>
        </div>

          <label className="block text-sm font-medium">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" type="email" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" type="password" required />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex items-center justify-between">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
          <a className="text-sm text-indigo-600 hover:underline" href="/login">Back to login</a>
        </div>
      </form>
    </div>
  )
}
