"use client"

import { useEffect, useState } from "react"
import { getUserProfile, isLoggedIn } from "@/lib/auth"
import { getCurrentUser } from "@/lib/api"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { useRouter } from "next/navigation"

export default function AccountPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    const init = async () => {
      const ok = await isLoggedIn()
      if (!ok) {
        router.replace("/login")
        return
      }
      // Prefer fetching from backend
      try {
        const me = await getCurrentUser()
        setName((me.name || me.fullName || "").toString())
        setEmail((me.email || "").toString())
      } catch {
        const profile = getUserProfile() || {}
        setName(profile.name || "")
        setEmail((profile as any).email || "")
      }
      setReady(true)
    }
    init()
  }, [router])

  if (!ready) return null

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <Header />
      <main>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Hồ sơ người dùng</h1>
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
              <div className="text-gray-900 font-medium">{name || "(chưa cập nhật)"}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="text-gray-900 font-medium">{email || "(chưa cập nhật)"}</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


