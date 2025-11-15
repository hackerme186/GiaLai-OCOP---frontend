"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, type Product, type Category, type User } from "@/lib/api"

interface ProductManagementTabProps {
  user: User | null
}

export default function ProductManagementTab({ user }: ProductManagementTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "Approved" | "PendingApproval" | "Rejected">("all")
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "" as string | number,
    categoryId: 0,
    imageUrl: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.enterpriseId) {
        setError("Tài khoản chưa được liên kết với doanh nghiệp. Vui lòng liên hệ quản trị viên.")
        setLoading(false)
        return
      }

      // Load products - backend auto-filters by EnterpriseId from token
      const productsData = await getProducts({
        pageSize: 100
      })

      setProducts(productsData)

      // Load categories - with fallback for 403 error (EnterpriseAdmin can't access categories endpoint)
      try {
        const categoriesData = await getCategories()
        setCategories(categoriesData)
      } catch (catError) {
        console.warn("❌ Cannot load categories from API (403 - permission denied). Using fallback list.")
        // Fallback: Use categories extracted from products
        const uniqueCategories: Category[] = []
        const categoryMap = new Map<number, string>()

        productsData.forEach(product => {
          if (product.categoryId && product.categoryName && !categoryMap.has(product.categoryId)) {
            categoryMap.set(product.categoryId, product.categoryName)
            uniqueCategories.push({
              id: product.categoryId,
              name: product.categoryName,
              isActive: true
            })
          }
        })

        // Add default categories if none found
        if (uniqueCategories.length === 0) {
          uniqueCategories.push(
            { id: 1, name: "Thực phẩm", isActive: true },
            { id: 2, name: "Đồ uống", isActive: true },
            { id: 3, name: "Thủ công mỹ nghệ", isActive: true },
            { id: 4, name: "Dệt may", isActive: true },
            { id: 5, name: "Khác", isActive: true }
          )
        }

        setCategories(uniqueCategories)
      }
    } catch (err) {
      console.error("❌ Failed to load data:", err)
      const errorMsg = err instanceof Error ? err.message : "Không thể tải dữ liệu"

      // Provide helpful error messages
      if (errorMsg.includes("403")) {
        setError(
          "⚠️ LỖI BACKEND: Không có quyền truy cập (403 Forbidden)\n\n" +
          "Backend chưa được cấu hình để cho phép EnterpriseAdmin truy cập.\n\n" +
          "YÊU CẦU BACKEND:\n" +
          "1️⃣ Thêm role 'EnterpriseAdmin' vào [Authorize] của ProductsController\n" +
          "2️⃣ Đảm bảo JWT token có claim 'EnterpriseId'\n" +
          "3️⃣ Filter products theo enterpriseId từ token\n\n" +
          "📄 Chi tiết: Xem file TROUBLESHOOTING_403.md\n\n" +
          "💡 Frontend đã sẵn sàng - chỉ cần backend cấu hình đúng!"
        )
      } else if (errorMsg.includes("401")) {
        setError("❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
      } else if (errorMsg.includes("Backend API không khả dụng")) {
        setError("❌ Backend server không hoạt động. Vui lòng khởi động backend server.")
      } else {
        setError(`❌ ${errorMsg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = filter === "all"
    ? products
    : products.filter(p => p.status === filter)

  const handleCreate = () => {
    setEditingProduct(null)
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: categories[0]?.id || 0,
      imageUrl: "",
    })
    setShowModal(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      categoryId: product.categoryId || 0,
      imageUrl: product.imageUrl || "",
    })
    setShowModal(true)
  }

  const handleDelete = async (productId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      return
    }

    try {
      await deleteProduct(productId)
      setProducts(prev => prev.filter(p => p.id !== productId))
      setSuccess("Đã xóa sản phẩm thành công!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Không thể xóa sản phẩm"

      // Check if it's "product-in-order" error
      if (errorMsg.includes("order") || errorMsg.includes("đơn hàng")) {
        setError("Không thể xóa sản phẩm này vì đã có trong đơn hàng. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.")
      } else {
        setError(errorMsg)
      }
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên sản phẩm")
      return
    }
    const price = typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price
    if (!price || price <= 0) {
      setError("Vui lòng nhập giá sản phẩm hợp lệ (lớn hơn 0)")
      return
    }

    try {
      // Prepare payload with validated price
      const payload = {
        ...formData,
        price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price
      }

      if (editingProduct) {
        // Update existing product
        await updateProduct(editingProduct.id, payload)
        setSuccess("Đã cập nhật sản phẩm và chuyển về trạng thái chờ duyệt!")

        // Update local state
        setProducts(prev => prev.map(p =>
          p.id === editingProduct.id
            ? { ...p, ...payload, status: "PendingApproval" }
            : p
        ))
      } else {
        // Create new product
        const newProduct = await createProduct(payload)
        setSuccess("Đã tạo sản phẩm mới! Sản phẩm đang chờ quản trị viên duyệt.")
        setProducts(prev => [newProduct, ...prev])
      }

      setShowModal(false)
      setTimeout(() => setSuccess(null), 5000)
      await loadData() // Reload to get latest data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      setTimeout(() => setError(null), 5000)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      Approved: "bg-green-100 text-green-700 border-green-200",
      PendingApproval: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Rejected: "bg-red-100 text-red-700 border-red-200",
    }
    const labels = {
      Approved: "Đã duyệt",
      PendingApproval: "Chờ duyệt",
      Rejected: "Bị từ chối",
    }
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${badges[status as keyof typeof badges] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải sản phẩm...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border-2 border-green-200 text-green-800 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h2>
            <p className="text-sm text-gray-500 mt-1">Tạo, chỉnh sửa và quản lý sản phẩm của doanh nghiệp</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo sản phẩm mới
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { id: "all" as const, label: "Tất cả" },
            { id: "Approved" as const, label: "Đã duyệt" },
            { id: "PendingApproval" as const, label: "Chờ duyệt" },
            { id: "Rejected" as const, label: "Bị từ chối" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${filter === tab.id
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.label} ({tab.id === "all" ? products.length : products.filter(p => p.status === tab.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có sản phẩm</h3>
          <p className="text-gray-500 mb-6">
            {filter === "all"
              ? "Bạn chưa có sản phẩm nào. Hãy tạo sản phẩm đầu tiên!"
              : `Không có sản phẩm nào ở trạng thái "${filter}"`
            }
          </p>
          {filter === "all" && (
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Tạo sản phẩm mới
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-200">
                <Image
                  src={product.imageUrl || "/hero.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 right-3">
                  {getStatusBadge(product.status || "PendingApproval")}
                </div>
                {product.ocopRating && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      ⭐ {product.ocopRating}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-green-600">
                    {product.price.toLocaleString("vi-VN")}₫
                  </span>
                  {product.categoryName && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.categoryName}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="Nhập tên sản phẩm"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
                  placeholder="Nhập mô tả sản phẩm"
                  rows={4}
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Giá (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="Nhập giá sản phẩm"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Danh mục
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  >
                    <option value={0}>Không có</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  URL hình ảnh
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Để trống nếu không có ảnh, hệ thống sẽ dùng ảnh mặc định
                </p>
              </div>

              {/* Notice */}
              {editingProduct && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Lưu ý:</p>
                      <p>Sau khi chỉnh sửa, sản phẩm sẽ tự động chuyển về trạng thái "Chờ duyệt" và cần được quản trị viên phê duyệt lại.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                >
                  {editingProduct ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

