"use client"
import Link from "next/link"
import { useState } from "react"
import { login, getCurrentUser } from "@/lib/api"
import { setAuthToken, getRoleFromToken, setUserProfile } from "@/lib/auth"
import { useRouter } from "next/navigation"
import FacebookLoginButton from "./FacebookLoginButton"
import GoogleLoginButton from "./GoogleLoginButton"

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
    
    console.log("🔐 [Login] Bắt đầu đăng nhập với email:", email)
    
    try {
      console.log("📤 [Login] Gửi request đăng nhập...")
      const res = await login({ email, password }) as any
      console.log("📥 [Login] Response từ API:", res)
      console.log("📥 [Login] Response type:", typeof res)
      console.log("📥 [Login] Response keys:", res ? Object.keys(res) : "null")
      
      // Extract token from various possible response structures
      // Backend trả về Token (chữ hoa) nên cần check cả Token và token
      const token = res?.Token || res?.token || res?.data?.Token || res?.data?.token || res?.accessToken || res?.access_token
      console.log("🔑 [Login] Token extracted:", token ? `${token.substring(0, 20)}...` : "NULL")
      
      if (!token) {
        console.error("❌ [Login] Không tìm thấy token trong response:", JSON.stringify(res, null, 2))
        throw new Error("Không nhận được token từ server. Vui lòng kiểm tra thông tin đăng nhập.")
      }
      
      // Save token first
      console.log("💾 [Login] Lưu token vào localStorage...")
      setAuthToken(token)
      
      // Verify token was saved
      const savedToken = typeof window !== "undefined" ? localStorage.getItem("ocop_auth_token") : null
      console.log("✅ [Login] Token đã được lưu:", savedToken ? "YES" : "NO")
      
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
      console.log("👤 [Login] Đang extract role...")
      let role = getRoleFromToken(token) || extractRole(res)
      console.log("👤 [Login] Role từ token:", role || "NOT FOUND")
      
      // If still no role, try to get from /me endpoint
      if (!role || role.trim() === "") {
        console.log("👤 [Login] Role không tìm thấy, đang gọi /me endpoint...")
        try {
          const me = await getCurrentUser()
          console.log("👤 [Login] User info từ /me:", me)
          role = extractRole(me) || (me.role || (me as any).roles)?.toString?.() || ""
          console.log("👤 [Login] Role từ /me:", role || "NOT FOUND")
        } catch (err) {
          console.warn("⚠️ [Login] Could not fetch user info:", err)
        }
      }
      
      // Normalize role for comparison
      const norm = role.toString().toLowerCase().trim()
      console.log("👤 [Login] Normalized role:", norm)
      
      // Check roles
      const isSystemAdmin = norm === 'systemadmin' || norm === 'sysadmin'
      const isEnterpriseAdmin = norm === 'enterpriseadmin'
      const isAdmin = isSystemAdmin || 
                     norm === 'admin' || 
                     norm === 'administrator' || 
                     norm === 'role_admin' || 
                     norm === 'admin_role'
      
      try {
        console.log("👤 [Login] Đang lấy user profile...")
        const profile = await getCurrentUser()
        console.log("👤 [Login] User profile:", profile)
        setUserProfile({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          enterpriseId: profile.enterpriseId ?? undefined,
          createdAt: profile.createdAt,
        })
        console.log("✅ [Login] User profile đã được lưu")
      } catch (profileErr) {
        console.warn("⚠️ [Login] Could not load user profile:", profileErr)
      }

      // Redirect based on role
      console.log("🔀 [Login] Đang redirect...")
      console.log("🔀 [Login] isSystemAdmin:", isSystemAdmin)
      console.log("🔀 [Login] isEnterpriseAdmin:", isEnterpriseAdmin)
      console.log("🔀 [Login] isAdmin:", isAdmin)
      
      if (isSystemAdmin || isAdmin) {
        console.log("🔀 [Login] Redirecting to /admin")
        router.replace("/admin")
      } else if (isEnterpriseAdmin) {
        console.log("🔀 [Login] Redirecting to /enterprise-admin")
        router.replace("/enterprise-admin")
      } else {
        console.log("🔀 [Login] Redirecting to /home")
        router.replace("/home")
      }
      
      console.log("✅ [Login] Đăng nhập thành công!")
    } catch (err) {
      console.error("❌ [Login] Lỗi đăng nhập:", err)
      console.error("❌ [Login] Error type:", err?.constructor?.name)
      console.error("❌ [Login] Error message:", err instanceof Error ? err.message : String(err))
      
      if (err instanceof Error && (err as any).status) {
        console.error("❌ [Login] HTTP Status:", (err as any).status)
      }
      
      if (err instanceof Error && (err as any).response) {
        console.error("❌ [Login] Response data:", (err as any).response)
      }
      
      const errorMessage = err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại."
      setError(errorMessage)
    } finally {
      setLoading(false)
      console.log("🏁 [Login] Kết thúc quá trình đăng nhập")
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

      {/* Divider */}
      <div className="relative my-6 text-center">
        <span className="relative bg-transparent px-2 text-white/70 text-sm" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
          hoặc đăng nhập bằng
        </span>
        <div className="absolute inset-0 top-1/2 -z-10 border-t border-white/30" />
      </div>

      {/* Social Login Buttons - Side by Side */}
      <div className="flex items-stretch justify-center gap-3">
        {/* Facebook Button - Left */}
        <div className="flex-1 min-w-0">
          <FacebookLoginButton onError={(err) => setError(err)} />
        </div>

        {/* Google Button - Right */}
        <div className="flex-1 min-w-0">
          <GoogleLoginButton onError={(err) => setError(err)} />
        </div>
      </div>

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