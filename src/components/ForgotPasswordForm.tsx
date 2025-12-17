"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { forgotPassword, resetPassword } from "@/lib/api"

const OTP_EXPIRY_TIME = 10 * 60 * 1000 // 10 minutes in milliseconds

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  
  // Reset password form states
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  
  // OTP timer states
  const [timeRemaining, setTimeRemaining] = useState(OTP_EXPIRY_TIME)
  const [otpExpired, setOtpExpired] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const [timerKey, setTimerKey] = useState(0) // Key to force timer restart

  // Start timer when OTP is sent
  useEffect(() => {
    if (otpSent && !otpExpired) {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      startTimeRef.current = Date.now()
      
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current
          const remaining = OTP_EXPIRY_TIME - elapsed
          
          if (remaining <= 0) {
            setTimeRemaining(0)
            setOtpExpired(true)
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
          } else {
            setTimeRemaining(remaining)
          }
        }
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [otpSent, otpExpired, timerKey])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      await forgotPassword({ email: email.trim().toLowerCase() })
      setOtpSent(true)
      setOtpExpired(false)
      setTimeRemaining(OTP_EXPIRY_TIME)
      startTimeRef.current = Date.now()
      setTimerKey(prev => prev + 1) // Force timer start
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể gửi email OTP. Vui lòng thử lại."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    setLoading(true)
    setOtpCode("")
    setNewPassword("")
    setConfirmPassword("")
    setResetError(null)
    
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    try {
      await forgotPassword({ email: email.trim().toLowerCase() })
      setOtpExpired(false)
      setTimeRemaining(OTP_EXPIRY_TIME)
      startTimeRef.current = Date.now()
      // Force timer restart by updating key
      setTimerKey(prev => prev + 1)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể gửi lại mã OTP. Vui lòng thử lại."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError(null)

    // Validation
    if (!newPassword || !confirmPassword || !otpCode) {
      setResetError("Vui lòng điền đầy đủ thông tin.")
      return
    }

    if (newPassword !== confirmPassword) {
      setResetError("Mật khẩu xác nhận không khớp.")
      return
    }

    if (otpExpired) {
      setResetError("Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP mới.")
      return
    }

    setResetLoading(true)
    
    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        otpCode: otpCode.trim(),
        newPassword: newPassword,
        confirmNewPassword: confirmPassword,
      })
      setResetSuccess(true)
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể đặt lại mật khẩu. Vui lòng thử lại."
      setResetError(errorMessage)
    } finally {
      setResetLoading(false)
    }
  }

  // Success screen after password reset
  if (resetSuccess) {
    return (
      <div className="w-full">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Đặt lại mật khẩu thành công!</h2>
            <p className="text-white/90 text-sm">
              Mật khẩu của bạn đã được đặt lại thành công.
            </p>
            <p className="text-white/80 text-sm mt-2">
              Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold transition-colors"
              style={{
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
              }}
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Reset password form (after OTP is sent)
  if (otpSent) {
    return (
      <div className="w-full">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
          Đặt lại mật khẩu
        </h1>
        <p className="text-center text-white/80 mb-2 text-sm">
          Vui lòng nhập mã OTP và mật khẩu mới
        </p>

        {/* OTP Expiry Warning */}
        <div className="mb-4 rounded-lg bg-yellow-500/20 border border-yellow-400/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-yellow-200">
              ⏰ Mã OTP đã được gửi thông qua email của bạn, hãy kiểm tra hộp thư đến và thư mục Spam. <br /> 
              Lưu ý: OTP Chỉ hiệu lực trong vòng 10 phút
            </p>
            {!otpExpired && (
              <p className="text-sm font-semibold text-yellow-200">
                {formatTime(timeRemaining)}
              </p>
            )}
          </div>
          {otpExpired && (
            <p className="text-sm text-yellow-200 mt-2">
              Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP mới.
            </p>
          )}
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* OTP Code Field */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="otpCode"
              name="otpCode"
              type="text"
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Nhập mã OTP"
              maxLength={6}
              disabled={otpExpired || resetLoading}
              className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>

          {/* New Password Field */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới"
              disabled={otpExpired || resetLoading}
              className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>

          {/* Confirm Password Field */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
              disabled={otpExpired || resetLoading}
              className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>

          {/* Error Message */}
          {resetError && (
            <div className="rounded-lg bg-red-500/20 border border-red-400/30 px-4 py-3">
              <p className="text-sm text-red-200">{resetError}</p>
            </div>
          )}

          {/* Resend OTP Button (if expired) */}
          {otpExpired && (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full rounded-lg bg-yellow-500 hover:bg-yellow-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
            >
              {loading ? "Đang gửi..." : "Gửi lại mã OTP"}
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={resetLoading || otpExpired || !otpCode || !newPassword || !confirmPassword}
            className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
            style={{
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
            }}
          >
            {resetLoading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-white/90 hover:text-white text-sm underline transition-colors"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
        Quên mật khẩu?
      </h1>
      <p className="text-center text-white/80 mb-8 text-sm">
        Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu
      </p>

      <form onSubmit={handleSendOtp} className="space-y-5">
        {/* Email Field */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
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
            placeholder="Nhập email của bạn"
            className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
            style={{
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-400/30 px-4 py-3">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
          style={{
            boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
          }}
        >
          {loading ? "Đang gửi..." : "Gửi mã OTP"}
        </button>
      </form>

      {/* Back to Login Link */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-white/90 hover:text-white text-sm underline transition-colors"
        >
          Quay lại đăng nhập
        </Link>
      </div>

      {/* Copyright */}
      <p className="text-center text-xs text-white/70 mt-8">
        © 2024 OCOP-GiaLai. Bảo lưu mọi quyền
      </p>
    </div>
  )
}

