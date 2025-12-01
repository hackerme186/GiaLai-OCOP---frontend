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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Tổng quan hệ thống</h2>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.bgClass} rounded-lg p-6 border ${card.borderClass} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${card.textClass}`}>{card.label}</p>
                <p className={`text-3xl font-bold ${card.valueClass} mt-2`}>
                  {card.value}
                </p>
                {card.description && (
                  <p className={`text-xs ${card.textClass} mt-2 opacity-75`}>
                    {card.description}
                  </p>
                )}
              </div>
              <div className="text-4xl ml-4">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê sản phẩm</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng sản phẩm:</span>
              <span className="font-semibold text-gray-900">{summary.totalProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đã duyệt:</span>
              <span className="font-semibold text-green-600">{summary.approvedProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chờ duyệt:</span>
              <span className="font-semibold text-yellow-600">{summary.pendingProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bị từ chối:</span>
              <span className="font-semibold text-red-600">{summary.rejectedProducts}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê thanh toán</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng thanh toán:</span>
              <span className="font-semibold text-gray-900">{summary.totalPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đã thanh toán:</span>
              <span className="font-semibold text-green-600">{formatCurrency(summary.paidPaymentsAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chờ chuyển khoản:</span>
              <span className="font-semibold text-yellow-600">{formatCurrency(summary.awaitingTransferAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Lưu ý:</strong> Chọn một tab ở trên để bắt đầu quản lý hệ thống. Dữ liệu được cập nhật tự động khi bạn làm mới trang.
        </p>
      </div>
    </div>
  )
}
