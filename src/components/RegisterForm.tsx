"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { register } from "@/lib/api"
import { setAuthToken, setUserProfile } from "@/lib/auth"
import { getRegisterError } from "@/lib/errorHandler"

export default function RegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState("Nguyen Van A")
  const [email, setEmail] = useState("admin@system.com")
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
          createdAt: userInfo.createdAt,
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
      const errorMessage = getRegisterError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
            Họ và tên
          </label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyen Van A"
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@system.com"
            className="w-full rounded-lg border-2 border-gray-300 bg-blue-50/50 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 placeholder:text-gray-400 transition-all"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tạo mật khẩu mạnh"
              className={cn(
                "w-full rounded-lg border-2 px-4 py-3 pr-10 shadow-sm focus:outline-none focus:ring-2 text-gray-900 placeholder:text-gray-400 transition-all bg-blue-50/50",
                strong ? "border-green-500 focus:border-green-500 focus:ring-green-500/20" : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <span className="text-sm font-medium">?</span>
            </button>
          </div>
          <p className="mt-1.5 text-xs font-medium text-gray-500">
            8+ ký tự, 1 số, 1 ký tự đặc biệt
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-2">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <input
              id="confirm"
              required
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className={cn(
                "w-full rounded-lg border-2 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 text-gray-900 placeholder:text-gray-400 transition-all bg-white",
                match && confirm ? "border-green-500 focus:border-green-500 focus:ring-green-500/20" : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <span className="text-sm font-medium">?</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        )}

        {/* Create Account Button */}
        <button
          type="submit"
          disabled={!strong || !match || loading}
          className={cn(
            "w-full rounded-lg px-4 py-3.5 text-base font-semibold shadow-lg focus:outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed",
            strong && match
              ? "bg-gray-300 hover:bg-gray-400 text-gray-800 focus:ring-gray-500/50 active:bg-gray-500"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          )}
        >
          {loading ? "Đang tạo tài khoản..." : "Create Account"}
        </button>
      </form>

      {/* Login Link */}
      <p className="text-center text-sm text-white/90 mt-6">
        Bạn đã có tài khoản?{" "}
        <Link
          href="/login"
          className="text-white font-medium hover:text-white/80 underline transition-colors"
        >
          Đăng nhập
        </Link>
      </p>

      {/* Copyright */}
      <p className="text-center text-xs text-white/70 mt-8">
        © 2024 OCOP-GiaLai. All rights reserved
      </p>
    </div>
  )
}
