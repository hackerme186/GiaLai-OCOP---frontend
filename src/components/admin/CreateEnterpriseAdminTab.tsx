"use client"

import { useState, useEffect } from "react"
import {
  createEnterpriseAdmin,
  getEnterprises,
  type Enterprise,
  type CreateEnterpriseAdminDto,
} from "@/lib/api"

export default function CreateEnterpriseAdminTab() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)

  useEffect(() => {
    loadEnterprises()
  }, [])

  const loadEnterprises = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getEnterprises()
      setEnterprises(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách doanh nghiệp")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhoneNumber("")
    setPassword("")
    setConfirmPassword("")
    setEnterpriseId(null)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Validation
      if (!name.trim()) {
        throw new Error("Tên không được để trống")
      }

      if (!email.trim()) {
        throw new Error("Email không được để trống")
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        throw new Error("Email không đúng định dạng")
      }

      if (!password) {
        throw new Error("Mật khẩu không được để trống")
      }

      if (password.length < 6) {
        throw new Error("Mật khẩu phải có ít nhất 6 ký tự")
      }

      if (password !== confirmPassword) {
        throw new Error("Mật khẩu xác nhận không khớp")
      }

      if (!enterpriseId) {
        throw new Error("Vui lòng chọn doanh nghiệp")
      }

      const payload: CreateEnterpriseAdminDto = {
        name: name.trim(),
        email: email.trim(),
        password: password,
        enterpriseId: enterpriseId,
      }

      await createEnterpriseAdmin(payload)
      setSuccess("Tạo tài khoản Enterprise Admin thành công!")
      resetForm()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo tài khoản")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Đang tải danh sách doanh nghiệp...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tạo tài khoản Enterprise Admin</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tạo tài khoản quản trị cho doanh nghiệp trong hệ thống
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đầy đủ *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0123456789"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doanh nghiệp *
              </label>
              <select
                required
                value={enterpriseId || ""}
                onChange={(e) => setEnterpriseId(parseInt(e.target.value) || null)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              >
                <option value="">Chọn doanh nghiệp</option>
                {enterprises.map((enterprise) => (
                  <option key={enterprise.id} value={enterprise.id}>
                    {enterprise.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Đặt lại
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

