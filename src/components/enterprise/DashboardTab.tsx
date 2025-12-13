"use client"

import { useEffect, useState, useMemo } from "react"
import { getOrders, getProducts, type Order, type Product, type User } from "@/lib/api"

interface DashboardTabProps {
  user: User | null
}

export default function DashboardTab({ user }: DashboardTabProps) {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load orders - Backend tự động filter theo EnterpriseId từ JWT token
      const ordersData = await getOrders()
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.items || []
      setOrders(ordersList)

      // Load products - Backend tự động filter theo EnterpriseId từ JWT token
      const productsData = await getProducts({ pageSize: 100 })
      setProducts(productsData)
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

  // Calculate statistics
  const stats = useMemo(() => {
    // Total revenue (only Completed orders)
    const completedOrders = orders.filter(o => o.status?.toLowerCase() === "completed")
    const totalRevenue = completedOrders.reduce((sum, order) => {
      const orderTotal = order.orderItems?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0
      return sum + orderTotal
    }, 0)

    // Orders by status
    const ordersByStatus = {
      Pending: orders.filter(o => o.status?.toLowerCase().includes("pending")).length,
      Processing: orders.filter(o => o.status?.toLowerCase().includes("processing")).length,
      Shipped: orders.filter(o => o.status?.toLowerCase().includes("shipped")).length,
      Completed: completedOrders.length,
      Cancelled: orders.filter(o => o.status?.toLowerCase().includes("cancelled")).length,
    }

    // Products by status
    const productsByStatus = {
      Approved: products.filter(p => p.status === "Approved").length,
      PendingApproval: products.filter(p => p.status === "PendingApproval").length,
      Rejected: products.filter(p => p.status === "Rejected").length,
    }

    // Best selling products
    const productSales = new Map<number, { product: Product; totalSold: number; revenue: number }>()
    
    orders.forEach(order => {
      order.orderItems?.forEach(item => {
        const current = productSales.get(item.productId) || {
          product: products.find(p => p.id === item.productId) || {} as Product,
          totalSold: 0,
          revenue: 0
        }
        current.totalSold += item.quantity
        current.revenue += item.price * item.quantity
        productSales.set(item.productId, current)
      })
    })

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5)

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      ordersByStatus,
      productsByStatus,
      topProducts,
    }
  }, [orders, products])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải dữ liệu tổng quan...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    )
  }

  const statsCards = [
    {
      label: "Tổng doanh thu",
      value: formatCurrency(stats.totalRevenue),
      icon: "💰",
      bgClass: "from-green-50 to-green-100",
      borderClass: "border-green-200",
      textClass: "text-green-600",
      valueClass: "text-green-900",
      description: `Từ ${stats.ordersByStatus.Completed} đơn hoàn thành`
    },
    {
      label: "Tổng đơn hàng",
      value: stats.totalOrders,
      icon: "🧾",
      bgClass: "from-blue-50 to-blue-100",
      borderClass: "border-blue-200",
      textClass: "text-blue-600",
      valueClass: "text-blue-900",
      description: "Tất cả các đơn hàng"
    },
    {
      label: "Tổng sản phẩm",
      value: stats.totalProducts,
      icon: "📦",
      bgClass: "from-purple-50 to-purple-100",
      borderClass: "border-purple-200",
      textClass: "text-purple-600",
      valueClass: "text-purple-900",
      description: `${stats.productsByStatus.Approved} đã duyệt, ${stats.productsByStatus.PendingApproval} chờ duyệt`
    },
    {
      label: "Đơn chờ xác nhận",
      value: stats.ordersByStatus.Pending,
      icon: "⏳",
      bgClass: "from-yellow-50 to-yellow-100",
      borderClass: "border-yellow-200",
      textClass: "text-yellow-600",
      valueClass: "text-yellow-900",
      description: "Cần xử lý"
    },
    {
      label: "Đơn đang xử lý",
      value: stats.ordersByStatus.Processing,
      icon: "⚙️",
      bgClass: "from-orange-50 to-orange-100",
      borderClass: "border-orange-200",
      textClass: "text-orange-600",
      valueClass: "text-orange-900",
      description: "Đang được xử lý"
    },
    {
      label: "Đơn đang giao",
      value: stats.ordersByStatus.Shipped,
      icon: "🚚",
      bgClass: "from-cyan-50 to-cyan-100",
      borderClass: "border-cyan-200",
      textClass: "text-cyan-600",
      valueClass: "text-cyan-900",
      description: "Đang vận chuyển"
    },
    {
      label: "Đơn hoàn thành",
      value: stats.ordersByStatus.Completed,
      icon: "✅",
      bgClass: "from-emerald-50 to-emerald-100",
      borderClass: "border-emerald-200",
      textClass: "text-emerald-600",
      valueClass: "text-emerald-900",
      description: "Đã hoàn thành"
    },
    {
      label: "Sản phẩm đã duyệt",
      value: stats.productsByStatus.Approved,
      icon: "⭐",
      bgClass: "from-lime-50 to-lime-100",
      borderClass: "border-lime-200",
      textClass: "text-lime-600",
      valueClass: "text-lime-900",
      description: "Sản phẩm OCOP"
    },
    {
      label: "Sản phẩm chờ duyệt",
      value: stats.productsByStatus.PendingApproval,
      icon: "📋",
      bgClass: "from-amber-50 to-amber-100",
      borderClass: "border-amber-200",
      textClass: "text-amber-600",
      valueClass: "text-amber-900",
      description: "Chờ phê duyệt"
    },
    {
      label: "Sản phẩm bị từ chối",
      value: stats.productsByStatus.Rejected,
      icon: "❌",
      bgClass: "from-red-50 to-red-100",
      borderClass: "border-red-200",
      textClass: "text-red-600",
      valueClass: "text-red-900",
      description: "Không đạt tiêu chuẩn"
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📊 Tổng quan doanh nghiệp</h2>
            <p className="text-white/90 text-lg">Thống kê và phân tích toàn diện hoạt động kinh doanh</p>
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
        {/* Order Statistics */}
        <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl border-2 border-green-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Thống kê đơn hàng</h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => {
              const colors: Record<string, { bg: string; text: string; border: string }> = {
                Pending: { bg: "from-orange-50 to-amber-50", text: "text-orange-600", border: "border-orange-200" },
                Processing: { bg: "from-blue-50 to-indigo-50", text: "text-blue-600", border: "border-blue-200" },
                Shipped: { bg: "from-purple-50 to-violet-50", text: "text-purple-600", border: "border-purple-200" },
                Completed: { bg: "from-green-50 to-emerald-50", text: "text-green-600", border: "border-green-200" },
                Cancelled: { bg: "from-red-50 to-rose-50", text: "text-red-600", border: "border-red-200" },
              }
              const labels: Record<string, string> = {
                Pending: "Chờ xác nhận",
                Processing: "Đang xử lý",
                Shipped: "Đang giao",
                Completed: "Hoàn thành",
                Cancelled: "Đã hủy",
              }
              
              return (
                <div key={status} className={`flex items-center justify-between p-4 bg-gradient-to-r ${colors[status].bg} rounded-xl shadow-sm hover:shadow-md transition-all border ${colors[status].border}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center`}>
                      <span className={`text-lg font-bold ${colors[status].text}`}>{count}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{labels[status]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Product Statistics */}
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-purple-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
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
              <span className="text-2xl font-bold text-gray-900">{stats.totalProducts}</span>
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
              <span className="text-2xl font-bold text-green-600">{stats.productsByStatus.Approved}</span>
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
              <span className="text-2xl font-bold text-yellow-600">{stats.productsByStatus.PendingApproval}</span>
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
              <span className="text-2xl font-bold text-red-600">{stats.productsByStatus.Rejected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      {stats.topProducts.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Sản phẩm bán chạy</h3>
          </div>
          <div className="space-y-3">
            {stats.topProducts.map((item, index) => (
              <div key={item.product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? "bg-yellow-100 text-yellow-700" :
                  index === 1 ? "bg-gray-100 text-gray-700" :
                  index === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-gray-50 text-gray-600"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.product.name || `Sản phẩm #${item.product.id}`}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>Đã bán: <strong>{item.totalSold}</strong></span>
                    <span>Doanh thu: <strong className="text-green-600">{formatCurrency(item.revenue)}</strong></span>
                  </div>
                </div>
                {index < 3 && (
                  <div className="text-2xl">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-2">💡 Hướng dẫn nhanh</h4>
              <p className="text-white/90 text-sm leading-relaxed">
                Chọn một tab ở trên để bắt đầu quản lý doanh nghiệp. Dữ liệu được cập nhật tự động khi bạn làm mới trang. 
                Sử dụng nút <strong>"Làm mới dữ liệu"</strong> để cập nhật thông tin mới nhất.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

