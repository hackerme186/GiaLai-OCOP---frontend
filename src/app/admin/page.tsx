"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getReportSummary, type ReportSummary } from "@/lib/api"
import { getAuthToken, getRoleFromToken } from "@/lib/auth"
import AdminHeader, { type TabType } from "@/components/admin/AdminHeader"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import EnterpriseApprovalTab from "@/components/admin/EnterpriseApprovalTab"
import EnterpriseManagementTab from "@/components/admin/EnterpriseManagementTab"
import OcopApprovalTab from "@/components/admin/OcopApprovalTab"
import CategoryManagementTab from "@/components/admin/CategoryManagementTab"
import ProvinceReportTab from "@/components/admin/ProvinceReportTab"
import ImageManagementTab from "@/components/admin/ImageManagementTab"
import LocationsTab from "@/components/admin/LocationsTab"
import ProducersTab from "@/components/admin/ProducersTab"
import TransactionsTab from "@/components/admin/TransactionsTab"
import UserManagementTab from "@/components/admin/UserManagementTab"
import NewsManagementTab from "@/components/admin/NewsManagementTab"
import HomeManagementTab from "@/components/admin/HomeManagementTab"
import ProductManagementTab from "@/components/admin/ProductManagementTab"

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  useEffect(() => {
    const check = async () => {
      // 1) Prefer role từ JWT để tránh phụ thuộc /me
      const token = getAuthToken()
      if (!token) {
        router.replace("/login")
        return
      }

      const tokenRole = (getRoleFromToken(token) || "").toLowerCase().trim()
      const isAdminFromToken = tokenRole === 'admin' ||
        tokenRole === 'administrator' ||
        tokenRole === 'role_admin' ||
        tokenRole === 'admin_role' ||
        tokenRole === 'sysadmin' ||
        tokenRole.includes('admin')

      if (isAdminFromToken) {
        setAuthorized(true)
        return
      }

      // 2) Fallback: gọi API /me nếu token không chứa role
      try {
        const me = await getCurrentUser()
        const role = (me.role || (me as any).roles || (me as any).userRole)?.toString?.() || ""
        const normRole = role.toLowerCase().trim()
        const isAdmin = normRole === 'admin' ||
          normRole === 'administrator' ||
          normRole === 'role_admin' ||
          normRole === 'admin_role' ||
          normRole === 'sysadmin' ||
          normRole.includes('admin')

        if (!isAdmin) {
          router.replace("/login")
          return
        }
        setAuthorized(true)
      } catch (err) {
        console.warn("Admin authorization check failed:", err)
        router.replace("/login")
      }
    }
    check()
  }, [router])

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="ml-64">
        <div className="p-6">
          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <DashboardTab />
          )}
          {activeTab === 'enterprise-approval' && (
            <EnterpriseApprovalTab />
          )}
          {activeTab === 'enterprise-management' && (
            <EnterpriseManagementTab />
          )}
          {activeTab === 'ocop-approval' && (
            <OcopApprovalTab />
          )}
          {activeTab === 'product-management' && (
            <ProductManagementTab />
          )}
          {activeTab === 'categories' && (
            <CategoryManagementTab />
          )}
          {activeTab === 'images' && (
            <ImageManagementTab />
          )}
          {activeTab === 'news-management' && (
            <NewsManagementTab />
          )}
          {activeTab === 'home-management' && (
            <HomeManagementTab />
          )}
          {activeTab === 'reports' && (
            <ProvinceReportTab />
          )}
          {activeTab === 'locations' && (
            <LocationsTab />
          )}
          {activeTab === 'producers' && (
            <ProducersTab />
          )}
          {activeTab === 'transactions' && (
            <TransactionsTab />
          )}
          {activeTab === 'user-management' && (
            <UserManagementTab />
          )}
        </div>
      </main>
    </div>
  )
}

// Donut Chart Component
function DonutChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

// Pie Chart Component
function PieChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

