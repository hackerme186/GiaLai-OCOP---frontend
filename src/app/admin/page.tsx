"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { getCurrentUser, getEnterprises, deleteEnterprise, setEnterpriseLock } from "@/lib/api"
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
      const tokenRole = (getRoleFromToken(token) || "").toLowerCase()
      if (tokenRole === 'admin') {
        setAuthorized(true)
        // Cố gắng lấy tên hiển thị từ API nhưng không bắt buộc
        try {
          const me = await getCurrentUser()
          setName((me.name || me.fullName || me.username || "Admin").toString())
        } catch {}
        return
      }
      // 2) Fallback: gọi API /me nếu token không chứa role
      try {
        const me = await getCurrentUser()
        const role = (me.role || (me as any).roles)?.toString?.() || ""
        const ok = role.toLowerCase() === "admin"
        if (!ok) {
          router.replace("/login")
          return
        }
        setName((me.name || me.fullName || me.username || "Admin").toString())
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

  const handleLock = async (id: any, currentLocked: boolean) => {
    try {
      await setEnterpriseLock(id, !currentLocked)
      const res = await getEnterprises({ ...filters, page, limit })
      setItems(res.items || [])
    } catch (err) {
      console.error('Lock/unlock failed:', err)
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
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <Header />
      <main>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold text-gray-900">Quản trị Doanh nghiệp</h1>
          <p className="text-gray-600 mt-2">Xin chào, {name}</p>

          {/* Filters */}
          <div className="mt-6 bg-white border rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input 
                value={filters.search} 
                onChange={e => setFilters(v => ({ ...v, search: e.target.value }))} 
                placeholder="Tìm theo tên" 
                className="rounded border px-3 py-2" 
              />
              <input 
                value={filters.province} 
                onChange={e => setFilters(v => ({ ...v, province: e.target.value }))} 
                placeholder="Tỉnh/Thành" 
                className="rounded border px-3 py-2" 
              />
              <input 
                value={filters.district} 
                onChange={e => setFilters(v => ({ ...v, district: e.target.value }))} 
                placeholder="Quận/Huyện" 
                className="rounded border px-3 py-2" 
              />
              <input 
                value={filters.field} 
                onChange={e => setFilters(v => ({ ...v, field: e.target.value }))} 
                placeholder="Lĩnh vực" 
                className="rounded border px-3 py-2" 
              />
              <input 
                value={filters.status} 
                onChange={e => setFilters(v => ({ ...v, status: e.target.value }))} 
                placeholder="Trạng thái" 
                className="rounded border px-3 py-2" 
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={handleSearch} className="px-4 py-2 bg-indigo-600 text-white rounded">Tìm kiếm</button>
              <button onClick={() => setFilters({ search: '', province: '', district: '', field: '', status: '' })} className="px-4 py-2 bg-gray-100 rounded">Xóa lọc</button>
              <Link href="/ocop-register" className="ml-auto px-4 py-2 bg-green-600 text-white rounded inline-flex items-center">+ Thêm doanh nghiệp</Link>
            </div>
          </div>

          {/* List */}
          <div className="mt-4 bg-white border rounded-lg shadow-sm overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">Tên</th>
                  <th className="text-left px-4 py-2">Mô tả</th>
                  <th className="text-left px-4 py-2">Địa chỉ</th>
                  <th className="text-left px-4 py-2">Lĩnh vực</th>
                  <th className="text-left px-4 py-2">Trạng thái</th>
                  <th className="text-right px-4 py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{it.name || it.Name || '-'}</td>
                    <td className="px-4 py-2">{it.description || it.Description || '-'}</td>
                    <td className="px-4 py-2">{it.address || it.Address || '-'}</td>
                    <td className="px-4 py-2">{it.businessField || it.BusinessField || '-'}</td>
                    <td className="px-4 py-2">{it.locked ? 'Khóa' : (it.status || 'Hoạt động')}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button 
                        onClick={() => handleLock(it.id, it.locked)} 
                        className="px-3 py-1 rounded bg-yellow-100"
                      >
                        {it.locked ? 'Mở khóa' : 'Khóa'}
                      </button>
                      <button 
                        onClick={() => handleDelete(it.id)} 
                        className="px-3 py-1 rounded bg-red-100 text-red-600"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {(!items || items.length === 0) && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                      {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
              <span>Tổng: {total}</span>
              <div className="space-x-2">
                <button 
                  disabled={page <= 1} 
                  onClick={async () => {
                    const p = Math.max(1, page - 1)
                    setPage(p)
                    const res = await getEnterprises({ ...filters, page: p, limit })
                    setItems(res.items || [])
                    setTotal(res.total || 0)
                  }} 
                  className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                >
                  Trước
                </button>
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
                  className="px-3 py-1 rounded bg-gray-100"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


