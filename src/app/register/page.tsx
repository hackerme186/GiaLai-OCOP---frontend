"use client"
import { useState } from "react"
import AuthCard from "@/components/AuthCard"
import LoginForm from "@/components/LoginForm"
import RegisterForm from "@/components/RegisterForm"
import SocialLogin from "@/components/SocialLogin"

export default function HomePage() {
  const [mode, setMode] = useState<"login" | "register">("register") // default to register now

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <AuthCard>
        <h2 className="text-center text-2xl font-bold text-gray-900">
          {mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </h2>

        {mode === "login" ? <LoginForm /> : <RegisterForm />}

        <SocialLogin />

        <p className="mt-6 text-center text-sm text-gray-600">
          {mode === "login" ? "Bạn chưa có tài khoản? " : "Bạn đã có tài khoản? "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {mode === "login" ? "Tạo tài khoản" : "Đăng nhập"}
          </button>
        </p>

        <p className="mt-4 text-center text-xs text-gray-500">
          Bằng việc tạo tài khoản bạn đồng ý với{" "}
          <a href="#" className="text-indigo-600 hover:underline">
            Điều khoản và điều kiện
          </a>{" "}
          and{" "}
          <a href="#" className="text-indigo-600 hover:underline">
            Chính sách bảo mật
          </a>
          .
        </p>
      </AuthCard>
    </main>
  )
}