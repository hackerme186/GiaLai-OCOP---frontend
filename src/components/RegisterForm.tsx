"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export default function RegisterForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const strong =
    password.length >= 8 &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)

  const match = password && password === confirm

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!strong || !match) return
    console.log({ fullName, email, password })
    // TODO: wire-up API call
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-black">Full name</label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
          placeholder="you@example.com"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-black">Password</label>
        <div className="relative mt-1">
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            className={cn(
              "w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none sm:text-sm",
              strong ? "border-green-500 focus:ring-green-500" : "border-gray-300 focus:ring-indigo-500"
            )}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
            ?
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">8+ characters, 1 number, 1 symbol</p>
      </div>

      {/* Confirm */}
      <div>
        <label className="block text-sm font-medium text-black">Confirm password</label>
        <input
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your password"
          className={cn(
            "mt-1 w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none sm:text-sm",
            match && confirm ? "border-green-500 focus:ring-green-500" : "border-gray-300 focus:ring-indigo-500"
          )}
        />
      </div>

      <button
        type="submit"
        disabled={!strong || !match}
        className={cn(
          "w-full rounded-lg px-4 py-2 text-sm font-semibold text-white shadow focus:outline-none focus:ring-2",
          strong && match
            ? "bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500"
            : "bg-gray-300 cursor-not-allowed"
        )}
      >
        Create Account
      </button>
    </form>
  )
}