"use client"

import { useEffect, useState } from "react"
import { getProvinceReport } from "@/lib/api"
import type { ProvinceReport } from "@/lib/api"

export default function ProvinceReportTab() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ProvinceReport | null>(null)

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    setLoading(true)
    try {
      const data = await getProvinceReport()
      setReport(data)
    } catch (err) {
      console.error('Failed to load report:', err)
      setReport(null)
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

  if (!report) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Không thể tải báo cáo</p>
        <button
          onClick={loadReport}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Thử lại
        </button>
      </div>
    )
  }

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Tổng doanh nghiệp</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{report.totalEnterprises}</p>
            </div>
            <div className="text-4xl">🏢</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Tổng sản phẩm</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{report.totalProducts}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Đơn đăng ký OCOP</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{report.totalOcopRegistrations}</p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Chờ duyệt</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">{report.pendingRegistrations}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Đã duyệt</p>
              <p className="text-3xl font-bold text-emerald-900 mt-2">{report.approvedRegistrations}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Đã từ chối</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{report.rejectedRegistrations}</p>
            </div>
            <div className="text-4xl">❌</div>
          </div>
        </div>
      </div>

      {/* Charts/Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enterprises by District */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh nghiệp theo Quận/Huyện</h3>
          {report.enterprisesByDistrict && report.enterprisesByDistrict.length > 0 ? (
            <div className="space-y-3">
              {report.enterprisesByDistrict.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">{item.district || 'Chưa xác định'}</span>
                  <span className="text-indigo-600 font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Products by Category */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm theo Danh mục</h3>
          {report.productsByCategory && report.productsByCategory.length > 0 ? (
            <div className="space-y-3">
              {report.productsByCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">{item.category || 'Chưa xác định'}</span>
                  <span className="text-green-600 font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Registrations by Status */}
        <div className="bg-white border rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Đơn đăng ký theo Trạng thái</h3>
          {report.registrationsByStatus && report.registrationsByStatus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.registrationsByStatus.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      {item.status === 'pending' ? 'Chờ duyệt' :
                       item.status === 'approved' ? 'Đã duyệt' :
                       item.status === 'rejected' ? 'Đã từ chối' : item.status}
                    </span>
                    <span className={`font-semibold ${
                      item.status === 'pending' ? 'text-yellow-600' :
                      item.status === 'approved' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  )
}

