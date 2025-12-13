"use client"

import { useState, useEffect } from "react"
import { getTransactions, type Transaction } from "@/lib/api"

export default function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTransactions()
      setTransactions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách giao dịch")
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false
    if (filterType !== "all" && t.type !== filterType) return false
    return true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("vi-VN")
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "bg-green-100 text-green-800 border-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "payment":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "refund":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "withdrawal":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Đang tải danh sách giao dịch...</p>
      </div>
    )
  }

  const uniqueStatuses = Array.from(new Set(transactions.map((t) => t.status)))
  const uniqueTypes = Array.from(new Set(transactions.map((t) => t.type)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">💳 Quản lý Giao dịch</h2>
            <p className="text-white/90 text-lg">Theo dõi và quản lý tất cả giao dịch trong hệ thống</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
            <div className="text-2xl font-bold">{transactions.length}</div>
            <div className="text-sm opacity-90">Tổng giao dịch</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Bộ lọc</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all bg-white cursor-pointer"
            >
              <option value="all">📋 Tất cả</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'completed' || status === 'success' ? '✅' : status === 'pending' ? '⏳' : '❌'} {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Loại giao dịch</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all bg-white cursor-pointer"
            >
              <option value="all">📋 Tất cả</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'payment' ? '💳' : type === 'refund' ? '↩️' : '💰'} {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredTransactions.length !== transactions.length && (
          <div className="mt-4 text-sm text-gray-600">
            Hiển thị {filteredTransactions.length} / {transactions.length} giao dịch
          </div>
        )}
      </div>

      {/* Transactions List */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-2">Lỗi</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
          <div className="text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 font-medium text-lg mb-2">Không có giao dịch nào</p>
            <p className="text-gray-400 text-sm">
              {filterStatus !== "all" || filterType !== "all"
                ? "Thử thay đổi bộ lọc để xem thêm kết quả"
                : "Chưa có giao dịch nào trong hệ thống"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Số tiền
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Loại
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction, index) => (
                  <tr 
                    key={transaction.id} 
                    className="hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-cyan-50/50 transition-all duration-200"
                    style={{
                      animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">#{transaction.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getTypeColor(transaction.type)}`}
                      >
                        {transaction.type === 'payment' ? '💳' : transaction.type === 'refund' ? '↩️' : '💰'} {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(transaction.status)}`}
                      >
                        {transaction.status === 'completed' || transaction.status === 'success' ? '✅' : transaction.status === 'pending' ? '⏳' : '❌'} {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                      {transaction.orderId ? `#${transaction.orderId}` : <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                      {transaction.userId ? `#${transaction.userId}` : <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-t-2 border-gray-200">
            <div className="text-sm font-semibold text-gray-700">
              Tổng cộng: <span className="text-lg font-bold text-teal-600">{filteredTransactions.length}</span> giao dịch
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

