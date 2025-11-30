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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title - Reddish Brown Bold */}
      <h1 className="text-4xl font-bold text-center mb-8" style={{ 
        color: '#8B4513',
        fontFamily: 'serif',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        Login
      </h1>

      {/* Username Field */}
      <div>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Username"
          className="w-full rounded-2xl border-2 border-white/50 bg-white/20 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/70 focus:border-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
          style={{
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        />
      </div>

      {/* Password Field */}
      <div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-2xl border-2 border-white/50 bg-white/20 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/70 focus:border-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
          style={{
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        />
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-white/90 text-sm">
        <div className="flex items-center">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-white/50 bg-white/20 text-white focus:ring-white/50"
          />
          <label htmlFor="remember" className="ml-2 cursor-pointer">
            Remember Me
          </label>
        </div>

        <Link 
          href="/forgot" 
          className="text-white/90 hover:text-white transition-colors"
        >
          Forgot Password
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-300 bg-red-500/20 rounded-lg px-3 py-2 border border-red-400/30">
          {error}
        </p>
      )}

      {/* Login Button - White Background, Bold Text */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-white px-6 py-3 text-lg font-bold shadow-lg hover:bg-white/95 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
        style={{ 
          color: '#8B4513',
          fontFamily: 'serif',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {/* Registration Link */}
      <p className="text-center text-sm text-white/90 mt-6">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => router.push('/register')}
          className="text-white font-medium hover:text-white/80 underline transition-colors"
        >
          Register
        </button>
      </p>
    </form>
  )
}