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
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
          >
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
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
          >
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
                  <td className="px-4 py-3 text-right space-x-2">
                    {(item.status || "").toLowerCase() === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs font-medium"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => setShowRejectModal(item.id)}
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs font-medium"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {(item.status || "").toLowerCase() !== "pending" && (
                      <span className="text-gray-400 text-xs">Đã xử lý</span>
                    )}
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
            <div className="space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50 hover:bg-gray-200"
              >
                Trước
              </button>
              <span className="px-3 py-1">
                Trang {page}/{totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

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
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectReason((prev) => ({ ...prev, [showRejectModal]: "" }))
                  setShowRejectModal(null)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

