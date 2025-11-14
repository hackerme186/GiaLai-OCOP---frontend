"use client"

import { useEffect, useState } from "react"
import { getEnterprises, approveEnterpriseRegistration, rejectEnterpriseRegistration } from "@/lib/api"
import type { EnterpriseSummary } from "@/lib/api"

export default function EnterpriseApprovalTab() {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<EnterpriseSummary[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ search: '', address: '', field: '', status: 'pending' })
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({})
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)

  useEffect(() => {
    loadItems()
  }, [page, filters])

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await getEnterprises({ ...filters, page, limit })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('Failed to load enterprises:', err)
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number | string) => {
    if (!confirm('Bạn có chắc chắn muốn duyệt đơn đăng ký này?')) return
    try {
      await approveEnterpriseRegistration(id)
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
    if (!confirm('Bạn có chắc chắn muốn từ chối đơn đăng ký này?')) return
    try {
      await rejectEnterpriseRegistration(id, reason)
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
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Duyệt đơn đăng ký doanh nghiệp</h2>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input 
            value={filters.search} 
            onChange={e => setFilters(v => ({ ...v, search: e.target.value }))} 
            placeholder="Tìm theo tên" 
            className="rounded border border-gray-300 px-3 py-2 text-sm" 
          />
          <input 
            value={filters.address} 
            onChange={e => setFilters(v => ({ ...v, address: e.target.value }))} 
            placeholder="Địa chỉ" 
            className="rounded border border-gray-300 px-3 py-2 text-sm" 
          />
          <input 
            value={filters.field} 
            onChange={e => setFilters(v => ({ ...v, field: e.target.value }))} 
            placeholder="Lĩnh vực" 
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
              setFilters({ search: '', address: '', field: '', status: 'pending' })
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
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có dữ liệu</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Tên doanh nghiệp</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Địa chỉ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Lĩnh vực</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Trạng thái</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id ?? `item-${index}`} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.name || item.Name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.address || item.Address || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.businessField || item.BusinessField || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      (item.status || '').toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      (item.status || '').toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status || 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {(item.status || '').toLowerCase() === 'pending' && (
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
                    {(item.status || '').toLowerCase() !== 'pending' && (
                      <span className="text-gray-400 text-xs">Đã xử lý</span>
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Từ chối đơn đăng ký</h3>
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

