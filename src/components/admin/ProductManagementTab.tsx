"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { 
  getProducts, 
  updateProduct, 
  deleteProduct, 
  getCategories,
  getEnterprises,
  type Product, 
  type Category,
  type Enterprise,
  type CreateProductDto
} from "@/lib/api"
import ImageUploader from "@/components/upload/ImageUploader"
import { isValidImageUrl, getImageUrl, getImageAttributes } from "@/lib/imageUtils"

export default function ProductManagementTab() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [enterprises, setEnterprises] = useState<Enterprise[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [enterpriseFilter, setEnterpriseFilter] = useState<string>("all")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<Partial<CreateProductDto>>({})
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load products
      const productData = await getProducts({ pageSize: 1000 })
      const productList = Array.isArray(productData) ? productData : []
      setProducts(productList)

      // Load categories
      try {
        const categoryData = await getCategories()
        const categoryList = Array.isArray(categoryData) ? categoryData : []
        setCategories(categoryList)
      } catch (err) {
        console.warn("Failed to load categories:", err)
      }

      // Load enterprises
      try {
        const enterpriseData = await getEnterprises()
        const enterpriseList = Array.isArray(enterpriseData) ? enterpriseData : []
        setEnterprises(enterpriseList)
      } catch (err) {
        console.warn("Failed to load enterprises:", err)
      }
    } catch (err) {
      console.error("Failed to load data:", err)
      alert("Không thể tải dữ liệu: " + (err instanceof Error ? err.message : "Lỗi không xác định"))
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.enterprise?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatus = statusFilter === "all" || product.status === statusFilter
      const matchCategory = categoryFilter === "all" || product.categoryId?.toString() === categoryFilter
      const matchEnterprise = enterpriseFilter === "all" || product.enterpriseId?.toString() === enterpriseFilter

      return matchSearch && matchStatus && matchCategory && matchEnterprise
    })
  }, [products, searchTerm, statusFilter, categoryFilter, enterpriseFilter])

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      ocopRating: product.ocopRating,
      stockStatus: product.stockStatus,
      categoryId: product.categoryId,
    })
    setShowEditModal(true)
  }

  const handleDelete = (product: Product) => {
    setDeletingProduct(product)
    setShowDeleteModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingProduct) return

    if (!formData.name || !formData.description || formData.price === undefined) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }

    try {
      setUploadingImage(true)
      await updateProduct(editingProduct.id, formData)
      alert("Đã cập nhật sản phẩm thành công!")
      setShowEditModal(false)
      setEditingProduct(null)
      setFormData({})
      await loadData()
    } catch (err: any) {
      console.error("Failed to update product:", err)
      const errorMessage = err?.bodyMessage || err?.message || "Lỗi không xác định"
      alert("Cập nhật thất bại: " + errorMessage)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return

    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${deletingProduct.name}"?`)) {
      return
    }

    try {
      await deleteProduct(deletingProduct.id)
      alert("Đã xóa sản phẩm thành công!")
      setShowDeleteModal(false)
      setDeletingProduct(null)
      await loadData()
    } catch (err: any) {
      console.error("Failed to delete product:", err)
      const errorMessage = err?.bodyMessage || err?.message || "Lỗi không xác định"
      alert("Xóa thất bại: " + errorMessage)
    }
  }

  const handleImageUpload = async (imageUrl: string) => {
    setUploadingImage(true)
    try {
      setFormData({ ...formData, imageUrl })
    } catch (err) {
      console.error("Error setting image:", err)
      alert("Có lỗi xảy ra khi cập nhật ảnh. Vui lòng thử lại.")
    } finally {
      setUploadingImage(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      Approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800 border-green-300", icon: "✅" },
      PendingApproval: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: "⏳" },
      Rejected: { label: "Từ chối", color: "bg-red-100 text-red-800 border-red-300", icon: "❌" },
    }
    const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800 border-gray-300", icon: "•" }
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${statusInfo.color}`}>
        <span>{statusInfo.icon}</span>
        {statusInfo.label}
      </span>
    )
  }

  const getStockStatusBadge = (stockStatus: string) => {
    const stockMap: Record<string, { label: string; color: string; icon: string }> = {
      InStock: { label: "Còn hàng", color: "bg-green-100 text-green-800 border-green-300", icon: "✓" },
      LowStock: { label: "Sắp hết", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: "⚠" },
      OutOfStock: { label: "Hết hàng", color: "bg-red-100 text-red-800 border-red-300", icon: "✗" },
    }
    const stockInfo = stockMap[stockStatus] || { label: stockStatus, color: "bg-gray-100 text-gray-800 border-gray-300", icon: "•" }
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${stockInfo.color}`}>
        <span>{stockInfo.icon}</span>
        {stockInfo.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📦 Quản lý Sản phẩm</h2>
            <p className="text-white/90 text-lg">Quản lý toàn bộ sản phẩm trong hệ thống OCOP Gia Lai</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tên sản phẩm, mô tả..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white cursor-pointer"
            >
              <option value="all">📋 Tất cả</option>
              <option value="Approved">✅ Đã duyệt</option>
              <option value="PendingApproval">⏳ Chờ duyệt</option>
              <option value="Rejected">❌ Từ chối</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white cursor-pointer"
            >
              <option value="all">📁 Tất cả</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Enterprise Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Doanh nghiệp</label>
            <select
              value={enterpriseFilter}
              onChange={(e) => setEnterpriseFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white cursor-pointer"
            >
              <option value="all">🏢 Tất cả</option>
              {enterprises.map((ent) => (
                <option key={ent.id} value={ent.id.toString()}>
                  {ent.name}
                </option>
              ))}
            </select>
          </div>
          {filteredProducts.length !== products.length && (
            <div className="md:col-span-3 flex items-end">
              <span className="text-sm text-gray-600">
                Tìm thấy {filteredProducts.length} / {products.length} sản phẩm
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4" />
            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
          <div className="text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500 font-medium text-lg mb-2">Không tìm thấy sản phẩm nào</p>
            <p className="text-gray-400 text-sm">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all" || enterpriseFilter !== "all"
                ? "Thử thay đổi bộ lọc để xem thêm kết quả"
                : "Chưa có sản phẩm nào trong hệ thống"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Ảnh
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Tên sản phẩm
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Doanh nghiệp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Giá
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    OCOP Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Tồn kho
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => (
                  <tr 
                    key={product.id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200"
                    style={{
                      animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm">
                        {isValidImageUrl(product.imageUrl) ? (
                          <Image
                            src={getImageUrl(product.imageUrl)}
                            alt={product.name}
                            fill
                            className="object-cover"
                            {...getImageAttributes(product.imageUrl)}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-base font-bold text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {product.description}
                      </div>
                      {product.categoryName && (
                        <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200">
                          📂 {product.categoryName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {product.enterprise?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-green-600">
                        {product.price?.toLocaleString('vi-VN')} ₫
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.ocopRating ? (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-3 py-1.5 rounded-full text-sm font-bold border-2 border-yellow-300 shadow-sm">
                          ⭐ {product.ocopRating}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.status || "PendingApproval")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {getStockStatusBadge(product.stockStatus || "InStock")}
                        {product.stockQuantity !== undefined && (
                          <div className="text-xs text-gray-600 font-medium">
                            SL: <span className="font-bold">{product.stockQuantity}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-t-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">
                Tổng cộng: <span className="text-lg font-bold text-blue-600">{filteredProducts.length}</span> sản phẩm
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between shadow-lg -m-8 mb-0 rounded-t-2xl">
              <h3 className="text-2xl font-bold text-white">✏️ Chỉnh sửa Sản phẩm</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingProduct(null)
                  setFormData({})
                }}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="pt-8">

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-semibold"
                  required
                  placeholder="Nhập tên sản phẩm..."
                />
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Mô tả *</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-y"
                  required
                  placeholder="Nhập mô tả sản phẩm..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Giá (₫) *</label>
                  <input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all font-semibold"
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-200">
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">⭐ OCOP Rating</label>
                  <select
                    value={formData.ocopRating || ""}
                    onChange={(e) => setFormData({ ...formData, ocopRating: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all bg-white cursor-pointer font-semibold"
                  >
                    <option value="">Chưa có</option>
                    <option value="3">⭐ 3 sao</option>
                    <option value="4">⭐ 4 sao</option>
                    <option value="5">⭐ 5 sao</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">📁 Danh mục</label>
                  <select
                    value={formData.categoryId || ""}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white cursor-pointer"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">📦 Tình trạng tồn kho</label>
                  <select
                    value={formData.stockStatus || "InStock"}
                    onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white cursor-pointer"
                  >
                    <option value="InStock">✓ Còn hàng</option>
                    <option value="LowStock">⚠ Sắp hết</option>
                    <option value="OutOfStock">✗ Hết hàng</option>
                  </select>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">🖼️ Ảnh sản phẩm</label>
                <ImageUploader
                  folder="GiaLaiOCOP/Products"
                  onUploaded={handleImageUpload}
                  currentImageUrl={formData.imageUrl}
                  disabled={uploadingImage}
                  placeholder="Chọn ảnh cho sản phẩm..."
                  maxPreviewSize={200}
                />
              </div>
            </div>

              <div className="flex gap-3 mt-8 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingProduct(null)
                    setFormData({})
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={uploadingImage}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                >
                  {uploadingImage ? "Đang lưu..." : "💾 Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-red-600">Xác nhận xóa</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingProduct(null)
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-red-50 rounded-xl border-2 border-red-200">
              <p className="text-gray-900 mb-2">
                Bạn có chắc chắn muốn xóa sản phẩm <span className="font-bold text-red-700">"{deletingProduct.name}"</span>?
              </p>
              <p className="text-sm text-red-700 font-semibold">
                ⚠️ Hành động này không thể hoàn tác!
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingProduct(null)
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🗑️ Xóa sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

