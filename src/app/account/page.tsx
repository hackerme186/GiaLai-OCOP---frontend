"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getUserProfile, isLoggedIn } from "@/lib/auth"
import { getCurrentUser, getEnterprise, updateCurrentUser, type Enterprise, type User } from "@/lib/api"
import Header from "@/components/layout/Header"
import { useRouter } from "next/navigation"
import { getCurrentAddress } from "@/lib/geolocation"

export default function AccountPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [shippingAddress, setShippingAddress] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    const init = async () => {
      const ok = await isLoggedIn()
      if (!ok) {
        router.replace("/login")
        return
      }
      // Prefer fetching from backend
      try {
        const me = await getCurrentUser()
        setUser(me)
        setShippingAddress(me.shippingAddress || "")
        setName(me.name || "")
        setEmail(me.email || "")
      } catch {
        const profile = getUserProfile() || {}
        const userData = {
          id: profile.id ?? 0,
          name: profile.name || "",
          email: profile.email || "",
          role: profile.role || "Customer",
          enterpriseId: profile.enterpriseId ?? undefined,
          createdAt: profile.createdAt,
        } as User
        setUser(userData)
        setShippingAddress("")
        setName(userData.name || "")
        setEmail(userData.email || "")
      } finally {
        setReady(true)
      }
    }
    init()
  }, [router])

  useEffect(() => {
    const loadEnterprise = async () => {
      if (!user?.enterpriseId) {
        setEnterprise(null)
        return
      }
      try {
        const detail = await getEnterprise(user.enterpriseId)
        setEnterprise(detail)
      } catch (err) {
        console.warn("Không thể tải thông tin doanh nghiệp:", err)
        setEnterprise(null)
      }
    }
    loadEnterprise()
  }, [user?.enterpriseId])

  const formattedCreatedAt = useMemo(() => {
    if (!user?.createdAt) return null
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(user.createdAt))
    } catch {
      return user.createdAt
    }
  }, [user?.createdAt])

  const roleLabel = useMemo(() => {
    switch ((user?.role || "").toLowerCase()) {
      case "systemadmin":
        return "Quản trị hệ thống"
      case "enterpriseadmin":
        return "Quản trị doanh nghiệp"
      case "customer":
        return "Khách hàng"
      default:
        return user?.role || "Không xác định"
    }
  }, [user?.role])

  const handleGetCurrentLocation = async () => {
    setLoadingAddress(true)
    setError(null)
    try {
      const addressResult = await getCurrentAddress()
      setShippingAddress(addressResult.address)
      setSuccess("Đã lấy địa chỉ từ GPS thành công!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lấy địa chỉ từ GPS")
    } finally {
      setLoadingAddress(false)
    }
  }

  const handleSaveAddress = async () => {
    if (!shippingAddress.trim()) {
      setError("Vui lòng nhập địa chỉ giao hàng")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updatedUser = await updateCurrentUser({ shippingAddress: shippingAddress.trim() })
      setUser(updatedUser)
      setIsEditingAddress(false)
      setSuccess("Đã cập nhật địa chỉ giao hàng thành công!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật địa chỉ giao hàng"
      
      // Check if it's a 403 or 404 error (endpoint might not exist or permission denied)
      if (errorMessage.includes("403") || errorMessage.includes("404")) {
        setError("Backend chưa hỗ trợ cập nhật địa chỉ giao hàng. Vui lòng liên hệ quản trị viên.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên")
      return
    }

    setSavingProfile(true)
    setError(null)
    setSuccess(null)

    try {
      const updatedUser = await updateCurrentUser({ name: name.trim() })
      setUser(updatedUser)
      setIsEditingProfile(false)
      setSuccess("Đã cập nhật thông tin hồ sơ thành công!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật thông tin hồ sơ"
      setError(errorMessage)
    } finally {
      setSavingProfile(false)
    }
  }

  if (!ready) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Đang tải thông tin tài khoản...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50" suppressHydrationWarning>
      <Header />
      <main>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header Section with Gradient */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Hồ sơ người dùng</h1>
                  <p className="text-sm text-gray-500 mt-1">Quản lý thông tin tài khoản của bạn</p>
                </div>
              </div>
              <Link
                href="/orders"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Đơn hàng của tôi
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 px-5 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-700">{success}</p>
                </div>
              </div>
            )}

            {/* Basic Information Section */}
            <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Thông tin cơ bản</h2>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-white/20 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {isEditingProfile ? (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập họ và tên"
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all bg-gray-50"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-500 font-medium bg-gray-100 cursor-not-allowed"
                      />
                      <p className="mt-2 text-xs text-gray-500">Email không thể thay đổi</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile || !name.trim()}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        {savingProfile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Lưu thông tin</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfile(false)
                          setName(user?.name || "")
                          setError(null)
                        }}
                        disabled={savingProfile}
                        className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField label="Họ và tên" value={user?.name} icon="user" />
                    <InfoField label="Email" value={user?.email} icon="email" />
                    <InfoField label="Vai trò" value={roleLabel} badge icon="role" />
                    <InfoField label="Ngày tạo" value={formattedCreatedAt || "(chưa xác định)"} icon="calendar" />
                  </div>
                )}
              </div>
            </section>

            {/* Shipping Address Section */}
            <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Địa chỉ giao hàng</h2>
                  </div>
                  {!isEditingAddress && (
                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-white/20 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {isEditingAddress ? (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="shippingAddress" className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Địa chỉ giao hàng <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          id="shippingAddress"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Nhập địa chỉ giao hàng đầy đủ (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                          rows={4}
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-36 text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all resize-none bg-gray-50"
                          required
                        />
                        <div className="absolute bottom-3 right-3">
                          <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            disabled={loadingAddress}
                            className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-white border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                          >
                            {loadingAddress ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent"></div>
                                <span>Đang tải...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Lấy từ GPS</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Bấm "Lấy từ GPS" để tự động điền địa chỉ từ vị trí hiện tại của bạn
                      </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveAddress}
                        disabled={saving || !shippingAddress.trim()}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Lưu địa chỉ</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingAddress(false)
                          setShippingAddress(user?.shippingAddress || "")
                          setError(null)
                        }}
                        disabled={saving}
                        className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-100">
                    <InfoField 
                      label="Địa chỉ giao hàng" 
                      value={user?.shippingAddress || "(chưa cập nhật)"}
                      icon="location"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Security Section */}
            <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">Bảo mật</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-green-50 border-2 border-green-100 rounded-xl p-4">
                  <p className="text-sm text-green-800 font-medium flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Tài khoản của bạn được bảo vệ bởi xác thực JWT. Không chia sẻ token cho người khác.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField
                    label="Trạng thái đăng nhập"
                    value="Đang hoạt động"
                    badge
                    badgeColor="bg-green-100 text-green-700"
                    icon="check"
                  />
                  <InfoField label="Loại xác thực" value="Email & Mật khẩu" icon="key" />
                </div>
              </div>
            </section>

            {/* Enterprise Information Section */}
            {enterprise && (
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Thông tin doanh nghiệp</h2>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InfoField label="Tên doanh nghiệp" value={enterprise.name} icon="building" />
                    <InfoField label="Mã doanh nghiệp" value={`#${enterprise.id}`} icon="id" />
                    <InfoField label="Lĩnh vực kinh doanh" value={enterprise.businessField} icon="briefcase" />
                    <InfoField label="Số điện thoại" value={enterprise.phoneNumber} icon="phone" />
                    <InfoField label="Email liên hệ" value={enterprise.emailContact} icon="email" />
                    <InfoField label="Website" value={enterprise.website} icon="globe" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InfoField label="Địa chỉ" value={enterprise.address} icon="location" />
                    <InfoField
                      label="Khu vực"
                      value={[enterprise.ward, enterprise.district, enterprise.province].filter(Boolean).join(", ")}
                      icon="map"
                    />
                  </div>
                  {enterprise.description && (
                    <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Mô tả
                      </label>
                      <p className="text-gray-700 leading-relaxed">{enterprise.description}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* No Enterprise Message */}
            {!enterprise && (
              <section className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-blue-900 mb-2">Chưa liên kết doanh nghiệp</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Tài khoản của bạn chưa liên kết với doanh nghiệp OCOP. Nếu bạn là Enterprise Admin,
                      vui lòng hoàn tất hồ sơ hoặc liên hệ quản trị viên để được duyệt.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

interface InfoFieldProps {
  label: string
  value?: string | number | null
  badge?: boolean
  badgeColor?: string
  icon?: "user" | "email" | "role" | "calendar" | "location" | "check" | "key" | "building" | "id" | "briefcase" | "phone" | "globe" | "map"
}

function InfoField({ label, value, badge, badgeColor, icon }: InfoFieldProps) {
  const display = value && value !== "" ? value : "(chưa cập nhật)"
  
  const iconMap = {
    user: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    email: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    role: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    calendar: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    location: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    check: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    key: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    building: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    id: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
    briefcase: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    phone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    globe: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    map: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  }
  
  if (badge) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          {icon && <span className="text-indigo-600">{iconMap[icon]}</span>}
          {label}
        </label>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
            badgeColor || "bg-indigo-100 text-indigo-700"
          }`}
        >
          {display}
        </span>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
        {icon && <span className="text-gray-400">{iconMap[icon]}</span>}
        {label}
      </label>
      <div className="text-base font-semibold text-gray-900 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
        {display}
      </div>
    </div>
  )
}