// Dashboard Tab Component
function DashboardTab() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("Admin")

  useEffect(() => {
    loadDashboard()
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const me = await getCurrentUser()
      setUserName((me.name || me.fullName || me.username || "Admin").toString())
    } catch {
      // Ignore errors
    }
  }

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getReportSummary()
      setSummary(data)
    } catch (err) {
      console.error("Failed to load dashboard:", err)
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu tổng quan")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải dữ liệu tổng quan...</p>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Không thể tải dữ liệu"}</p>
        <button
          onClick={loadDashboard}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    )
  }

  // Format date in Vietnamese
  const getCurrentDate = () => {
    const now = new Date()
    const days = ['Chủ nhật', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const dayName = days[now.getDay()]
    const day = now.getDate()
    const month = months[now.getMonth()]
    const year = now.getFullYear()
    return `${dayName}, ${day} ${month} ${year}`
  }


  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-8 rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Chào mừng trở lại, {userName}!</h1>
          <p className="text-blue-100 text-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Hôm nay là {getCurrentDate()}
          </p>
        </div>
      </div>

      {/* Top Row Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* DOANH NGHIỆP Card - Blue */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">DOANH NGHIỆP</span>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-3">{summary.totalEnterprises}</div>
            <div className="text-sm opacity-90 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-300"></div>
                <span>Hoạt động {summary.totalEnterprises}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span>không hoạt động 0</span>
              </div>
            </div>
          </div>
        </div>

        {/* SẢN PHẨM OCOP Card - Green */}
        <div className="group relative bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">SẢN PHẨM OCOP</span>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold mb-3">Quản lý</div>
            <div className="text-sm opacity-90 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Xem danh sách</span>
            </div>
          </div>
        </div>

        {/* ĐƠN HÀNG Card - Purple */}
        <div className="group relative bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">ĐƠN HÀNG</span>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold mb-3">Quản lý</div>
            <div className="text-sm opacity-90 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Xem đơn hàng</span>
            </div>
          </div>
        </div>

        {/* DANH MỤC Card - Red */}
        <div className="group relative bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">DANH MỤC</span>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold mb-3">Cài đặt</div>
            <div className="text-sm opacity-90 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Cấu hình</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KHÁCH HÀNG Card - Orange */}
        <div className="group relative bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">KHÁCH HÀNG</span>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold mb-3">Người dùng</div>
            <div className="text-sm opacity-90 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Xem</span>
            </div>
          </div>
        </div>

        {/* TIN TỨC Card - Red */}
        <div className="group relative bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">TIN TỨC</span>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold mb-3">Cài đặt</div>
            <div className="text-sm opacity-90 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Cấu hình</span>
            </div>
          </div>
        </div>

        {/* TỔNG SẢN PHẨM Card - Blue */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">TỔNG SẢN PHẨM</span>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-3">{summary.totalProducts}</div>
            <div className="text-sm opacity-90 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-300"></div>
                <span>Đã duyệt {summary.approvedProducts}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-300"></div>
                <span>chờ duyệt {summary.pendingProducts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* GIAO DỊCH Card - Green */}
        <div className="group relative bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">GIAO DỊCH</span>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold mb-3">{summary.totalPayments}</div>
            <div className="text-sm opacity-90 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-300"></div>
                <span>Đã thanh toán {summary.totalPayments}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span>chờ xử lý 0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trạng thái sản phẩm - Donut Chart */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Trạng thái sản phẩm OCOP</h3>
          </div>
          <div className="flex items-center justify-center">
            <DonutChart
              data={[
                { name: 'Đã duyệt', value: summary.approvedProducts || 0, color: '#10b981' },
                { name: 'Chờ duyệt', value: summary.pendingProducts || 0, color: '#f59e0b' },
                { name: 'Bị từ chối', value: summary.rejectedProducts || 0, color: '#ef4444' }
              ]}
            />
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">Đã duyệt</span>
              </div>
              <span className="text-sm font-bold text-green-600">{summary.approvedProducts || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">Chờ duyệt</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">{summary.pendingProducts || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">Bị từ chối</span>
              </div>
              <span className="text-sm font-bold text-red-600">{summary.rejectedProducts || 0}</span>
            </div>
          </div>
        </div>

        {/* Phân loại người dùng - Pie Chart */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Phân loại người dùng</h3>
          </div>
          <div className="flex items-center justify-center">
            <PieChart
              data={[
                { name: 'Khách hàng', value: summary.totalCustomers || 0, color: '#3b82f6' },
                { name: 'Quản trị DN', value: summary.totalEnterpriseAdmins || 0, color: '#8b5cf6' }
              ]}
            />
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">Khách hàng</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{summary.totalCustomers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-purple-500 shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700">Quản trị doanh nghiệp</span>
              </div>
              <span className="text-sm font-bold text-purple-600">{summary.totalEnterpriseAdmins || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
