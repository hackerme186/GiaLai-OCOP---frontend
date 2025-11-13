"use client"

import { useEffect, useState } from "react"
import { getOcopRegistrations, approveOcopRegistration, rejectOcopRegistration } from "@/lib/api"
import type { OcopRegistration } from "@/lib/api"

export default function OcopApprovalTab() {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<OcopRegistration[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ search: '', status: 'pending' })
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({})
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<OcopRegistration | null>(null)

  useEffect(() => {
    loadItems()
  }, [page, filters])

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await getOcopRegistrations({ ...filters, page, limit })
      setItems(res.items || res.data || res.registrations || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('Failed to load OCOP registrations:', err)
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number | string) => {
    if (!confirm('Bạn có chắc chắn muốn duyệt sản phẩm OCOP này?')) return
    try {
      await approveOcopRegistration(id)
      alert('Đã duyệt thành công!')
      loadItems()
    } catch (err) {
      alert('Duyệt thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'))
    }
  }

  const handleReject = async (id: number | string) => {
    const reason = rejectReason[id]?.trim()
    if (!reason) {
      alert('Vui lòng nhập lý do từ chối')
      return
    }
    if (!confirm('Bạn có chắc chắn muốn từ chối sản phẩm OCOP này?')) return
    try {
      await rejectOcopRegistration(id, reason)
      alert('Đã từ chối thành công!')
      setShowRejectModal(null)
      setRejectReason({ ...rejectReason, [id]: '' })
      loadItems()
    } catch (err) {
      alert('Từ chối thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'))
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadItems()
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Duyệt sản phẩm OCOP</h2>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input 
            value={filters.search} 
            onChange={e => setFilters(v => ({ ...v, search: e.target.value }))} 
            placeholder="Tìm theo tên sản phẩm hoặc doanh nghiệp" 
            className="rounded border border-gray-300 px-3 py-2 text-sm" 
          />
          <select
            value={filters.status}
            onChange={e => setFilters(v => ({ ...v, status: e.target.value }))}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
            <option value="">Tất cả</option>
          </select>
          <div className="flex gap-2">
            <button 
              onClick={handleSearch} 
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
            >
              Tìm kiếm
            </button>
            <button 
              onClick={() => {
                setFilters({ search: '', status: 'pending' })
                setPage(1)
              }} 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="border rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có dữ liệu</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Tên sản phẩm</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Doanh nghiệp</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Danh mục</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Trạng thái</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id ?? `item-${index}`} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.productName || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.enterpriseName || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.productCategory || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      (item.status || 'pending') === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      (item.status || '') === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'pending' ? 'Chờ duyệt' : 
                       item.status === 'approved' ? 'Đã duyệt' : 
                       item.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium"
                    >
                      Chi tiết
                    </button>
                    {(item.status || 'pending') === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApprove(item.id)} 
                          className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs font-medium"
                        >
                          Duyệt
                        </button>
                        <button 
                          onClick={() => setShowRejectModal(String(item.id))} 
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs font-medium"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-gray-600">Tổng: {total}</span>
            <div className="space-x-2">
              <button 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50 hover:bg-gray-200"
              >
                Trước
              </button>
              <span className="px-3 py-1">Trang {page}</span>
              <button 
                onClick={() => setPage(p => p + 1)} 
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chi tiết sản phẩm OCOP</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div><strong>Tên sản phẩm:</strong> {selectedItem.productName || '-'}</div>
              <div><strong>Doanh nghiệp:</strong> {selectedItem.enterpriseName || '-'}</div>
              <div><strong>Danh mục:</strong> {selectedItem.productCategory || '-'}</div>
              <div><strong>Mô tả:</strong> {selectedItem.productDescription || '-'}</div>
              <div><strong>Xuất xứ:</strong> {selectedItem.productOrigin || '-'}</div>
              <div><strong>Địa chỉ:</strong> {selectedItem.address || '-'}</div>
              <div><strong>Tỉnh/Thành:</strong> {selectedItem.province || '-'}</div>
              <div><strong>Quận/Huyện:</strong> {selectedItem.district || '-'}</div>
              <div><strong>Điện thoại:</strong> {selectedItem.phoneNumber || '-'}</div>
              <div><strong>Email:</strong> {selectedItem.emailContact || '-'}</div>
              {selectedItem.productCertifications && selectedItem.productCertifications.length > 0 && (
                <div>
                  <strong>Chứng nhận:</strong> {selectedItem.productCertifications.join(', ')}
                </div>
              )}
              {selectedItem.additionalNotes && (
                <div><strong>Ghi chú:</strong> {selectedItem.additionalNotes}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Từ chối sản phẩm OCOP</h3>
            <textarea
              value={rejectReason[showRejectModal] || ''}
              onChange={e => setRejectReason({ ...rejectReason, [showRejectModal]: e.target.value })}
              placeholder="Nhập lý do từ chối..."
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectReason({ ...rejectReason, [showRejectModal]: '' })
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

