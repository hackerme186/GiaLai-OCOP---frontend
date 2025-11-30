"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/layout/AuthLayout"
import LoginForm from "@/components/LoginForm"
import OTPLoginForm from "@/components/OTPLoginForm"

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password")

  return (
    <AuthLayout
      title="Login"
      subtitle=""
      linkText=""
      linkAction={() => router.push('/register')}
    >
      <div className="space-y-6">
        {/* Login Method Toggle */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setLoginMethod("password")}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              loginMethod === "password"
                ? "bg-white text-[#8B4513] shadow-lg"
                : "text-white/70 hover:text-white"
            }`}
          >
            Mật khẩu
          </button>
          <button
            onClick={() => setLoginMethod("otp")}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              loginMethod === "otp"
                ? "bg-white text-[#8B4513] shadow-lg"
                : "text-white/70 hover:text-white"
            }`}
          >
            OTP
          </button>
        </div>

        {/* Login Form */}
        {loginMethod === "password" ? <LoginForm /> : <OTPLoginForm />}
      </div>
    </AuthLayout>
  )
}