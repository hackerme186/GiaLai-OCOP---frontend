"use client"
import Link from "next/link"
import { useState } from "react"
import { login, getCurrentUser } from "@/lib/api"
import { setAuthToken, getRoleFromToken, setUserProfile } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await login({ email, password }) as any
      
      // Extract token from various possible response structures
      // Backend trả về Token (chữ hoa) nên cần check cả Token và token
      const token = res?.Token || res?.token || res?.data?.Token || res?.data?.token || res?.accessToken || res?.access_token
      
      if (!token) {
        throw new Error("Không nhận được token từ server")
      }
      
      // Save token first
      setAuthToken(token)
      
      // Wait a bit to ensure token is saved to localStorage
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Determine role from login response first, then fallback to /me
      const extractRole = (obj: any): string => {
        if (!obj) return ""
        // Common shapes: { role }, { roles: ['ADMIN'] }, { user: { role } }, { data: { role } }
        const u = obj.user || obj.data || obj
        const direct = u.role || u.userRole || u.authorities || u.permission || u.permissions
        if (Array.isArray(direct)) return (direct[0] || "").toString()
        if (typeof direct === 'string') return direct
        if (Array.isArray(u.roles)) return (u.roles[0] || "").toString()
        if (u.roles && typeof u.roles === 'object') return Object.values(u.roles)[0]?.toString?.() || ""
        return ""
      }
      
      // Try decode from JWT token first (most reliable)
      let role = getRoleFromToken(token) || extractRole(res)
      
      // If still no role, try to get from /me endpoint
      if (!role || role.trim() === "") {
        try {
          const me = await getCurrentUser()
          role = extractRole(me) || (me.role || (me as any).roles)?.toString?.() || ""
        } catch (err) {
          console.warn("Could not fetch user info:", err)
        }
      }
      
      // Normalize role for comparison
      const norm = role.toString().toLowerCase().trim()
      
      // Check roles
      const isSystemAdmin = norm === 'systemadmin' || norm === 'sysadmin'
      const isEnterpriseAdmin = norm === 'enterpriseadmin'
      const isAdmin = isSystemAdmin || 
                     norm === 'admin' || 
                     norm === 'administrator' || 
                     norm === 'role_admin' || 
                     norm === 'admin_role'
      
      try {
        const profile = await getCurrentUser()
        setUserProfile({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          enterpriseId: profile.enterpriseId ?? undefined,
          createdAt: profile.createdAt,
        })
        
        // Trigger cart reload for this user by dispatching storage event
        // Cart context will detect user change and load the correct cart
        window.dispatchEvent(new Event('storage'));
      } catch (profileErr) {
        console.warn("Could not load user profile:", profileErr)
      }

      // Redirect based on role
      if (isSystemAdmin || isAdmin) {
        router.replace("/admin")
      } else if (isEnterpriseAdmin) {
        router.replace("/enterprise-admin")
      } else {
        router.replace("/home")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-black">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="abc@example.com"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-black">
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="remember" className="ml-2 block text-sm text-black">
            Ghi nhớ đăng nhập
          </label>
        </div>

        <div className="text-sm">
          <Link href="/forgot" className="font-medium text-indigo-600 hover:text-indigo-500">
            Quên mật khẩu?
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  )
}