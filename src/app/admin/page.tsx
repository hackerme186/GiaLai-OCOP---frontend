"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { getCurrentUser } from "@/lib/api"
import { getAuthToken, getRoleFromToken } from "@/lib/auth"

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [name, setName] = useState<string>("")

  useEffect(() => {
    const check = async () => {
      // 1) Prefer role từ JWT để tránh phụ thuộc /me
      const token = getAuthToken()
      const tokenRole = (getRoleFromToken(token) || "").toLowerCase()
      if (tokenRole === 'admin') {
        setAuthorized(true)
        // Cố gắng lấy tên hiển thị từ API nhưng không bắt buộc
        try {
          const me = await getCurrentUser()
          setName((me.name || me.fullName || me.username || "Admin").toString())
        } catch {}
        return
      }
      // 2) Fallback: gọi API /me nếu token không chứa role
      try {
        const me = await getCurrentUser()
        const role = (me.role || (me as any).roles)?.toString?.() || ""
        const ok = role.toLowerCase() === "admin"
        if (!ok) {
          router.replace("/login")
          return
        }
        setName((me.name || me.fullName || me.username || "Admin").toString())
        setAuthorized(true)
      } catch {
        router.replace("/login")
      }
    }
    check()
  }, [router])

  if (authorized === null) return null

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <Header />
      <main>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold text-gray-900">Bảng điều khiển Admin</h1>
          <p className="text-gray-600 mt-2">Xin chào, {name}</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <h2 className="font-medium text-gray-900 mb-2">Thống kê</h2>
              <p className="text-sm text-gray-600">Nội dung quản trị sẽ hiển thị tại đây.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


