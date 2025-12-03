"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Footer from "@/components/layout/Footer"
import { getCurrentUser, getReportSummary, type ReportSummary } from "@/lib/api"
import { getAuthToken, getRoleFromToken } from "@/lib/auth"
import AdminHeader, { type TabType } from "@/components/admin/AdminHeader"
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
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
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
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Dashboard Tab Component
function DashboardTab() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

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

  const statsCards = [
    {
      label: "Tổng doanh nghiệp",
      value: summary.totalEnterprises,
      icon: "🏢",
      bgClass: "from-blue-50 to-blue-100",
      borderClass: "border-blue-200",
      textClass: "text-blue-600",
      valueClass: "text-blue-900",
      description: "Doanh nghiệp đã đăng ký"
    },
    {
      label: "Tổng sản phẩm OCOP",
      value: summary.totalProducts,
      icon: "⭐",
      bgClass: "from-green-50 to-green-100",
      borderClass: "border-green-200",
      textClass: "text-green-600",
      valueClass: "text-green-900",
      description: `${summary.approvedProducts} đã duyệt, ${summary.pendingProducts} chờ duyệt`
    },
    {
      label: "Sản phẩm chờ duyệt",
      value: summary.pendingProducts,
      icon: "⏳",
      bgClass: "from-yellow-50 to-yellow-100",
      borderClass: "border-yellow-200",
      textClass: "text-yellow-600",
      valueClass: "text-yellow-900",
      description: "Cần xử lý"
    },
    {
      label: "Tổng danh mục",
      value: summary.totalCategories,
      icon: "📁",
      bgClass: "from-purple-50 to-purple-100",
      borderClass: "border-purple-200",
      textClass: "text-purple-600",
      valueClass: "text-purple-900",
      description: "Danh mục sản phẩm"
    },
    {
      label: "Tổng đơn hàng",
      value: summary.totalOrders,
      icon: "🧾",
      bgClass: "from-orange-50 to-orange-100",
      borderClass: "border-orange-200",
      textClass: "text-orange-600",
      valueClass: "text-orange-900",
      description: "Đơn hàng trong hệ thống"
    },
    {
      label: "Tổng khách hàng",
      value: summary.totalCustomers,
      icon: "👥",
      bgClass: "from-cyan-50 to-cyan-100",
      borderClass: "border-cyan-200",
      textClass: "text-cyan-600",
      valueClass: "text-cyan-900",
      description: "Người dùng Customer"
    },
    {
      label: "Quản trị doanh nghiệp",
      value: summary.totalEnterpriseAdmins,
      icon: "👔",
      bgClass: "from-indigo-50 to-indigo-100",
      borderClass: "border-indigo-200",
      textClass: "text-indigo-600",
      valueClass: "text-indigo-900",
      description: "EnterpriseAdmin"
    },
    {
      label: "Đơn đăng ký OCOP",
      value: summary.totalApplications,
      icon: "📋",
      bgClass: "from-pink-50 to-pink-100",
      borderClass: "border-pink-200",
      textClass: "text-pink-600",
      valueClass: "text-pink-900",
      description: `${summary.pendingApplications} đang chờ duyệt`
    },
    {
      label: "Đã thanh toán",
      value: formatCurrency(summary.paidPaymentsAmount),
      icon: "💰",
      bgClass: "from-emerald-50 to-emerald-100",
      borderClass: "border-emerald-200",
      textClass: "text-emerald-600",
      valueClass: "text-emerald-900",
      description: "Tổng tiền đã thanh toán"
    },
    {
      label: "Chờ chuyển khoản",
      value: formatCurrency(summary.awaitingTransferAmount),
      icon: "💳",
      bgClass: "from-teal-50 to-teal-100",
      borderClass: "border-teal-200",
      textClass: "text-teal-600",
      valueClass: "text-teal-900",
      description: "Đang chờ xác nhận"
    },
    {
      label: "Sản phẩm đã duyệt",
      value: summary.approvedProducts,
      icon: "✅",
      bgClass: "from-lime-50 to-lime-100",
      borderClass: "border-lime-200",
      textClass: "text-lime-600",
      valueClass: "text-lime-900",
      description: "Sản phẩm OCOP"
    },
    {
      label: "Sản phẩm bị từ chối",
      value: summary.rejectedProducts,
      icon: "❌",
      bgClass: "from-red-50 to-red-100",
      borderClass: "border-red-200",
      textClass: "text-red-600",
      valueClass: "text-red-900",
      description: "Không đạt tiêu chuẩn"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📊 Tổng quan hệ thống</h2>
            <p className="text-white/90 text-lg">Thống kê và phân tích toàn diện hệ thống OCOP Gia Lai</p>
          </div>
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-2xl p-6 border-2 ${card.borderClass} shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group`}
            style={{
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
            }}
          >
            {/* Background gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgClass} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${card.bgClass} shadow-md`}>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <div className={`px-3 py-1 rounded-full ${card.bgClass} border ${card.borderClass} shadow-sm`}>
                  <span className={`text-xs font-bold ${card.textClass}`}>#{index + 1}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className={`text-sm font-semibold ${card.textClass} uppercase tracking-wide`}>
                  {card.label}
                </p>
                <p className={`text-4xl font-bold ${card.valueClass} leading-tight`}>
                  {card.value}
                </p>
                {card.description && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className={`text-xs ${card.textClass} font-medium`}>
                      {card.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Statistics */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-blue-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Thống kê sản phẩm</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Tổng sản phẩm</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{summary.totalProducts}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm hover:shadow-md transition-all border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Đã duyệt</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{summary.approvedProducts}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl shadow-sm hover:shadow-md transition-all border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Chờ duyệt</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{summary.pendingProducts}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl shadow-sm hover:shadow-md transition-all border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Bị từ chối</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{summary.rejectedProducts}</span>
            </div>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-purple-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Thống kê thanh toán</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Tổng giao dịch</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{summary.totalPayments}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm hover:shadow-md transition-all border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Đã thanh toán</span>
              </div>
              <span className="text-xl font-bold text-green-600">{formatCurrency(summary.paidPaymentsAmount)}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl shadow-sm hover:shadow-md transition-all border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Chờ chuyển khoản</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{formatCurrency(summary.awaitingTransferAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-2">💡 Hướng dẫn nhanh</h4>
              <p className="text-white/90 text-sm leading-relaxed">
                Chọn một tab ở trên để bắt đầu quản lý hệ thống. Dữ liệu được cập nhật tự động khi bạn làm mới trang. 
                Sử dụng nút <strong>"Làm mới dữ liệu"</strong> để cập nhật thông tin mới nhất.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Trạng thái hệ thống</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Kết nối API</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✓ Hoạt động</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cơ sở dữ liệu</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✓ Hoạt động</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cập nhật lần cuối</span>
              <span className="text-xs text-gray-500">{new Date().toLocaleTimeString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
