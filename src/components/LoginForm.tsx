"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
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
  const [mounted, setMounted] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only set default email on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    // Set default email only in development or if needed
    if (process.env.NODE_ENV === 'development') {
      setEmail("nguyenbaquyet9a4cpr@gmail.com")
    }
  }, [])

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
    <div className="w-full">
      {/* Title - Welcome OCOP-GiaLai */}
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-white">
        Chào mừng đến với OCOP-GiaLai
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field with User Icon */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all shadow-md"
            suppressHydrationWarning
          />
        </div>

        {/* Password Field with Lock Icon */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all shadow-md"
            suppressHydrationWarning
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
              className="h-4 w-4 rounded border-white/50 bg-white/20 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="remember" className="ml-2 cursor-pointer">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <Link 
            href="/forgot" 
            className="text-white/90 hover:text-white transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-200 bg-red-500/20 rounded-lg px-3 py-2 border border-red-400/30">
            {error}
          </p>
        )}

        {/* Login Button - Pink */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all shadow-[0_4px_12px_rgba(236,72,153,0.4)]"
          suppressHydrationWarning
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        {/* Divider with "or" in pink circle */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/30"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-pink-500 rounded-full w-10 h-10 flex items-center justify-center">
              <span className="text-white text-sm font-medium">hoặc</span>
            </div>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          {/* Facebook Button */}
          <FacebookLoginButton onError={(err) => setError(err)} />

          {/* Google Button */}
          <GoogleLoginButton onError={(err) => setError(err)} />
        </div>

        {/* Registration Link */}
        <p className="text-center text-sm text-white/90 mt-6">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="text-white font-medium hover:text-white/80 underline transition-colors"
          >
            Đăng ký
          </Link>
        </p>
      </form>

      {/* Copyright */}
      <p className="text-center text-xs text-white/70 mt-8">
        © 2024 OCOP-GiaLai. Bảo lưu mọi quyền
      </p>
    </div>
  )
}
