"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { register } from "@/lib/api"
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
      const res = await register({ fullName: fullName.trim(), email: normalizedEmail, password }) as any
      
      // Set authentication token (similar to login flow)
      if (res?.token) {
        setAuthToken(res.token)
      } else {
        setAuthToken("1") // Default token for authenticated user
      }
      
      // Set user profile with the registered user's information
      setUserProfile({
        name: fullName.trim(),
        avatarUrl: undefined
      })
      
      // Navigate to home page after successful registration
      router.replace("/home")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-black">Họ và tên</label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nguyen Van A"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-black">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="abc@example.com"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-black">Mật khẩu</label>
        <div className="relative mt-1">
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tạo mật khẩu mạnh"
            className={cn(
              "w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none sm:text-sm text-black",
              strong ? "border-green-500 focus:ring-green-500" : "border-gray-300 focus:ring-indigo-500"
            )}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
            ?
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">8+ ký tự, 1 số, 1 ký tự đặc biệt</p>
      </div>

      {/* Confirm */}
      <div>
        <label className="block text-sm font-medium text-black">Xác nhận mật khẩu</label>
        <input
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Nhập lại mật khẩu"
          className={cn(
            "mt-1 w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none sm:text-sm text-black",
            match && confirm ? "border-green-500 focus:ring-green-500" : "border-gray-300 focus:ring-indigo-500"
          )}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!strong || !match || loading}
        className={cn(
          "w-full rounded-lg px-4 py-2 text-sm font-semibold text-white shadow focus:outline-none focus:ring-2 disabled:opacity-60",
          strong && match
            ? "bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500"
            : "bg-gray-300 cursor-not-allowed"
        )}
        >
          {loading ? "Đang tạo tài khoản..." : "Create Account"}
      </button>
    </form>
  )
}