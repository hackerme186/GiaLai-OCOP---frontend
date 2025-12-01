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
    const statusMap: Record<string, { label: string; color: string }> = {
      Approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800" },
      PendingApproval: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
      Rejected: { label: "Từ chối", color: "bg-red-100 text-red-800" },
    }
    const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const getStockStatusBadge = (stockStatus: string) => {
    const stockMap: Record<string, { label: string; color: string }> = {
      InStock: { label: "Còn hàng", color: "bg-green-100 text-green-800" },
      LowStock: { label: "Sắp hết", color: "bg-yellow-100 text-yellow-800" },
      OutOfStock: { label: "Hết hàng", color: "bg-red-100 text-red-800" },
    }
    const stockInfo = stockMap[stockStatus] || { label: stockStatus, color: "bg-gray-100 text-gray-800" }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockInfo.color}`}>
        {stockInfo.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Sản phẩm</h2>
          <p className="text-gray-600 mt-1">Quản lý toàn bộ sản phẩm trong hệ thống</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Tìm kiếm</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tên sản phẩm, mô tả..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả</option>
              <option value="Approved">Đã duyệt</option>
              <option value="PendingApproval">Chờ duyệt</option>
              <option value="Rejected">Từ chối</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Danh mục</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Enterprise Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Doanh nghiệp</label>
            <select
              value={enterpriseFilter}
              onChange={(e) => setEnterpriseFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả</option>
              {enterprises.map((ent) => (
                <option key={ent.id} value={ent.id.toString()}>
                  {ent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải dữ liệu...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Ảnh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Tên sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Doanh nghiệp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    OCOP Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy sản phẩm nào
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
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
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {product.description}
                        </div>
                        {product.categoryName && (
                          <div className="text-xs text-blue-600 mt-1">📂 {product.categoryName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.enterprise?.name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {product.price?.toLocaleString('vi-VN')} ₫
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.ocopRating ? (
                          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                            ⭐ {product.ocopRating}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status || "PendingApproval")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStockStatusBadge(product.stockStatus || "InStock")}
                        {product.stockQuantity !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            SL: {product.stockQuantity}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900 font-semibold"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="text-red-600 hover:text-red-900 font-semibold"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Tổng cộng: <span className="font-semibold">{filteredProducts.length}</span> sản phẩm
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa Sản phẩm</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingProduct(null)
                  setFormData({})
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Mô tả *</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Giá (₫) *</label>
                  <input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">OCOP Rating</label>
                  <select
                    value={formData.ocopRating || ""}
                    onChange={(e) => setFormData({ ...formData, ocopRating: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Chưa có</option>
                    <option value="3">3 sao</option>
                    <option value="4">4 sao</option>
                    <option value="5">5 sao</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Danh mục</label>
                  <select
                    value={formData.categoryId || ""}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Tình trạng tồn kho</label>
                  <select
                    value={formData.stockStatus || "InStock"}
                    onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="InStock">Còn hàng</option>
                    <option value="LowStock">Sắp hết</option>
                    <option value="OutOfStock">Hết hàng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Ảnh sản phẩm</label>
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

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingProduct(null)
                  setFormData({})
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={uploadingImage}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {uploadingImage ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Xác nhận xóa</h3>
            <p className="text-gray-700 mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm <span className="font-semibold">"{deletingProduct.name}"</span>?
              <br />
              <span className="text-sm text-red-600 mt-2 block">
                Hành động này không thể hoàn tác!
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingProduct(null)
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

