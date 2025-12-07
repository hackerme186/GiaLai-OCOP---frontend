"use client"

import { useState } from "react"
import Link from "next/link"
import { forgotPassword } from "@/lib/api"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      await forgotPassword({ email: email.trim().toLowerCase() })
      setSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Email đã được gửi!</h2>
            <p className="text-white/90 text-sm">
              Chúng tôi đã gửi link đặt lại mật khẩu đến email <strong>{email}</strong>
            </p>
            <p className="text-white/80 text-sm mt-2">
              Vui lòng kiểm tra hộp thư và làm theo hướng dẫn trong email.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/login"
              className="inline-block text-white font-medium hover:text-white/80 underline transition-colors"
            >
              Quay lại đăng nhập
            </Link>
          </div>
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
        Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
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
          {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
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
        © 2024 OCOP-GiaLai. All rights reserved
      </p>
    </div>
  )
}

