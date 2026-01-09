"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Navbar() {
  const router = useRouter()

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <nav className="w-full backdrop-blur-xl bg-white/80 border-b border-slate-200 sticky top-0 z-50 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        
        {/* LOGO */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push("/")}
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-indigo-100 shadow-sm group-hover:shadow-md transition">
            <Image 
              src="/icon.jpeg" 
              alt="Matchire Logo" 
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
            Matchire
          </span>
        </div>

        {/* MENU */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => router.push("/")}
            className="text-slate-600 hover:text-indigo-600 transition"
          >
            Home
          </button>

          <button
            onClick={() => router.push("/account")}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition group"
          >
            <svg
              className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition"
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
            <span className="hidden sm:inline">Account</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <button
            onClick={logout}
            className="px-4 py-2 text-red-600 hover:text-white border border-red-200 rounded-lg hover:bg-red-500 hover:border-red-500 transition shadow-sm"
          >
            Log Out
          </button>
        </div>

      </div>
    </nav>
  )
}