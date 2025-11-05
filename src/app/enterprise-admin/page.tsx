"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { getCurrentUser, getEnterprises, getEnterpriseById, updateEnterprise, getProductsByEnterprise, createProduct, updateProduct, deleteProduct } from "@/lib/api"
import { getAuthToken, getRoleFromToken } from "@/lib/auth"
import type { EnterpriseDetail, EnterpriseSummary, Product, CreateProductPayload } from "@/lib/api"

export default function EnterpriseAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [name, setName] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [enterprise, setEnterprise] = useState<EnterpriseDetail | null>(null)
  const [enterpriseId, setEnterpriseId] = useState<number | string | null>(null)
  const [isSystemAdmin, setIsSystemAdmin] = useState(false)
  const [editing, setEditing] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productFormData, setProductFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
  })
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    businessField: "",
    province: "",
    district: "",
    ward: "",
  })

  useEffect(() => {
    const check = async () => {
      // Kiểm tra enterpriseId từ query params (nếu SystemAdmin truy cập)
      const enterpriseIdFromQuery = searchParams.get('enterpriseId')
      
      // 1) Prefer role từ JWT để tránh phụ thuộc /me
      const token = getAuthToken()
      const tokenRole = getRoleFromToken(token) || ""
      
      // Nếu có enterpriseId từ query và là SystemAdmin, cho phép truy cập
      if (enterpriseIdFromQuery && (tokenRole === 'SystemAdmin' || tokenRole.toLowerCase() === 'systemadmin')) {
        setEnterpriseId(enterpriseIdFromQuery)
        setIsSystemAdmin(true)
        setAuthorized(true)
        try {
          const me = await getCurrentUser()
          setName((me.name || me.fullName || me.username || "System Admin").toString())
        } catch {}
        return
      }
      
      // Chỉ cho phép EnterpriseAdmin
      if (tokenRole === 'EnterpriseAdmin' || tokenRole.toLowerCase() === 'enterpriseadmin') {
        setAuthorized(true)
        // Lấy thông tin user và enterprise
        try {
          const me = await getCurrentUser()
          setName((me.name || me.fullName || me.username || "Enterprise Admin").toString())
          // Lấy enterpriseId từ user profile nếu có hoặc từ query params
          const eId = enterpriseIdFromQuery || (me as any).enterpriseId || (me as any).enterprise?.id
          if (eId) {
            setEnterpriseId(eId)
          }
        } catch {}
        return
      }
      // 2) Fallback: gọi API /me nếu token không chứa role
      try {
        const me = await getCurrentUser()
        const role = (me.role || (me as any).roles)?.toString?.() || ""
        
        // Nếu là SystemAdmin và có enterpriseId từ query
        if ((role === "SystemAdmin" || role.toLowerCase() === "systemadmin") && enterpriseIdFromQuery) {
          setEnterpriseId(enterpriseIdFromQuery)
          setIsSystemAdmin(true)
          setAuthorized(true)
          setName((me.name || me.fullName || me.username || "System Admin").toString())
          return
        }
        
        // Chỉ cho phép EnterpriseAdmin (case-insensitive check)
        const ok = role === "EnterpriseAdmin" || role.toLowerCase() === "enterpriseadmin"
        if (!ok) {
          router.replace("/login")
          return
        }
        setName((me.name || me.fullName || me.username || "Enterprise Admin").toString())
        // Lấy enterpriseId từ user profile nếu có hoặc từ query params
        const eId = enterpriseIdFromQuery || (me as any).enterpriseId || (me as any).enterprise?.id
        if (eId) {
          setEnterpriseId(eId)
        }
        setAuthorized(true)
      } catch {
        router.replace("/login")
      }
    }
    check()
  }, [router, searchParams])

  // Load enterprise information khi trang được authorized
  useEffect(() => {
    if (!authorized) return
    
    const loadEnterprise = async () => {
      setLoading(true)
      try {
        // Nếu có enterpriseId từ user profile, load enterprise đó
        if (enterpriseId) {
          const ent = await getEnterpriseById(enterpriseId)
          setEnterprise(ent as EnterpriseDetail)
          setFormData({
            name: ent.name || ent.Name || "",
            description: ent.description || ent.Description || "",
            address: ent.address || ent.Address || "",
            phone: ent.phone || "",
            email: ent.email || "",
            website: ent.website || "",
            businessField: ent.businessField || ent.BusinessField || "",
            province: ent.province || "",
            district: ent.district || "",
            ward: ent.ward || "",
          })
        } else {
          // Nếu không có enterpriseId, thử lấy danh sách enterprises và lấy enterprise đầu tiên
          // (giả định EnterpriseAdmin chỉ quản lý 1 enterprise)
          const res = await getEnterprises({ limit: 1 })
          if (res.items && res.items.length > 0) {
            const firstEnterprise = res.items[0]
            const entId = firstEnterprise.id
            setEnterpriseId(entId)
            const ent = await getEnterpriseById(entId)
            setEnterprise(ent as EnterpriseDetail)
            setFormData({
              name: ent.name || ent.Name || "",
              description: ent.description || ent.Description || "",
              address: ent.address || ent.Address || "",
              phone: ent.phone || "",
              email: ent.email || "",
              website: ent.website || "",
              businessField: ent.businessField || ent.BusinessField || "",
              province: ent.province || "",
              district: ent.district || "",
              ward: ent.ward || "",
            })
          }
        }
      } catch (err) {
        console.error('Failed to load enterprise:', err)
      } finally {
        setLoading(false)
      }
    }
    loadEnterprise()
  }, [authorized, enterpriseId])

  // Load products khi có enterpriseId
  useEffect(() => {
    if (!enterpriseId) return
    
    const loadProducts = async () => {
      try {
        const res = await getProductsByEnterprise(enterpriseId)
        setProducts(res.products || [])
      } catch (err) {
        console.error('Failed to load products:', err)
        setProducts([])
      }
    }
    loadProducts()
  }, [enterpriseId])

  const handleSave = async () => {
    if (!enterpriseId) return
    setLoading(true)
    try {
      await updateEnterprise(enterpriseId, formData)
      // Reload enterprise data
      const ent = await getEnterpriseById(enterpriseId)
      setEnterprise(ent as EnterpriseDetail)
      setEditing(false)
      alert('Cập nhật thành công!')
    } catch (err) {
      console.error('Update failed:', err)
      alert('Cập nhật thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (enterprise) {
      setFormData({
        name: enterprise.name || enterprise.Name || "",
        description: enterprise.description || enterprise.Description || "",
        address: enterprise.address || enterprise.Address || "",
        phone: enterprise.phone || "",
        email: enterprise.email || "",
        website: enterprise.website || "",
        businessField: enterprise.businessField || enterprise.BusinessField || "",
        province: enterprise.province || "",
        district: enterprise.district || "",
        ward: enterprise.ward || "",
      })
    }
    setEditing(false)
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setProductFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      image: "",
    })
    setShowProductForm(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      category: product.category || "",
      image: product.image || "",
    })
    setShowProductForm(true)
  }

  const handleSaveProduct = async () => {
    if (!enterpriseId) return
    if (!productFormData.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm')
      return
    }

    setLoading(true)
    try {
      const payload: CreateProductPayload = {
        name: productFormData.name,
        description: productFormData.description || undefined,
        price: productFormData.price ? parseFloat(productFormData.price) : undefined,
        category: productFormData.category || undefined,
        image: productFormData.image || undefined,
        enterpriseId: typeof enterpriseId === 'string' ? parseInt(enterpriseId) : (enterpriseId as number),
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
        alert('Cập nhật sản phẩm thành công!')
      } else {
        await createProduct(payload)
        alert('Thêm sản phẩm thành công!')
      }

      // Reload products
      const res = await getProductsByEnterprise(enterpriseId)
      setProducts(res.products || [])
      setShowProductForm(false)
      setEditingProduct(null)
    } catch (err) {
      console.error('Save product failed:', err)
      alert(editingProduct ? 'Cập nhật sản phẩm thất bại. Vui lòng thử lại.' : 'Thêm sản phẩm thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: number | string) => {
    if (!confirm('Xóa sản phẩm này?')) return
    if (!enterpriseId) return

    setLoading(true)
    try {
      await deleteProduct(productId)
      // Reload products
      const res = await getProductsByEnterprise(enterpriseId)
      setProducts(res.products || [])
      alert('Xóa sản phẩm thành công!')
    } catch (err) {
      console.error('Delete product failed:', err)
      alert('Xóa sản phẩm thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelProduct = () => {
    setShowProductForm(false)
    setEditingProduct(null)
    setProductFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      image: "",
    })
  }

  if (authorized === null) return null

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <Header />
      <main>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Quản lý Doanh nghiệp</h1>
              <p className="text-gray-600 mt-2">Xin chào, {name}</p>
            </div>
            {!editing && enterprise && !isSystemAdmin && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Chỉnh sửa
              </button>
            )}
          </div>

          {loading && !enterprise ? (
            <div className="bg-white border rounded-lg p-8 text-center">
              <p className="text-gray-500">Đang tải thông tin doanh nghiệp...</p>
            </div>
          ) : enterprise ? (
            <div className="bg-white border rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin doanh nghiệp</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên doanh nghiệp</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{enterprise.name || enterprise.Name || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lĩnh vực</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.businessField}
                      onChange={e => setFormData({ ...formData, businessField: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{enterprise.businessField || enterprise.BusinessField || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  {editing ? (
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{enterprise.description || enterprise.Description || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.province}
                      onChange={e => setFormData({ ...formData, province: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{enterprise.province || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.district}
                      onChange={e => setFormData({ ...formData, district: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{enterprise.district || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phường/Xã</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.ward}
                      onChange={e => setFormData({ ...formData, ward: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{enterprise.ward || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{enterprise.address || enterprise.Address || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{enterprise.phone || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{enterprise.email || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.website}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{enterprise.website || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <p className="text-gray-900">
                    {enterprise.locked ? 'Khóa' : (enterprise.status || 'Hoạt động')}
                  </p>
                </div>
              </div>

              {editing && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border rounded-lg p-8 text-center">
              <p className="text-gray-500">Không tìm thấy thông tin doanh nghiệp.</p>
            </div>
          )}

          {/* Products Section */}
          {enterprise && (
            <div className="mt-8 bg-white border rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Danh sách sản phẩm</h2>
                <button
                  onClick={handleAddProduct}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Thêm sản phẩm
                </button>
              </div>

              {/* Product Form */}
              {showProductForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên sản phẩm *
                      </label>
                      <input
                        type="text"
                        value={productFormData.name}
                        onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        placeholder="Nhập tên sản phẩm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Danh mục
                      </label>
                      <input
                        type="text"
                        value={productFormData.category}
                        onChange={e => setProductFormData({ ...productFormData, category: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        placeholder="Nhập danh mục"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={productFormData.price}
                        onChange={e => setProductFormData({ ...productFormData, price: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        placeholder="Nhập giá"
                        min="0"
                        step="1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL hình ảnh
                      </label>
                      <input
                        type="text"
                        value={productFormData.image}
                        onChange={e => setProductFormData({ ...productFormData, image: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        placeholder="Nhập URL hình ảnh"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                      </label>
                      <textarea
                        value={productFormData.description}
                        onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        placeholder="Nhập mô tả sản phẩm"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleSaveProduct}
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Đang lưu...' : (editingProduct ? 'Cập nhật' : 'Thêm sản phẩm')}
                    </button>
                    <button
                      onClick={handleCancelProduct}
                      disabled={loading}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Products List */}
              {products.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa có sản phẩm nào</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2">Tên</th>
                        <th className="text-left px-4 py-2">Mô tả</th>
                        <th className="text-left px-4 py-2">Danh mục</th>
                        <th className="text-left px-4 py-2">Giá</th>
                        <th className="text-right px-4 py-2">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <tr key={product.id ? `product-${product.id}` : `product-index-${index}`} className="border-t">
                          <td className="px-4 py-2 font-medium">{product.name || '-'}</td>
                          <td className="px-4 py-2">{product.description || '-'}</td>
                          <td className="px-4 py-2">{product.category || '-'}</td>
                          <td className="px-4 py-2">
                            {product.price ? `${product.price.toLocaleString('vi-VN')} VNĐ` : '-'}
                          </td>
                          <td className="px-4 py-2 text-right space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="px-3 py-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

