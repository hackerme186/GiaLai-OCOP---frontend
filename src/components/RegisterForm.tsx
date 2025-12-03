"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { register, login } from "@/lib/api"
import { setAuthToken, setUserProfile } from "@/lib/auth"

export default function RegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strong =
    password.length >= 8 &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)

  const match = password && password === confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!strong || !match) return
    setError(null)
    setLoading(true)
    
    try {
      const normalizedEmail = email.trim().toLowerCase()
      
      // Đăng ký đơn giản - chỉ gửi name, email, password (không có OTP)
      const res = await register({ 
        name: fullName.trim(), 
        email: normalizedEmail, 
        password
      }) as any
      
      // Backend tự động trả về JWT token sau khi đăng ký
      // Backend trả về Token (chữ hoa) nên cần check cả Token và token
      const token = res?.Token || res?.token || res?.data?.Token || res?.data?.token || res?.accessToken || res?.access_token
      
      if (!token) {
        throw new Error("Không nhận được token từ server sau khi đăng ký")
      }
      
      // Lưu token
      setAuthToken(token)
      
      // Lấy thông tin user từ response hoặc gọi /me endpoint
      try {
        const { getCurrentUser } = await import("@/lib/api")
        const userInfo = await getCurrentUser()
        setUserProfile({
          id: userInfo.id,
          name: userInfo.name || fullName.trim(),
          email: userInfo.email || normalizedEmail,
          role: userInfo.role || "Customer",
          createdAt: userInfo.createdAt, // Lưu ngày tạo tài khoản
        })
      } catch (profileErr) {
        // Nếu không lấy được user info, dùng thông tin từ form
        setUserProfile({
          name: fullName.trim(),
          email: normalizedEmail,
          role: "Customer"
        })
      }
      
      // Navigate to home page sau khi đăng ký thành công
      router.replace("/home")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Đăng ký thất bại"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fadeInUp">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white" style={{
          fontFamily: 'sans-serif',
          letterSpacing: '1px',
          textShadow: '0 2px 15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 0, 0, 0.5)'
        }}>
          Create Account
        </h1>
      </div>

      {/* Full name */}
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-2" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
          Họ và tên
        </label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nguyen Van A"
          className="w-full bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-2" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
          Email
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="abc@example.com"
          className="w-full bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-2" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
          Mật khẩu
        </label>
        <div className="relative">
          <input
            required
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tạo mật khẩu mạnh"
            className={cn(
              "w-full rounded-lg border-2 px-4 py-3 pr-10 shadow-sm focus:outline-none focus:ring-2 text-gray-800 placeholder:text-gray-500 bg-white/90 backdrop-blur-sm transition-all",
              strong ? "border-green-500 focus:ring-green-500" : "border-gray-300 focus:border-gray-400 focus:ring-gray-200"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1 text-xs font-medium text-white/70" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
          8+ ký tự, 1 số, 1 ký tự đặc biệt
        </p>
      </div>

      {/* Confirm */}
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-2" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
          Nhập lại mật khẩu
        </label>
        <div className="relative">
          <input
            required
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Nhập lại mật khẩu"
            className={cn(
              "w-full rounded-lg border-2 px-4 py-3 pr-10 shadow-sm focus:outline-none focus:ring-2 text-gray-800 placeholder:text-gray-500 bg-white/90 backdrop-blur-sm transition-all",
              match && confirm ? "border-green-500 focus:ring-green-500" : "border-gray-300 focus:border-gray-400 focus:ring-gray-200"
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showConfirm ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="animate-fadeIn">
          <div className="text-sm text-red-200 bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-400/30">
            {error}
          </div>
        </div>
      )}

      {/* Create Account Button */}
      <button
        type="submit"
        disabled={!strong || !match || loading}
        className={cn(
          "w-full rounded-lg px-4 py-3.5 text-base font-bold text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
          strong && match
            ? "bg-gray-800 hover:bg-gray-700 focus:ring-gray-300"
            : "bg-gray-500 cursor-not-allowed"
        )}
        style={{ fontFamily: 'sans-serif' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang tạo tài khoản...
          </span>
        ) : (
          'Create Account'
        )}
      </button>

      {/* Login Link */}
      <div className="text-center pt-4">
        <p className="text-sm text-white/80" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-white font-medium hover:text-white/80 underline transition-colors"
          >
            Login
          </button>
        </p>
      </div>
    </form>
  )
}