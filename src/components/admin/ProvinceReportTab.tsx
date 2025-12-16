"use client"

import { useEffect, useState } from "react"
import {
  ReportSummary,
  getReportSummary
} from "@/lib/api"

export default function ProvinceReportTab() {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const summaryData = await getReportSummary()
      setSummary(summaryData)
    } catch (err) {
      console.error("❌ Failed to load summary:", err)
      setError(err instanceof Error ? err.message : "Không thể tải báo cáo tổng quan")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4">Đang tải báo cáo...</p>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>{error || "Không thể tải báo cáo"}</p>
        <button
          onClick={loadReport}
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-indigo-700 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Thử lại
        </button>
      </div>
    )
  }

  const summaryCards = [
    {
      label: "Tổng doanh nghiệp",
      value: summary.totalEnterprises,
      accent: "from-blue-50 to-blue-100 border-blue-200 text-blue-900",
      icon: "🏢"
    },
    {
      label: "Tổng danh mục",
      value: summary.totalCategories,
      accent: "from-sky-50 to-sky-100 border-sky-200 text-sky-900",
      icon: "📁"
    },
    {
      label: "Tổng sản phẩm",
      value: summary.totalProducts,
      accent: "from-green-50 to-green-100 border-green-200 text-green-900",
      icon: "📦"
    },
    {
      label: "Đơn OCOP",
      value: summary.totalApplications,
      accent: "from-purple-50 to-purple-100 border-purple-200 text-purple-900",
      icon: "⭐"
    },
    {
      label: "Đơn đang chờ",
      value: summary.pendingApplications,
      accent: "from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-900",
      icon: "⏳"
    },
    {
      label: "Đơn hàng",
      value: summary.totalOrders,
      accent: "from-orange-50 to-orange-100 border-orange-200 text-orange-900",
      icon: "🧾"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📊 Báo cáo toàn tỉnh</h2>
            <p className="text-white/90 text-lg">Tổng hợp và phân tích dữ liệu toàn tỉnh Gia Lai</p>
          </div>
          <button
            onClick={loadReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <svg 
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaryCards.map((card, index) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.accent} rounded-2xl p-6 border-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}
            style={{
              animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide mb-2">{card.label}</p>
                <p className="text-4xl font-extrabold">{card.value}</p>
              </div>
              <div className="text-5xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-green-200">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-md">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-xl font-bold text-green-800">
              Trạng thái sản phẩm
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-green-200">
              <span className="text-sm font-semibold text-gray-700">✅ Đã duyệt</span>
              <span className="text-lg font-bold text-green-600">
                {summary.approvedProducts}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-yellow-200">
              <span className="text-sm font-semibold text-gray-700">⏳ Chờ duyệt</span>
              <span className="text-lg font-bold text-yellow-600">
                {summary.pendingProducts}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-red-200">
              <span className="text-sm font-semibold text-gray-700">❌ Đã từ chối</span>
              <span className="text-lg font-bold text-red-600">
                {summary.rejectedProducts}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-indigo-200">
            <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-indigo-800">
              Người dùng & vai trò
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-indigo-200">
              <span className="text-sm font-semibold text-gray-700">🛒 Khách hàng</span>
              <span className="text-lg font-bold text-indigo-600">
                {summary.totalCustomers}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-indigo-200">
              <span className="text-sm font-semibold text-gray-700">🏢 Enterprise Admin</span>
              <span className="text-lg font-bold text-indigo-600">
                {summary.totalEnterpriseAdmins}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-indigo-200">
              <span className="text-sm font-semibold text-gray-700">💳 Thanh toán</span>
              <span className="text-lg font-bold text-indigo-600">
                {summary.totalPayments}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-amber-200">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-amber-800">
              Doanh thu thanh toán
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-green-200">
              <span className="text-sm font-semibold text-gray-700">✅ Đã thanh toán</span>
              <span className="text-lg font-bold text-green-600">
                {summary.paidPaymentsAmount.toLocaleString("vi-VN")} ₫
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-yellow-200">
              <span className="text-sm font-semibold text-gray-700">⏳ Đang chờ</span>
              <span className="text-lg font-bold text-yellow-600">
                {summary.awaitingTransferAmount.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

