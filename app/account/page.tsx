"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "@/components/Footer";

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Kullanıcıya alert yerine mesaj göstermek için state
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [role, setRole]           = useState("");
  const [companyName, setCompanyName] = useState("");

  // API URL'ini env'den al
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // PROFİL YÜKLE
  useEffect(() => {
    // window check (SSR hatasını önlemek için)
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadProfile() {
      try {
        const res = await fetch(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to load profile");

        const data = await res.json();
        const u = data.user;

        setFirstName(u.firstName || "");
        setLastName(u.lastName || "");
        setEmail(u.email || "");
        setRole(u.role || "");
        setCompanyName(u.companyName || "");

      } catch (err) {
        console.error(err);
        // Profil yüklenemezse login'e atabiliriz
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router, API_URL]);

  // PROFİL GÜNCELLE
  async function handleSave() {
    setSaving(true);
    setStatus(null); // Önceki mesajı temizle

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/auth/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password, // Eğer boşsa backend bunu görmezden gelmeli veya işlememeli
          role,
          companyName
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      setStatus({ type: 'success', message: "Profile updated successfully!" });
      
      // Şifre alanını temizle (güvenlik ve UX için)
      setPassword(""); 

    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || "Update failed." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-slate-500 font-medium animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white/50">
      {/* NAVBAR ÜSTE SABİT */}
      <div className="w-full fixed top-0 left-0 z-50">
        <Navbar />
      </div>

      {/* NAVBAR boşluğu + İçerik */}
      <div className="flex-grow pt-[100px] px-4 md:px-8 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl p-6 md:p-8 space-y-6">
            
            {/* Başlık */}
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <span>Account Settings</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wide">
                  {role === "employer" ? "Employer" : "Job Seeker"}
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Update your profile information and keep your account up to date.
              </p>
            </div>

            {/* Başarı / Hata Mesajı */}
            {status && (
              <div className={`p-4 rounded-xl text-sm border ${
                status.type === 'success' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {status.message}
              </div>
            )}

            {/* Form Alanları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label htmlFor="firstName" className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                  First Name
                </label>
                <input
                  id="firstName"
                  className="mt-1 w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  id="lastName"
                  className="mt-1 w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Email
                </label>
                <input
                  id="email"
                  className="mt-1 w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="password" className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Password (optional)
                </label>
                <input
                  id="password"
                  type="password"
                  className="mt-1 w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Leave blank to keep current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-slate-400">
                  We recommend using a strong password for security.
                </p>
              </div>

              <div>
                <label htmlFor="role" className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Role
                </label>
                <input
                  id="role"
                  disabled
                  className="mt-1 w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-xl px-3 py-2 text-sm cursor-not-allowed"
                  value={role}
                />
              </div>

              {role === "employer" && (
                <div>
                  <label htmlFor="companyName" className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    className="mt-1 w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-sm font-medium text-white rounded-xl shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}