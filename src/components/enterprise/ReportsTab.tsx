"use client"

import { useEffect, useState, useMemo } from "react"
import { getOrders, getProducts, type Order, type Product, type User } from "@/lib/api"

interface ReportsTabProps {
  user: User | null
}

export default function ReportsTab({ user }: ReportsTabProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load orders
      // Backend đã tự động filter orders theo EnterpriseId từ JWT token
      const ordersData = await getOrders()
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.items || []
      setOrders(ordersList)

      // Load products
      // Backend đã tự động filter products theo EnterpriseId từ JWT token
      const productsData = await getProducts({ pageSize: 100 })
      setProducts(productsData)
      
      console.log(`✅ Loaded ${ordersList.length} orders and ${productsData.length} products for Reports`)
    } catch (err) {
      console.error("Failed to load data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    // Total revenue (only Completed orders)
    // Backend đã filter orders theo EnterpriseId, nên tất cả orders đều thuộc enterprise này
    const completedOrders = orders.filter(o => o.status?.toLowerCase() === "completed")
    const totalRevenue = completedOrders.reduce((sum, order) => {
      // Tất cả orderItems trong orders đã được filter đều thuộc enterprise này
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

    // Best selling products
    const productSales = new Map<number, { product: Product; totalSold: number; revenue: number }>()
    
    // Backend đã filter orders theo EnterpriseId, nên tất cả orderItems đều thuộc enterprise này
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
      topProducts,
    }
  }, [orders, products, user])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải báo cáo...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📊 Báo cáo doanh nghiệp</h2>
        <p className="text-indigo-100 text-lg">Thống kê doanh thu và hiệu suất kinh doanh</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white/90 uppercase tracking-wide">Tổng doanh thu</p>
            <p className="text-4xl font-bold leading-tight">{stats.totalRevenue.toLocaleString("vi-VN")}₫</p>
            <p className="text-sm text-green-100 mt-2 pt-2 border-t border-white/20">Từ {stats.ordersByStatus.Completed} đơn hoàn thành</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Tổng đơn hàng</p>
            <p className="text-4xl font-bold text-blue-900 leading-tight">{stats.totalOrders}</p>
            <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">Tất cả các đơn hàng</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-4xl font-bold text-purple-600">{stats.totalProducts}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Tổng sản phẩm</h3>
          <p className="text-sm text-gray-600 mt-1">Số lượng sản phẩm</p>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Đơn hàng theo trạng thái</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.ordersByStatus).map(([status, count]) => {
            const colors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
              Pending: { bg: "from-orange-50 to-amber-50", text: "text-orange-600", border: "border-orange-200", icon: "⏳" },
              Processing: { bg: "from-blue-50 to-indigo-50", text: "text-blue-600", border: "border-blue-200", icon: "⚙️" },
              Shipped: { bg: "from-purple-50 to-violet-50", text: "text-purple-600", border: "border-purple-200", icon: "🚚" },
              Completed: { bg: "from-green-50 to-emerald-50", text: "text-green-600", border: "border-green-200", icon: "✅" },
              Cancelled: { bg: "from-red-50 to-rose-50", text: "text-red-600", border: "border-red-200", icon: "❌" },
            }
            const labels: Record<string, string> = {
              Pending: "Chờ xác nhận",
              Processing: "Đang xử lý",
              Shipped: "Đang giao",
              Completed: "Hoàn thành",
              Cancelled: "Đã hủy",
            }
            
            return (
              <div key={status} className={`p-5 rounded-xl border-2 ${colors[status].border} bg-gradient-to-br ${colors[status].bg} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{colors[status].icon}</span>
                  <div className={`text-3xl font-bold ${colors[status].text}`}>{count}</div>
                </div>
                <div className={`text-sm font-semibold ${colors[status].text}`}>{labels[status]}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Selling Products */}
      {stats.topProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:shadow-2xl transition-all duration-300">
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
              <div key={item.product.id} className="flex items-center gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-2 border-gray-200">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
                  index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white" :
                  index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                  index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white" :
                  "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg mb-1">{item.product.name || `Sản phẩm #${item.product.id}`}</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">Đã bán: <strong className="text-blue-600">{item.totalSold}</strong></span>
                    <span className="text-gray-600">Doanh thu: <strong className="text-green-600 font-bold">{item.revenue.toLocaleString("vi-VN")}₫</strong></span>
                  </div>
                </div>
                {index < 3 && (
                  <div className="text-3xl">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Lưu ý về báo cáo:</p>
            <ul className="space-y-1">
              <li>• Doanh thu chỉ tính từ các đơn hàng đã hoàn thành</li>
              <li>• Số liệu được cập nhật theo thời gian thực</li>
              <li>• Sản phẩm bán chạy được xếp hạng theo số lượng đã bán</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

