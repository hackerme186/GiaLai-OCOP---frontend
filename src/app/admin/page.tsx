"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { getCurrentUser, getEnterprises, deleteEnterprise } from "@/lib/api"
import { getAuthToken, getRoleFromToken } from "@/lib/auth"

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [name, setName] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ search: '', province: '', district: '', field: '', status: '' })

  useEffect(() => {
    const check = async () => {
      // 1) Prefer role từ JWT để tránh phụ thuộc /me
      const token = getAuthToken()
      const tokenRole = getRoleFromToken(token) || ""
      // Chỉ cho phép SystemAdmin
      if (tokenRole === 'SystemAdmin' || tokenRole.toLowerCase() === 'systemadmin') {
        setAuthorized(true)
        // Cố gắng lấy tên hiển thị từ API nhưng không bắt buộc
        try {
          const me = await getCurrentUser()
          setName((me.name || me.fullName || me.username || "System Admin").toString())
        } catch {}
        return
      }
      // 2) Fallback: gọi API /me nếu token không chứa role
      try {
        const me = await getCurrentUser()
        const role = (me.role || (me as any).roles)?.toString?.() || ""
        // Chỉ cho phép SystemAdmin (case-insensitive check)
        const ok = role === "SystemAdmin" || role.toLowerCase() === "systemadmin"
        if (!ok) {
          router.replace("/login")
          return
        }
        setName((me.name || me.fullName || me.username || "System Admin").toString())
        setAuthorized(true)
      } catch {
        router.replace("/login")
      }
    }
    check()
  }, [router])

  // Load enterprises list khi trang được authorized
  useEffect(() => {
    if (!authorized) return
    const load = async () => {
      setLoading(true)
      try {
        console.log('Loading enterprises with filters:', { ...filters, page, limit })
        const res = await getEnterprises({ ...filters, page, limit })
        console.log('Enterprises response:', res)
        setItems(res.items || [])
        setTotal(res.total || 0)
        if (res.items && res.items.length > 0) {
          console.log('Loaded enterprises:', res.items)
        } else {
          console.warn('No enterprises found in response')
        }
      } catch (err) {
        console.error('Failed to load enterprises:', err)
        setItems([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authorized, page, limit])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await getEnterprises({ ...filters, page: 1, limit })
      setItems(res.items || [])
      setTotal(res.total || 0)
      setPage(1)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }


  const handleDelete = async (id: any) => {
    if (!confirm('Xóa doanh nghiệp này?')) return
    try {
      await deleteEnterprise(id)
      const res = await getEnterprises({ ...filters, page, limit })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  if (authorized === null) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" suppressHydrationWarning>
      <Header />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản trị Doanh nghiệp</h1>
                <p className="text-gray-600 text-lg">Xin chào, <span className="font-semibold text-indigo-600">{name}</span></p>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="bg-white rounded-lg shadow-md px-4 py-2 border border-gray-200">
                  <div className="text-xs text-gray-500">Tổng doanh nghiệp</div>
                  <div className="text-2xl font-bold text-indigo-600">{total}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Bộ lọc tìm kiếm
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên doanh nghiệp</label>
                <input 
                  value={filters.search} 
                  onChange={e => setFilters(v => ({ ...v, search: e.target.value }))} 
                  placeholder="Tìm theo tên" 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành</label>
                <input 
                  value={filters.province} 
                  onChange={e => setFilters(v => ({ ...v, province: e.target.value }))} 
                  placeholder="Tỉnh/Thành" 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                <input 
                  value={filters.district} 
                  onChange={e => setFilters(v => ({ ...v, district: e.target.value }))} 
                  placeholder="Quận/Huyện" 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lĩnh vực</label>
                <input 
                  value={filters.field} 
                  onChange={e => setFilters(v => ({ ...v, field: e.target.value }))} 
                  placeholder="Lĩnh vực" 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <input 
                  value={filters.status} 
                  onChange={e => setFilters(v => ({ ...v, status: e.target.value }))} 
                  placeholder="Trạng thái" 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button 
                onClick={handleSearch} 
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
              <button 
                onClick={() => setFilters({ search: '', province: '', district: '', field: '', status: '' })} 
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Xóa lọc
              </button>
            </div>
          </div>

          {/* List */}
          {loading && items.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600 text-lg font-medium">Không có dữ liệu</p>
              <p className="text-gray-500 text-sm mt-2">Thử thay đổi bộ lọc để tìm kiếm</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tên</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mô tả</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Địa chỉ</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Lĩnh vực</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((it, index) => (
                      <tr 
                        key={it.id ? `enterprise-${it.id}` : `enterprise-index-${index}`} 
                        className="hover:bg-indigo-50/50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">{it.name || it.Name || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">{it.description || it.Description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{it.address || it.Address || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{it.businessField || it.BusinessField || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            it.locked 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {it.locked ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Khóa
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {it.status || 'Hoạt động'}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => router.push(`/enterprise-admin?enterpriseId=${it.id}`)} 
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              Quản lý sản phẩm
                            </button>
                            <button 
                              onClick={() => handleDelete(it.id)} 
                              className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">Tổng:</span>
                  <span className="text-sm font-bold text-indigo-600">{total}</span>
                  <span className="text-sm text-gray-500">doanh nghiệp</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={page <= 1} 
                    onClick={async () => {
                      const p = Math.max(1, page - 1)
                      setPage(p)
                      const res = await getEnterprises({ ...filters, page: p, limit })
                      setItems(res.items || [])
                      setTotal(res.total || 0)
                    }} 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Trước
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    Trang {page}
                  </span>
                  <button 
                    onClick={async () => {
                      const p = page + 1
                      setPage(p)
                      const res = await getEnterprises({ ...filters, page: p, limit })
                      if ((res.items || []).length === 0) {
                        setPage(page)
                        return
                      }
                      setItems(res.items || [])
                      setTotal(res.total || 0)
                    }} 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                  >
                    Sau
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}


