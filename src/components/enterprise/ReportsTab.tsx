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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Báo cáo doanh nghiệp</h2>
        <p className="text-sm text-gray-500">Thống kê doanh thu và hiệu suất kinh doanh</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-3xl font-bold">{stats.totalRevenue.toLocaleString("vi-VN")}₫</span>
          </div>
          <h3 className="text-lg font-semibold">Tổng doanh thu</h3>
          <p className="text-sm text-green-100 mt-1">Từ {stats.ordersByStatus.Completed} đơn hoàn thành</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-4xl font-bold text-blue-600">{stats.totalOrders}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Tổng đơn hàng</h3>
          <p className="text-sm text-gray-600 mt-1">Tất cả các đơn hàng</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng theo trạng thái</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.ordersByStatus).map(([status, count]) => {
            const colors: Record<string, string> = {
              Pending: "bg-orange-100 text-orange-700 border-orange-200",
              Processing: "bg-blue-100 text-blue-700 border-blue-200",
              Shipped: "bg-purple-100 text-purple-700 border-purple-200",
              Completed: "bg-green-100 text-green-700 border-green-200",
              Cancelled: "bg-gray-100 text-gray-700 border-gray-200",
            }
            const labels: Record<string, string> = {
              Pending: "Chờ xác nhận",
              Processing: "Đang xử lý",
              Shipped: "Đang giao",
              Completed: "Hoàn thành",
              Cancelled: "Đã hủy",
            }
            
            return (
              <div key={status} className={`p-4 rounded-lg border-2 ${colors[status]}`}>
                <div className="text-3xl font-bold mb-2">{count}</div>
                <div className="text-sm font-semibold">{labels[status]}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Selling Products */}
      {stats.topProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Sản phẩm bán chạy</h3>
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
                    <span>Doanh thu: <strong className="text-green-600">{item.revenue.toLocaleString("vi-VN")}₫</strong></span>
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

      {/* Info */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
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

