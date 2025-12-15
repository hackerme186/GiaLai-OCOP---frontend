"use client"

import { useEffect, useState, useMemo, type ReactElement } from "react"
import Image from "next/image"
import { getOrders, approveOrderCompletion, type Order } from "@/lib/api"

export default function AdminOrderManagementTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [enterpriseFilter, setEnterpriseFilter] = useState<number | null>(null)
  
  // Order Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  
  // Approval Modal
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalOrder, setApprovalOrder] = useState<Order | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  
  // Expanded orders
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadOrders()
  }, [])

  const handleOpenDetailModal = (order: Order) => {
    setDetailOrder(order)
    setShowDetailModal(true)
  }

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const handleOpenApprovalModal = (order: Order) => {
    setApprovalOrder(order)
    setRejectionReason("")
    setShowApprovalModal(true)
  }

  const handleApproveCompletion = async (approved: boolean) => {
    if (!approvalOrder) return

    if (!approved && !rejectionReason.trim()) {
      alert("Vui lòng nhập lý do từ chối")
      return
    }

    try {
      console.log("🔄 Approving completion for order:", approvalOrder.id, "approved:", approved)
      
      const result = await approveOrderCompletion({
        orderId: approvalOrder.id,
        approved,
        rejectionReason: approved ? undefined : rejectionReason
      })
      
      console.log("✅ Approval result:", result)
      
      // Reload orders để lấy dữ liệu mới nhất từ server
      await loadOrders()
      
      setSuccessMessage(
        approved 
          ? `Đã xác nhận hoàn thành đơn hàng #${approvalOrder.id}! Số tiền đã được cộng vào ví của EnterpriseAdmin.`
          : `Đã từ chối yêu cầu hoàn thành đơn hàng #${approvalOrder.id}.`
      )
      setTimeout(() => setSuccessMessage(null), 5000)
      
      setShowApprovalModal(false)
      setApprovalOrder(null)
      setRejectionReason("")
    } catch (err) {
      console.error("❌ Error approving completion:", err)
      const errorMessage = err instanceof Error ? err.message : "Không thể xử lý yêu cầu"
      alert(`Lỗi: ${errorMessage}`)
    }
  }

  const exportOrdersToExcel = () => {
    // Simple CSV export
    const headers = ["ID", "Ngày đặt", "Trạng thái", "Tổng tiền", "Phương thức thanh toán", "Địa chỉ giao hàng", "Doanh nghiệp"]
    const rows = filteredOrders.map(order => {
      const enterpriseNames = [...new Set(order.orderItems?.map(item => item.enterpriseName).filter(Boolean) || [])]
      return [
        order.id,
        new Date(order.orderDate).toLocaleDateString("vi-VN"),
        order.status,
        order.totalAmount,
        order.paymentMethod,
        order.shippingAddress || "",
        enterpriseNames.join(", ")
      ]
    })
    
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

    const enterpriseNames = [...new Set(order.orderItems?.map(item => item.enterpriseName).filter(Boolean) || [])]

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
            ${enterpriseNames.length > 0 ? `<p><strong>Doanh nghiệp:</strong> ${enterpriseNames.join(", ")}</p>` : ""}
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
                  <td>${item.productName || "N/A"}${item.enterpriseName ? ` (${item.enterpriseName})` : ""}</td>
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
      // SystemAdmin có thể xem tất cả đơn hàng
      const data = await getOrders()
      const list = Array.isArray(data) ? data : (data as any)?.items || []
      
      // SystemAdmin xem tất cả đơn hàng từ tất cả EnterpriseAdmin
      setOrders(list)
      
      console.log(`✅ Loaded ${list.length} orders for SystemAdmin`)
    } catch (err) {
      console.error("Failed to load orders:", err)
      setError("Không thể tải danh sách đơn hàng")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Get unique enterprises from orders
  const uniqueEnterprises = useMemo(() => {
    const enterpriseMap = new Map<number, string>()
    orders.forEach(order => {
      order.orderItems?.forEach(item => {
        if (item.enterpriseId && item.enterpriseName) {
          enterpriseMap.set(item.enterpriseId, item.enterpriseName)
        }
      })
    })
    return Array.from(enterpriseMap.entries()).map(([id, name]) => ({ id, name }))
  }, [orders])

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Filter by enterprise
    if (enterpriseFilter !== null) {
      filtered = filtered.filter(order => 
        order.orderItems?.some(item => item.enterpriseId === enterpriseFilter)
      )
    }

    // Filter by status
    if (filter !== "all") {
      const statusMap: Record<string, string[]> = {
        "pending": ["Pending"],
        "processing": ["Processing"],
        "shipped": ["Shipped"],
        "completed": ["Completed"],
        "pending-completion": ["PendingCompletion"],
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
        if (order.customer?.name?.toLowerCase().includes(query)) return true
        if (order.customer?.email?.toLowerCase().includes(query)) return true
        if (order.orderItems?.some(item => 
          item.productName?.toLowerCase().includes(query) ||
          item.enterpriseName?.toLowerCase().includes(query)
        )) return true
        return false
      })
    }

    return filtered
  }, [orders, filter, searchQuery, enterpriseFilter])


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
      "pendingcompletion": {
        text: "Chờ xác nhận hoàn thành",
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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

  const pendingCompletionCount = orders.filter(o => o.status === "PendingCompletion").length

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

      {/* Pending Completion Alert */}
      {pendingCompletionCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-yellow-900">
                  Có {pendingCompletionCount} đơn hàng đang chờ xác nhận hoàn thành
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Vui lòng xem xét và xác nhận các đơn hàng này
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilter("pending-completion")}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              Xem ngay →
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Header & Filters */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📋 Quản lý đơn hàng</h2>
            <p className="text-blue-100 text-lg">Theo dõi và xem tất cả đơn hàng từ các doanh nghiệp</p>
          </div>
          <button
            onClick={exportOrdersToExcel}
            className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Enterprise Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo doanh nghiệp</label>
          <select
            value={enterpriseFilter || ""}
            onChange={(e) => setEnterpriseFilter(e.target.value ? Number(e.target.value) : null)}
            className="w-full md:w-auto px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
          >
            <option value="">Tất cả doanh nghiệp</option>
            {uniqueEnterprises.map(enterprise => (
              <option key={enterprise.id} value={enterprise.id}>
                {enterprise.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: "all", label: "Tất cả" },
            { id: "pending", label: "Chờ xác nhận" },
            { id: "processing", label: "Đang xử lý" },
            { id: "shipped", label: "Đang giao" },
            { id: "completed", label: "Hoàn thành" },
            { id: "pending-completion", label: `Chờ xác nhận hoàn thành (${orders.filter(o => o.status === "PendingCompletion").length})` },
            { id: "cancelled", label: "Đã hủy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                filter === tab.id
                  ? "bg-green-600 text-white shadow-lg"
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
          placeholder="Tìm kiếm theo ID đơn hàng, tên khách hàng, email, tên sản phẩm, doanh nghiệp..."
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
            const enterpriseNames = [...new Set(order.orderItems?.map(item => item.enterpriseName).filter(Boolean) || [])]

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600 font-medium">Mã đơn hàng</div>
                      <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">#{order.id}</div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-2 shadow-sm ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600 font-medium">
                        {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                      </div>
                      <button
                        onClick={() => handleOpenDetailModal(order)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => toggleOrderExpand(order.id)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {expandedOrders.has(order.id) ? "Thu gọn" : "Mở rộng"}
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {order.customer && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">{order.customer.name}</span>
                      </div>
                    )}
                    {enterpriseNames.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="truncate">{enterpriseNames.join(", ")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{order.paymentMethod}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{order.paymentStatus}</span>
                    </div>
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
                        {item.enterpriseName && (
                          <div className="text-xs text-blue-600 mt-1 font-medium">
                            Doanh nghiệp: {item.enterpriseName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Expanded Details */}
                  {expandedOrders.has(order.id) && (
                    <div className="pt-4 border-t-2 border-gray-200 space-y-4">
                      {/* Customer Info */}
                      {order.customer && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Thông tin khách hàng
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Tên:</span>
                              <span className="ml-2 font-medium text-gray-900">{order.customer.name}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <span className="ml-2 font-medium text-gray-900">{order.customer.email}</span>
                            </div>
                            {order.customer.phoneNumber && (
                              <div>
                                <span className="text-gray-600">Số điện thoại:</span>
                                <span className="ml-2 font-medium text-gray-900">{order.customer.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Enterprise Info */}
                      {enterpriseNames.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Doanh nghiệp
                          </h5>
                          <p className="text-sm text-gray-700">{enterpriseNames.join(", ")}</p>
                        </div>
                      )}
                      
                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Địa chỉ giao hàng
                          </h5>
                          <p className="text-sm text-gray-700">{order.shippingAddress}</p>
                        </div>
                      )}
                      
                      {/* Payment Info */}
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Thông tin thanh toán
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Phương thức:</span>
                            <span className="ml-2 font-medium text-gray-900">{order.paymentMethod}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Trạng thái:</span>
                            <span className={`ml-2 font-medium ${
                              order.paymentStatus === "Paid" ? "text-green-600" :
                              order.paymentStatus === "Pending" ? "text-orange-600" :
                              "text-red-600"
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                          {order.paymentReference && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600">Mã tham chiếu:</span>
                              <span className="ml-2 font-medium text-gray-900">{order.paymentReference}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Completion Request Info */}
                      {order.status === "PendingCompletion" && order.completionRequestedAt && (
                        <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300">
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Yêu cầu xác nhận hoàn thành
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Thời gian yêu cầu:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {new Date(order.completionRequestedAt).toLocaleString("vi-VN")}
                              </span>
                            </div>
                            <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800 text-xs">
                              ⚠️ Đơn hàng đang chờ SystemAdmin xét duyệt hoàn thành
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Completion Approval Info */}
                      {order.completionApprovedAt && (
                        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Đã được xác nhận hoàn thành
                          </h5>
                          <div className="text-sm">
                            <span className="text-gray-600">Thời gian xác nhận:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {new Date(order.completionApprovedAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Completion Rejection Info */}
                      {order.completionRejectedAt && (
                        <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Đã bị từ chối hoàn thành
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Thời gian từ chối:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {new Date(order.completionRejectedAt).toLocaleString("vi-VN")}
                              </span>
                            </div>
                            {order.completionRejectionReason && (
                              <div>
                                <span className="text-gray-600">Lý do:</span>
                                <p className="mt-1 font-medium text-red-800">{order.completionRejectionReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Shipping Info */}
                      {(order.shipperId || order.shippedAt || order.deliveredAt) && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Thông tin vận chuyển
                          </h5>
                          <div className="space-y-2 text-sm">
                            {order.shipperId && (
                              <div>
                                <span className="text-gray-600">Shipper ID:</span>
                                <span className="ml-2 font-medium text-gray-900">#{order.shipperId}</span>
                              </div>
                            )}
                            {order.shippedAt && (
                              <div>
                                <span className="text-gray-600">Ngày giao:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {new Date(order.shippedAt).toLocaleString("vi-VN")}
                                </span>
                              </div>
                            )}
                            {order.deliveredAt && (
                              <div>
                                <span className="text-gray-600">Ngày nhận:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {new Date(order.deliveredAt).toLocaleString("vi-VN")}
                                </span>
                              </div>
                            )}
                            {order.deliveryNotes && (
                              <div>
                                <span className="text-gray-600">Ghi chú:</span>
                                <span className="ml-2 font-medium text-gray-900">{order.deliveryNotes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Total */}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                    <span className="text-gray-600 font-medium">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {order.totalAmount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    {order.status === "PendingCompletion" && (
                      <>
                        <button
                          onClick={async () => {
                            if (confirm(`Bạn có chắc muốn xác nhận đơn hàng #${order.id} đã hoàn thành? Số tiền sẽ được cộng vào ví của EnterpriseAdmin.`)) {
                              setApprovalOrder(order)
                              await handleApproveCompletion(true)
                            }
                          }}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Xác nhận hoàn thành
                        </button>
                        <button
                          onClick={() => handleOpenApprovalModal(order)}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Từ chối
                        </button>
                      </>
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

      {/* Order Detail Modal - Similar to EnterpriseAdmin but with enterprise info */}
      {showDetailModal && detailOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Chi tiết đơn hàng #{detailOrder.id}</h3>
                  <p className="text-blue-100">
                    Ngày đặt: {new Date(detailOrder.orderDate).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setDetailOrder(null)
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4">
                {(() => {
                  const statusInfo = getStatusInfo(detailOrder.status || "")
                  return (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm ${statusInfo.color.replace('text-', 'text-white ').replace('bg-', 'bg-white/20 ')}`}>
                      {statusInfo.icon}
                      {statusInfo.text}
                    </span>
                  )
                })()}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              {detailOrder.customer && (
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Thông tin khách hàng
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Tên khách hàng:</span>
                      <p className="font-medium text-gray-900">{detailOrder.customer.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-medium text-gray-900">{detailOrder.customer.email}</p>
                    </div>
                    {detailOrder.customer.phoneNumber && (
                      <div>
                        <span className="text-sm text-gray-600">Số điện thoại:</span>
                        <p className="font-medium text-gray-900">{detailOrder.customer.phoneNumber}</p>
                      </div>
                    )}
                    {detailOrder.customer.address && (
                      <div className="md:col-span-2">
                        <span className="text-sm text-gray-600">Địa chỉ:</span>
                        <p className="font-medium text-gray-900">{detailOrder.customer.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enterprise Info */}
              {(() => {
                const enterpriseNames = [...new Set(detailOrder.orderItems?.map(item => item.enterpriseName).filter(Boolean) || [])]
                if (enterpriseNames.length === 0) return null
                return (
                  <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Doanh nghiệp
                    </h4>
                    <p className="text-gray-700">{enterpriseNames.join(", ")}</p>
                  </div>
                )
              })()}

              {/* Shipping Address */}
              {detailOrder.shippingAddress && (
                <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Địa chỉ giao hàng
                  </h4>
                  <p className="text-gray-700">{detailOrder.shippingAddress}</p>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <h4 className="font-bold text-gray-900 p-5 border-b border-gray-200 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Sản phẩm trong đơn hàng
                </h4>
                <div className="divide-y divide-gray-200">
                  {detailOrder.orderItems?.map((item) => (
                    <div key={item.id} className="p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                      <div className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.productImageUrl || "/hero.jpg"}
                          alt={item.productName || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900 mb-2">{item.productName}</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Đơn giá:</span>
                            <p className="font-medium text-gray-900">{item.price.toLocaleString("vi-VN")}₫</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Số lượng:</span>
                            <p className="font-medium text-gray-900">x{item.quantity}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Thành tiền:</span>
                            <p className="font-medium text-green-600">{(item.price * item.quantity).toLocaleString("vi-VN")}₫</p>
                          </div>
                          {item.enterpriseName && (
                            <div>
                              <span className="text-gray-600">Doanh nghiệp:</span>
                              <p className="font-medium text-blue-600">{item.enterpriseName}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {detailOrder.totalAmount.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Thông tin thanh toán
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Phương thức thanh toán:</span>
                    <p className="font-medium text-gray-900">{detailOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Trạng thái thanh toán:</span>
                    <p className={`font-medium ${
                      detailOrder.paymentStatus === "Paid" ? "text-green-600" :
                      detailOrder.paymentStatus === "Pending" ? "text-orange-600" :
                      "text-red-600"
                    }`}>
                      {detailOrder.paymentStatus}
                    </p>
                  </div>
                  {detailOrder.paymentReference && (
                    <div className="md:col-span-2">
                      <span className="text-sm text-gray-600">Mã tham chiếu:</span>
                      <p className="font-medium text-gray-900 font-mono">{detailOrder.paymentReference}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Info */}
              {(detailOrder.shipperId || detailOrder.shippedAt || detailOrder.deliveredAt || detailOrder.deliveryNotes) && (
                <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Thông tin vận chuyển
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailOrder.shipperId && (
                      <div>
                        <span className="text-sm text-gray-600">Shipper ID:</span>
                        <p className="font-medium text-gray-900">#{detailOrder.shipperId}</p>
                      </div>
                    )}
                    {detailOrder.shippedAt && (
                      <div>
                        <span className="text-sm text-gray-600">Ngày giao hàng:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(detailOrder.shippedAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    )}
                    {detailOrder.deliveredAt && (
                      <div>
                        <span className="text-sm text-gray-600">Ngày nhận hàng:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(detailOrder.deliveredAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    )}
                    {detailOrder.deliveryNotes && (
                      <div className="md:col-span-2">
                        <span className="text-sm text-gray-600">Ghi chú giao hàng:</span>
                        <p className="font-medium text-gray-900">{detailOrder.deliveryNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => printInvoice(detailOrder)}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  In hóa đơn
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setDetailOrder(null)
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && approvalOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Từ chối yêu cầu hoàn thành</h3>
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setApprovalOrder(null)
                  setRejectionReason("")
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Đơn hàng <span className="font-semibold">#{approvalOrder.id}</span> đang chờ xác nhận hoàn thành.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Vui lòng nhập lý do từ chối:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ví dụ: Đơn hàng chưa được giao thành công, khách hàng chưa nhận hàng..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApproveCompletion(false)}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Xác nhận từ chối
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setApprovalOrder(null)
                  setRejectionReason("")
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

