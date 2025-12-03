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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full name */}
      <div>
        <label className="block text-sm font-semibold text-gray-900">Họ và tên</label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nguyen Van A"
          className="mt-1 w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-900">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="abc@example.com"
          className="mt-1 w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-gray-900">Mật khẩu</label>
        <div className="relative mt-1">
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tạo mật khẩu mạnh"
            className={cn(
              "w-full rounded-lg border-2 px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-900 placeholder:text-gray-400 bg-white",
              strong ? "border-green-500 focus:ring-green-500" : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            )}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
            ?
          </span>
        </div>
        <p className="mt-1 text-xs font-medium text-gray-600">8+ ký tự, 1 số, 1 ký tự đặc biệt</p>
      </div>

      {/* Confirm */}
      <div>
        <label className="block text-sm font-semibold text-gray-900">Xác nhận mật khẩu</label>
        <input
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Nhập lại mật khẩu"
          className={cn(
            "mt-1 w-full rounded-lg border-2 px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-900 placeholder:text-gray-400 bg-white",
            match && confirm ? "border-green-500 focus:ring-green-500" : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          )}
        />
      </div>

      {error && <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={!strong || !match || loading}
        className={cn(
          "w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-2 transition-all disabled:opacity-60",
          strong && match
            ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 active:bg-indigo-800"
            : "bg-gray-400 cursor-not-allowed"
        )}
        >
          {loading ? "Đang tạo tài khoản..." : "Create Account"}
      </button>
    </form>
  )
}