"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Navbar() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const userString = localStorage.getItem("user")
    if (userString) {
      const user = JSON.parse(userString)
      setRole(user.role)
    }
  }, [])

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <nav className="w-full backdrop-blur-xl bg-white/80 border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        
        {/* LEFT - LOGO */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 19a8 8 0 0116 0" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-slate-800 tracking-tight">
            MatcHire
          </span>
        </div>

        {/* RIGHT - MENU BUTTONS */}
        <div className="flex items-center gap-4 text-sm font-medium">
          <button
            onClick={() => router.push("/")}
            className="text-slate-700 hover:text-indigo-600 transition"
          >
            Home
          </button>

          <button
            onClick={() => router.push("/account")}
            className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition"
          >
            <svg
              className="h-5 w-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4.5 21a8.25 8.25 0 1116.5 0" />
            </svg>
            Account
          </button>

          <button
            onClick={logout}
            className="px-3 py-1.5 text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition"
          >
            Log Out
          </button>
        </div>

      </div>
    </nav>
  )
}
