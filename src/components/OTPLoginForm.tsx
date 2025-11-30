"use client"
import { useState, useEffect } from "react"
import { sendOtp, loginWithOtp, verifyOtp } from "@/lib/api"
import { setAuthToken, getRoleFromToken, setUserProfile } from "@/lib/auth"
import { getCurrentUser } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function OTPLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [otpSent, setOtpSent] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        throw new Error("Email không đúng định dạng")
      }

      console.log("📧 [OTP] Đang gửi OTP đến:", email.trim())
      const response = await sendOtp({ email: email.trim(), purpose: "Login" })
      console.log("✅ [OTP] Response từ backend:", response)
      
      // Trong development mode, backend có thể trả về OTP trong response
      if (response.otpCode && typeof window !== "undefined") {
        console.log("🔑 [OTP] Development OTP Code:", response.otpCode)
        alert(`🔑 MÃ OTP (Development): ${response.otpCode}\n\nLưu ý: Trong production, mã OTP sẽ được gửi qua email.`)
      } else {
        console.log("📬 [OTP] OTP đã được gửi qua email (không hiển thị trong response vì lý do bảo mật)")
      }

      setOtpSent(true)
      setCountdown(60) // 60 giây countdown
      setStep("otp")
      
      // Hiển thị thông báo thành công
      if (typeof window !== "undefined") {
        console.log("✅ [OTP] Đã chuyển sang bước nhập OTP")
      }
    } catch (err) {
      console.error("❌ [OTP] Lỗi khi gửi OTP:", err)
      const errorMessage = err instanceof Error ? err.message : "Không thể gửi OTP. Vui lòng thử lại."
      
      // Kiểm tra các lỗi phổ biến
      if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
        setError("Backend chưa hỗ trợ gửi OTP. Vui lòng liên hệ quản trị viên.")
      } else if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
        setError("Lỗi server khi gửi email. Vui lòng kiểm tra cấu hình email service trên backend.")
      } else if (errorMessage.includes("email") || errorMessage.includes("Email")) {
        setError(errorMessage)
      } else {
        setError(`Không thể gửi OTP: ${errorMessage}\n\nVui lòng kiểm tra:\n- Email có đúng không?\n- Email có trong hệ thống không?\n- Kiểm tra thư mục Spam/Junk`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return

    setError(null)
    setLoading(true)

    try {
      await sendOtp({ email: email.trim(), purpose: "Login" })
      setCountdown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lại OTP. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
        throw new Error("Mã OTP phải có 6 chữ số")
      }

      const res = await loginWithOtp({
        email: email.trim(),
        otpCode: otpCode.trim(),
      }) as any

      // Extract token
      const token = res?.Token || res?.token || res?.data?.Token || res?.data?.token || res?.accessToken || res?.access_token

      if (!token) {
        throw new Error("Không nhận được token từ server")
      }

      // Save token
      setAuthToken(token)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Determine role
      const extractRole = (obj: any): string => {
        if (!obj) return ""
        const u = obj.user || obj.data || obj
        const direct = u.role || u.userRole || u.authorities || u.permission || u.permissions
        if (Array.isArray(direct)) return (direct[0] || "").toString()
        if (typeof direct === 'string') return direct
        if (Array.isArray(u.roles)) return (u.roles[0] || "").toString()
        return ""
      }

      let role = getRoleFromToken(token) || extractRole(res)

      if (!role || role.trim() === "") {
        try {
          const me = await getCurrentUser()
          role = extractRole(me) || (me.role || (me as any).roles)?.toString?.() || ""
        } catch (err) {
          console.warn("Could not fetch user info:", err)
        }
      }

      const norm = role.toString().toLowerCase().trim()
      const isSystemAdmin = norm === 'systemadmin' || norm === 'sysadmin'
      const isEnterpriseAdmin = norm === 'enterpriseadmin'
      const isAdmin = isSystemAdmin || norm === 'admin' || norm === 'administrator'

      // Load user profile
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
      setError(err instanceof Error ? err.message : "Mã OTP không đúng hoặc đã hết hạn")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep("email")
    setOtpCode("")
    setOtpSent(false)
    setCountdown(0)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-4xl font-bold text-center mb-8" style={{ 
        color: '#8B4513',
        fontFamily: 'serif',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        Đăng nhập bằng OTP
      </h1>

      {/* Step 1: Enter Email */}
      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl border-2 border-white/50 bg-white/20 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/70 focus:border-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-300 bg-red-500/20 rounded-lg px-3 py-2 border border-red-400/30">
              {error}
            </p>
          )}

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
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>
        </form>
      )}

      {/* Step 2: Enter OTP */}
      {step === "otp" && (
        <form onSubmit={handleVerifyAndLogin} className="space-y-6">
          {/* Email Display */}
          <div className="text-center">
            <p className="text-sm text-white/90 mb-2">
              Mã OTP đã được gửi đến
            </p>
            <p className="text-white font-semibold">
              {email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}
            </p>
            <div className="mt-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg text-left">
              <p className="text-xs text-white/90 mb-1">
                <strong>💡 Lưu ý:</strong>
              </p>
              <ul className="text-xs text-white/80 space-y-1 list-disc list-inside">
                <li>Kiểm tra hộp thư đến và thư mục <strong>Spam/Junk</strong></li>
                <li>Mã OTP có hiệu lực trong <strong>10 phút</strong></li>
                <li>Nếu không nhận được, vui lòng thử lại sau {countdown > 0 ? `${countdown}s` : "1 phút"}</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={handleBackToEmail}
              className="text-sm text-white/80 hover:text-white underline mt-2"
            >
              Thay đổi email
            </button>
          </div>

          {/* OTP Input */}
          <div>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                setOtpCode(value)
              }}
              placeholder="Nhập mã OTP (6 chữ số)"
              className="w-full rounded-2xl border-2 border-white/50 bg-white/20 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/70 focus:border-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-center text-2xl tracking-widest font-mono"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-300 bg-red-500/20 rounded-lg px-3 py-2 border border-red-400/30">
              {error}
            </p>
          )}

          {/* Resend OTP */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-white/70">
                Gửi lại sau: <span className="font-semibold">{countdown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-sm text-white/90 hover:text-white underline"
              >
                Gửi lại mã OTP
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full rounded-2xl bg-white px-6 py-3 text-lg font-bold shadow-lg hover:bg-white/95 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            style={{ 
              color: '#8B4513',
              fontFamily: 'serif',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>
      )}
    </div>
  )
}

