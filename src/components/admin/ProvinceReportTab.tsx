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
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Báo cáo toàn tỉnh</h2>
        <button
          onClick={loadReport}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
        >
          🔄 Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.accent} rounded-lg p-6 border`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{card.label}</p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trạng thái sản phẩm
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Đã duyệt</span>
              <span className="font-semibold text-green-600">
                {summary.approvedProducts}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chờ duyệt</span>
              <span className="font-semibold text-yellow-600">
                {summary.pendingProducts}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đã từ chối</span>
              <span className="font-semibold text-red-600">
                {summary.rejectedProducts}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Người dùng & vai trò
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Khách hàng</span>
              <span className="font-semibold text-indigo-600">
                {summary.totalCustomers}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Enterprise Admin</span>
              <span className="font-semibold text-indigo-600">
                {summary.totalEnterpriseAdmins}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Thanh toán</span>
              <span className="font-semibold text-indigo-600">
                {summary.totalPayments}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Doanh thu thanh toán
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Đã thanh toán</span>
              <span className="font-semibold text-green-600">
                {summary.paidPaymentsAmount.toLocaleString("vi-VN")} ₫
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đang chờ chuyển khoản</span>
              <span className="font-semibold text-yellow-600">
                {summary.awaitingTransferAmount.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

