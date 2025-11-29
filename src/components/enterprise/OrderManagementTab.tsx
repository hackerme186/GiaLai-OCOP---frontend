"use client"

import { useEffect, useState, useMemo, type ReactElement } from "react"
import Image from "next/image"
import { getOrders, updateOrderStatus, getShippers, assignOrderToShipper, type Order, type User, type Shipper } from "@/lib/api"

interface OrderManagementTabProps {
  user: User | null
}

export default function OrderManagementTab({ user }: OrderManagementTabProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Assign Shipper Modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [shippers, setShippers] = useState<Shipper[]>([])
  const [loadingShippers, setLoadingShippers] = useState(false)
  const [selectedShipperId, setSelectedShipperId] = useState<number | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadShippers = async () => {
    try {
      setLoadingShippers(true)
      const data = await getShippers()
      setShippers(data)
    } catch (err) {
      console.error("Failed to load shippers:", err)
      alert("Không thể tải danh sách shipper")
    } finally {
      setLoadingShippers(false)
    }
  }

  const handleOpenAssignModal = async (order: Order) => {
    setSelectedOrder(order)
    setSelectedShipperId(order.shipperId || null)
    await loadShippers()
    setShowAssignModal(true)
  }

  const handleAssignShipper = async () => {
    if (!selectedOrder || !selectedShipperId) {
      alert("Vui lòng chọn shipper")
      return
    }

    try {
      await assignOrderToShipper(selectedOrder.id, selectedShipperId)
      setSuccessMessage(`Đã gán đơn hàng #${selectedOrder.id} cho shipper thành công!`)
      setTimeout(() => setSuccessMessage(null), 3000)
      await loadOrders()
      setShowAssignModal(false)
      setSelectedOrder(null)
      setSelectedShipperId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể gán shipper")
    }
  }

  const exportOrdersToExcel = () => {
    // Simple CSV export
    const headers = ["ID", "Ngày đặt", "Trạng thái", "Tổng tiền", "Phương thức thanh toán", "Địa chỉ giao hàng"]
    const rows = filteredOrders.map(order => [
      order.id,
      new Date(order.orderDate).toLocaleDateString("vi-VN"),
      order.status,
      order.totalAmount,
      order.paymentMethod,
      order.shippingAddress || ""
    ])
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `don-hang-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Vui lòng cho phép popup để in hóa đơn")
      return
    }

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hóa đơn #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .order-info { margin-bottom: 20px; }
            .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items th { background-color: #f2f2f2; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HÓA ĐƠN BÁN HÀNG</h1>
            <p>Mã đơn hàng: #${order.id}</p>
            <p>Ngày đặt: ${new Date(order.orderDate).toLocaleDateString("vi-VN")}</p>
          </div>
          <div class="order-info">
            <p><strong>Địa chỉ giao hàng:</strong> ${order.shippingAddress || "N/A"}</p>
            <p><strong>Trạng thái:</strong> ${order.status}</p>
            <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod}</p>
          </div>
          <table class="items">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems?.map(item => `
                <tr>
                  <td>${item.productName || "N/A"}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toLocaleString("vi-VN")}₫</td>
                  <td>${(item.price * item.quantity).toLocaleString("vi-VN")}₫</td>
                </tr>
              `).join("") || ""}
            </tbody>
          </table>
          <div class="total">
            <p>Tổng cộng: ${order.totalAmount.toLocaleString("vi-VN")}₫</p>
          </div>
        </body>
      </html>
    `
    
    printWindow.document.write(invoiceHTML)
    printWindow.document.close()
    printWindow.print()
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getOrders()
      const list = Array.isArray(data) ? data : (data as any)?.items || []
      
      // Backend đã tự động filter orders theo EnterpriseId từ JWT token
      // Không cần filter lại ở frontend
      // Backend OrdersController.cs đã filter: 
      // EnterpriseAdmin chỉ thấy orders có sản phẩm thuộc enterprise của mình
      setOrders(list)
      
      console.log(`✅ Loaded ${list.length} orders for EnterpriseAdmin`)
    } catch (err) {
      console.error("Failed to load orders:", err)
      setError("Không thể tải danh sách đơn hàng")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Filter by status
    if (filter !== "all") {
      const statusMap: Record<string, string[]> = {
        "pending": ["Pending"],
        "processing": ["Processing"],
        "shipped": ["Shipped"],
        "completed": ["Completed"],
        "cancelled": ["Cancelled"],
      }
      const statuses = statusMap[filter] || []
      if (statuses.length > 0) {
        filtered = filtered.filter(order => 
          statuses.some(s => order.status?.toLowerCase().includes(s.toLowerCase()))
        )
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(order => {
        if (order.id.toString().includes(query)) return true
        if (order.orderItems?.some(item => 
          item.productName?.toLowerCase().includes(query)
        )) return true
        return false
      })
    }

    return filtered
  }, [orders, filter, searchQuery])

  const handleStatusUpdate = async (orderId: number, newStatus: "Pending" | "Processing" | "Shipped" | "Completed" | "Cancelled") => {
    try {
      await updateOrderStatus(orderId, { status: newStatus })
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
      setSuccessMessage(`Đã cập nhật trạng thái đơn hàng #${orderId} thành công!`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể cập nhật trạng thái đơn hàng")
    }
  }

  const getNextStatus = (currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      "Pending": "Processing",
      "Processing": "Shipped",
      "Shipped": "Completed",
    }
    return statusFlow[currentStatus]
  }

  const getStatusInfo = (status: string) => {
    const normalized = status?.toLowerCase() || ""
    
    const statusMap: Record<string, { text: string; color: string; icon: ReactElement }> = {
      "pending": {
        text: "Chờ xác nhận",
        color: "text-orange-600 bg-orange-50 border-orange-200",
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
      "processing": {
        text: "Đang xử lý",
        color: "text-blue-600 bg-blue-50 border-blue-200",
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      },
      "shipped": {
        text: "Đang giao",
        color: "text-purple-600 bg-purple-50 border-purple-200",
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
      },
      "completed": {
        text: "Hoàn thành",
        color: "text-green-600 bg-green-50 border-green-200",
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      },
      "cancelled": {
        text: "Đã hủy",
        color: "text-gray-600 bg-gray-50 border-gray-200",
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      },
    }

    return statusMap[normalized] || {
      text: status,
      color: "text-gray-600 bg-gray-50 border-gray-200",
      icon: null
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải đơn hàng...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-2 border-green-200 text-green-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h2>
            <p className="text-sm text-gray-500 mt-1">Quản lý và cập nhật trạng thái đơn hàng của doanh nghiệp</p>
          </div>
          <button
            onClick={exportOrdersToExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Xuất Excel
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: "all", label: "Tất cả" },
            { id: "pending", label: "Chờ xác nhận" },
            { id: "processing", label: "Đang xử lý" },
            { id: "shipped", label: "Đang giao" },
            { id: "completed", label: "Hoàn thành" },
            { id: "cancelled", label: "Đã hủy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === tab.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo ID đơn hàng, tên sản phẩm..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đơn hàng</h3>
          <p className="text-gray-500">Chưa có đơn hàng nào trong danh sách.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status || "")
            const nextStatus = getNextStatus(order.status || "")

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Order Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">Mã đơn hàng</div>
                    <div className="text-lg font-bold text-gray-900">#{order.id}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2 ${statusInfo.color}`}>
                      {statusInfo.icon}
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6 space-y-4">
                  {order.orderItems?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <div className="relative w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.productImageUrl || "/hero.jpg"}
                          alt={item.productName || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{item.productName}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{item.price.toLocaleString("vi-VN")}₫</span>
                          <span>x{item.quantity}</span>
                          <span className="font-semibold text-green-600">
                            = {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Order Total */}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                    <span className="text-gray-600 font-medium">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {order.totalAmount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    {nextStatus && order.status !== "Completed" && order.status !== "Cancelled" && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, nextStatus as any)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {nextStatus === "Processing" && "Xác nhận đơn hàng"}
                        {nextStatus === "Shipped" && "Đang giao hàng"}
                        {nextStatus === "Completed" && "Hoàn thành đơn hàng"}
                      </button>
                    )}
                    {order.status === "Processing" && (
                      <button
                        onClick={() => handleOpenAssignModal(order)}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Gán shipper
                      </button>
                    )}
                    <button
                      onClick={() => printInvoice(order)}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      In hóa đơn
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Assign Shipper Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Gán shipper cho đơn hàng #{selectedOrder.id}</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedOrder(null)
                  setSelectedShipperId(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingShippers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
                <p className="text-gray-600">Đang tải danh sách shipper...</p>
              </div>
            ) : shippers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Không có shipper nào</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn shipper</label>
                  <select
                    value={selectedShipperId || ""}
                    onChange={(e) => setSelectedShipperId(Number(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  >
                    <option value="">-- Chọn shipper --</option>
                    {shippers.map((shipper) => (
                      <option key={shipper.id} value={shipper.id}>
                        {shipper.name} {shipper.phoneNumber && `(${shipper.phoneNumber})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAssignShipper}
                    disabled={!selectedShipperId}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Xác nhận
                  </button>
                  <button
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedOrder(null)
                      setSelectedShipperId(null)
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

