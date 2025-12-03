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
  const [showOTP, setShowOTP] = useState(false)
  const [otpEmail, setOtpEmail] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOtpLoading(true)

    try {
      // TODO: Implement OTP sending logic
      console.log("📧 [OTP] Gửi mã OTP đến email:", otpEmail)
      // const res = await sendOTP({ email: otpEmail })
      alert("Mã OTP đã được gửi đến email của bạn!")
    } catch (err) {
      console.error("❌ [OTP] Lỗi gửi OTP:", err)
      const errorMessage = err instanceof Error ? err.message : "Gửi mã OTP thất bại. Vui lòng thử lại."
      setError(errorMessage)
    } finally {
      setOtpLoading(false)
    }
  }

  // OTP Form (Forgot Password)
  if (showOTP) {
    return (
      <div className="space-y-6 animate-fadeInUp">
        {/* Title - Đăng nhập bằng OTP */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{
            fontFamily: 'sans-serif',
            letterSpacing: '1px',
            color: '#d97706',
            textShadow: '0 2px 10px rgba(217, 119, 6, 0.3)'
          }}>
            Đăng nhập bằng OTP
          </h1>
        </div>

        {/* Email Input Field */}
        <form onSubmit={handleSendOTP} className="space-y-6">
          <div>
            <input
              id="otp-email"
              name="otp-email"
              type="email"
              autoComplete="email"
              required
              value={otpEmail}
              onChange={(e) => setOtpEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="animate-fadeIn">
              <div className="text-sm text-red-200 bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-400/30">
                {error}
              </div>
            </div>
          )}

          {/* Gửi mã OTP Button */}
          <button
            type="submit"
            disabled={otpLoading}
            className="w-full bg-white hover:bg-gray-50 text-[#d97706] font-bold py-3.5 px-6 rounded-lg shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
            style={{ fontFamily: 'sans-serif' }}
          >
            {otpLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang gửi...
              </span>
            ) : (
              'Gửi mã OTP'
            )}
          </button>
        </form>
      </div>
    )
  }

  // Regular Login Form
  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeInUp">
      {/* Title - Welcome OCOP-GiaLai */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white" style={{
          fontFamily: 'sans-serif',
          letterSpacing: '1px',
          textShadow: '0 2px 15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 0, 0, 0.5)'
        }}>
          Welcome OCOP-GiaLai
        </h1>
      </div>

      {/* Username Field - Underline Style */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
          <svg className="h-6 w-6 text-white ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }}>
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
          placeholder="User name"
          className="w-full bg-transparent border-0 border-b-2 border-white pl-10 pr-4 py-3 text-white placeholder:text-white/70 focus:border-white focus:outline-none transition-colors"
          style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}
        />
      </div>

      {/* Password Field - Underline Style */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
          <svg className="h-6 w-6 text-white ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }}>
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
          placeholder="........"
          className="w-full bg-transparent border-0 border-b-2 border-white pl-10 pr-4 py-3 text-white placeholder:text-white/70 focus:border-white focus:outline-none transition-colors"
          style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}
        />
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-white text-sm" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
        <div className="flex items-center gap-2">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-5 w-5 rounded border-2 border-white bg-transparent text-white focus:ring-0 focus:ring-offset-0 cursor-pointer appearance-none relative"
            style={{
              backgroundColor: remember ? 'white' : 'transparent',
              backgroundImage: remember ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23e91e63\'%3E%3Cpath d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\'/%3E%3C/svg%3E")' : 'none',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))'
            }}
          />
          <label htmlFor="remember" className="cursor-pointer text-white">
            Remember me
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowOTP(true)}
          className="text-white hover:text-white/90 transition-colors text-sm"
        >
          Forgot Password?
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="animate-fadeIn">
          <div className="text-sm text-red-200 bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-400/30">
            {error}
          </div>
        </div>
      )}

      {/* Login Button - Pink/Magenta */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#e91e63] hover:bg-[#d81b60] text-white font-bold py-3.5 px-6 rounded-lg shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-200"
        style={{ fontFamily: 'sans-serif' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging in...
          </span>
        ) : (
          'Login'
        )}
      </button>

      {/* Divider with "or" - Separate row */}
      <div className="relative my-6">
        {/* Divider Line */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full border-t border-white/30"></div>
        </div>

        {/* "or" Circle in Center */}
        <div className="relative flex justify-center">
          <span className="bg-[#e91e63] text-white text-xs font-semibold rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-10">
            or
          </span>
        </div>
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

      {/* Register Link */}
      <div className="text-center pt-4">
        <p className="text-sm text-white/80" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="text-white font-medium hover:text-white/80 underline transition-colors"
          >
            Register
          </button>
        </p>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 mt-4">
        <p className="text-xs text-white/60" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
          © 2024 OCOP-GiaLai. All rights reserved
        </p>
      </div>
    </form>
  )
}