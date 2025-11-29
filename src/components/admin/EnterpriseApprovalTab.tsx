"use client"

import { useEffect, useMemo, useState } from "react"
import {
  EnterpriseApplication,
  approveEnterpriseApplication,
  getEnterpriseApplications,
  rejectEnterpriseApplication
} from "@/lib/api"

const PAGE_SIZE = 10

export default function EnterpriseApprovalTab() {
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<EnterpriseApplication[]>([])
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search: "",
    address: "",
    field: "",
    status: "Pending"
  })
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({})
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null)
  const [viewingApplication, setViewingApplication] = useState<EnterpriseApplication | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEnterpriseApplications()
      const list = Array.isArray(data)
        ? data
        : (data as any)?.items || (data as any)?.data || []
      setApplications(list)
    } catch (err) {
      console.error("Failed to load enterprise applications:", err)
      setApplications([])
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách hồ sơ OCOP"
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch = filters.search
        ? app.enterpriseName
          ?.toLowerCase()
          .includes(filters.search.toLowerCase())
        : true
      const matchAddress = filters.address
        ? (
          `${app.address} ${app.district} ${app.province}`.toLowerCase()
        ).includes(filters.address.toLowerCase())
        : true
      const matchField = filters.field
        ? app.businessField
          ?.toLowerCase()
          .includes(filters.field.toLowerCase())
        : true
      const matchStatus =
        !filters.status || filters.status === "all"
          ? true
          : (app.status || "Pending")
            .toLowerCase()
            .includes(filters.status.toLowerCase())

      return matchSearch && matchAddress && matchField && matchStatus
    })
  }, [applications, filters])

  const totalPages = Math.ceil(filteredApplications.length / PAGE_SIZE) || 1
  const pagedApplications = filteredApplications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  useEffect(() => {
    if (page > totalPages) {
      setPage(Math.max(1, totalPages))
    }
  }, [totalPages, page])

  const handleApprove = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn duyệt hồ sơ này?")) return
    try {
      await approveEnterpriseApplication(id)
      alert("Đã duyệt thành công!")
      await loadApplications()
    } catch (err) {
      alert(
        "Duyệt thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định")
      )
    }
  }

  const handleReject = async (id: number) => {
    const reason = (rejectReason[id] || "").trim()
    if (!reason) {
      alert("Vui lòng nhập lý do từ chối")
      return
    }
    if (!confirm("Bạn có chắc chắn muốn từ chối hồ sơ này?")) return
    try {
      await rejectEnterpriseApplication(id, reason)
      alert("Đã từ chối thành công!")
      setShowRejectModal(null)
      setRejectReason((prev) => ({ ...prev, [id]: "" }))
      await loadApplications()
    } catch (err) {
      alert(
        "Từ chối thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định")
      )
    }
  }

  const handleSearch = () => {
    setPage(1)
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Duyệt đơn đăng ký doanh nghiệp</h2>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={filters.search}
            onChange={(e) =>
              setFilters((v) => ({ ...v, search: e.target.value }))
            }
            placeholder="Tìm theo tên doanh nghiệp"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={filters.address}
            onChange={(e) =>
              setFilters((v) => ({ ...v, address: e.target.value }))
            }
            placeholder="Địa chỉ / tỉnh / huyện"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={filters.field}
            onChange={(e) =>
              setFilters((v) => ({ ...v, field: e.target.value }))
            }
            placeholder="Lĩnh vực kinh doanh"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((v) => ({ ...v, status: e.target.value }))
            }
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="Pending">Chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Đã từ chối</option>
            <option value="all">Tất cả</option>
          </select>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleSearch}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-indigo-700 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm
          </button>
          <button
            onClick={() => {
              setFilters({
                search: "",
                address: "",
                field: "",
                status: "Pending"
              })
              setPage(1)
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Xóa lọc
          </button>
        </div>
      </div>

      {/* List */}
      <div className="border rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : pagedApplications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có dữ liệu</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Tên doanh nghiệp
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Địa chỉ
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Lĩnh vực
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Trạng thái
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedApplications.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {item.enterpriseName || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {[item.address, item.district, item.province]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.businessField || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${(item.status || "").toLowerCase() === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : (item.status || "").toLowerCase() === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {item.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingApplication(item)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Xem chi tiết
                      </button>
                      {(item.status || "").toLowerCase() === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Duyệt
                          </button>
                          <button
                            onClick={() => setShowRejectModal(item.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {filteredApplications.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-gray-600">
              Tổng: {filteredApplications.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-200 hover:to-gray-300 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Trước
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Trang {page}/{totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-200 hover:to-gray-300 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none"
              >
                Sau
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewingApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Chi tiết đơn đăng ký</h3>
              <button
                onClick={() => setViewingApplication(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    (viewingApplication.status || "").toLowerCase() === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : (viewingApplication.status || "").toLowerCase() === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }`}>
                    {viewingApplication.status || "Pending"}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Ngày tạo: {viewingApplication.createdAt ? new Date(viewingApplication.createdAt).toLocaleDateString("vi-VN") : "-"}
                </div>
              </div>

              {/* Enterprise Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  1. Thông tin doanh nghiệp
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tên doanh nghiệp</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.enterpriseName || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Loại hình doanh nghiệp</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.businessType || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mã số thuế</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.taxCode || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Số giấy phép kinh doanh</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.businessLicenseNumber || "-"}</p>
                  </div>
                  {viewingApplication.licenseIssuedDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngày cấp giấy phép</label>
                      <p className="text-gray-900 mt-1">{new Date(viewingApplication.licenseIssuedDate).toLocaleDateString("vi-VN")}</p>
                    </div>
                  )}
                  {viewingApplication.licenseIssuedBy && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nơi cấp giấy phép</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.licenseIssuedBy}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                    <p className="text-gray-900 mt-1">
                      {[
                        viewingApplication.address,
                        viewingApplication.ward,
                        viewingApplication.district,
                        viewingApplication.province
                      ].filter(Boolean).join(", ") || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.phoneNumber || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email liên hệ</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.emailContact || "-"}</p>
                  </div>
                  {viewingApplication.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Website</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.website}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Lĩnh vực kinh doanh</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.businessField || "-"}</p>
                  </div>
                  {viewingApplication.productionLocation && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Địa điểm sản xuất</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.productionLocation}</p>
                    </div>
                  )}
                  {viewingApplication.numberOfEmployees && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Số lao động</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.numberOfEmployees}</p>
                    </div>
                  )}
                  {viewingApplication.productionScale && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quy mô sản xuất</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.productionScale}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Representative Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  2. Thông tin đại diện pháp luật
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Họ tên đại diện</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.representativeName || "-"}</p>
                  </div>
                  {viewingApplication.representativePosition && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Chức vụ đại diện</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.representativePosition}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">CMND/CCCD</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.representativeIdNumber || "-"}</p>
                  </div>
                  {viewingApplication.representativeIdIssuedDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngày cấp</label>
                      <p className="text-gray-900 mt-1">{new Date(viewingApplication.representativeIdIssuedDate).toLocaleDateString("vi-VN")}</p>
                    </div>
                  )}
                  {viewingApplication.representativeIdIssuedBy && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nơi cấp</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.representativeIdIssuedBy}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  3. Thông tin sản phẩm
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tên sản phẩm OCOP</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.productName || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nhóm sản phẩm</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.productCategory || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Mô tả sản phẩm</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{viewingApplication.productDescription || "-"}</p>
                  </div>
                  {viewingApplication.productOrigin && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Xuất xứ sản phẩm</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.productOrigin}</p>
                    </div>
                  )}
                  {viewingApplication.productCertifications && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Chứng nhận sản phẩm</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.productCertifications}</p>
                    </div>
                  )}
                  {viewingApplication.productImages && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Hình ảnh sản phẩm</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {viewingApplication.productImages.split(',').filter(Boolean).map((url, idx) => (
                          <img
                            key={idx}
                            src={url.trim()}
                            alt={`Product ${idx + 1}`}
                            className="w-full h-32 object-cover rounded border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              {viewingApplication.additionalNotes && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Ghi chú bổ sung
                  </h4>
                  <p className="text-gray-900 whitespace-pre-wrap">{viewingApplication.additionalNotes}</p>
                </div>
              )}

              {/* Admin Comment (if rejected) */}
              {viewingApplication.adminComment && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="text-lg font-semibold text-red-900 mb-2">Lý do từ chối</h4>
                  <p className="text-red-800 whitespace-pre-wrap">{viewingApplication.adminComment}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setViewingApplication(null)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Đóng
                </button>
                {(viewingApplication.status || "").toLowerCase() === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        setViewingApplication(null)
                        handleApprove(viewingApplication.id)
                      }}
                      className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => {
                        setViewingApplication(null)
                        setShowRejectModal(viewingApplication.id)
                      }}
                      className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Từ chối
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Từ chối đơn đăng ký</h3>
            <textarea
              value={rejectReason[showRejectModal] || ""}
              onChange={(e) =>
                setRejectReason((prev) => ({
                  ...prev,
                  [showRejectModal]: e.target.value
                }))
              }
              placeholder="Nhập lý do từ chối..."
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 min-h-[100px]"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectReason((prev) => ({ ...prev, [showRejectModal]: "" }))
                  setShowRejectModal(null)
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Hủy
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

