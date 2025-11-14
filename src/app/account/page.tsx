"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getUserProfile, isLoggedIn } from "@/lib/auth"
import { getCurrentUser, getEnterprise, type Enterprise, type User } from "@/lib/api"
import Header from "@/components/layout/Header"
import { useRouter } from "next/navigation"

export default function AccountPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      } catch {
        const profile = getUserProfile() || {}
        setUser({
          id: profile.id ?? 0,
          name: profile.name || "",
          email: profile.email || "",
          role: profile.role || "Customer",
          enterpriseId: profile.enterpriseId ?? undefined,
          createdAt: profile.createdAt,
        } as User)
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

  if (!ready) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <Header />
      <main>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Hồ sơ người dùng</h1>
            <Link
              href="/orders"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition"
            >
              Đơn hàng của tôi
            </Link>
          </div>
          <div className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <section className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Họ và tên" value={user?.name} />
                <InfoField label="Email" value={user?.email} />
                <InfoField label="Vai trò" value={roleLabel} badge />
                <InfoField label="Ngày tạo" value={formattedCreatedAt || "(chưa xác định)"} />
              </div>
            </section>

            <section className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Bảo mật</h2>
              <p className="text-sm text-gray-600">
                Tài khoản của bạn được bảo vệ bởi xác thực JWT. Không chia sẻ token cho người khác.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  label="Trạng thái đăng nhập"
                  value="Đang hoạt động"
                  badge
                  badgeColor="bg-green-100 text-green-700"
                />
                <InfoField label="Loại xác thực" value="Email & Mật khẩu" />
              </div>
            </section>

            {enterprise && (
              <section className="bg-white rounded-lg shadow p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Thông tin doanh nghiệp</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Tên doanh nghiệp" value={enterprise.name} />
                  <InfoField label="Mã doanh nghiệp" value={`#${enterprise.id}`} />
                  <InfoField label="Lĩnh vực kinh doanh" value={enterprise.businessField} />
                  <InfoField label="Số điện thoại" value={enterprise.phoneNumber} />
                  <InfoField label="Email liên hệ" value={enterprise.emailContact} />
                  <InfoField label="Website" value={enterprise.website} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Địa chỉ" value={enterprise.address} />
                  <InfoField
                    label="Khu vực"
                    value={[enterprise.ward, enterprise.district, enterprise.province].filter(Boolean).join(", ")}
                  />
                </div>
                {enterprise.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <p className="text-gray-900">{enterprise.description}</p>
                  </div>
                )}
              </section>
            )}

            {!enterprise && (
              <section className="bg-blue-50 border border-blue-100 rounded-lg p-5 text-blue-900 text-sm">
                <p>
                  Tài khoản của bạn chưa liên kết với doanh nghiệp OCOP. Nếu bạn là Enterprise Admin,
                  vui lòng hoàn tất hồ sơ hoặc liên hệ quản trị viên để được duyệt.
                </p>
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
}

function InfoField({ label, value, badge, badgeColor }: InfoFieldProps) {
  const display = value && value !== "" ? value : "(chưa cập nhật)"
  if (badge) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            badgeColor || "bg-indigo-100 text-indigo-700"
          }`}
        >
          {display}
        </span>
      </div>
    )
  }
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="text-gray-900 font-medium">{display}</div>
    </div>
  )
}


