"use client"
import { useState } from "react"
import Image from "next/image"
import AuthCard from "@/components/AuthCard"
import LoginForm from "@/components/LoginForm"
import RegisterForm from "@/components/RegisterForm"
import SocialLogin from "@/components/SocialLogin"

export default function HomePage() {
  const [mode, setMode] = useState<"login" | "register">("login")

  return (
    <main className="min-h-screen grid lg:grid-cols-3 grid-rows-2 lg:grid-rows-1 bg-gray-50">
      {/* ẢNH: chiếm 2/3, căn lề phải */}
      <div className="relative row-span-1 lg:col-span-2 h-64 lg:h-full overflow-hidden">
        <Image
          src="/hero.jpg" // ← đặt ảnh thật vào public
          alt="Hero"
          fill
          priority
          className="object-cover object-right" /* ← pin right */
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* FORM: chiếm 1/3 */}
      <div className="row-span-1 lg:col-span-1 flex items-center justify-center px-4 py-10">
        <AuthCard>
          <h2 className="text-center text-2xl font-bold text-gray-900">
            {mode === "login" ? "Login" : "Register"}
          </h2>

          {mode === "login" ? <LoginForm /> : <RegisterForm />}

          <SocialLogin />

          <p className="mt-6 text-center text-sm text-gray-600">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>

          <p className="mt-4 text-center text-xs text-gray-500">
            By continuing you agree to our{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </AuthCard>
      </div>
    </main>
  )
}