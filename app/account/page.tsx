"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar"; // 👈 Navbar import edildi
import Footer from "@/components/Footer";

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [role, setRole]           = useState("");
  const [companyName, setCompanyName] = useState("");

  // PROFİL YÜKLE
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadProfile() {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        const u = data.user;

        setFirstName(u.firstName);
        setLastName(u.lastName);
        setEmail(u.email);
        setRole(u.role);
        setCompanyName(u.companyName || "");

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  // PROFİL GÜNCELLE
  async function handleSave() {
    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/auth/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role,
          companyName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message);
      } else {
        alert("Profile updated successfully!");
      }

    } catch (err) {
      console.error(err);
      alert("Update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div>
      <div className="min-h-screen bg-white/90">
        {/* NAVBAR ÜSTE SABİT */}
        <div className="w-full fixed top-0 left-0 z-50">
          <Navbar />
        </div>

        {/* NAVBAR boşluğu */}
        <div className="pt-[80px] px-4 md:px-8 pb-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-2xl p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                  <span>Account Settings</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {role === "employer" ? "Employer" : "Job Seeker"}
                  </span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Update your profile information and keep your account up to date.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                    First Name
                  </label>
                  <input
                    className="mt-1 w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Last Name
                  </label>
                  <input
                    className="mt-1 w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    className="mt-1 w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Password (optional)
                  </label>
                  <input
                    type="password"
                    className="mt-1 w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Leave blank to keep current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    We recommend using a strong password for security.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Role
                  </label>
                  <input
                    disabled
                    className="mt-1 w-full border border-slate-200 bg-gray-100 text-gray-600 rounded-xl px-3 py-2 text-sm"
                    value={role}
                  />
                </div>

                {role === "employer" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Company Name
                    </label>
                    <input
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
                  className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-sm font-medium text-white rounded-xl shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-indigo-500 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
