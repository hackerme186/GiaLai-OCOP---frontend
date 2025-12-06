"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, type Product, type Category, type User } from "@/lib/api"
import ImageUploader from "@/components/upload/ImageUploader"
import ProductImagesManager from "./ProductImagesManager"

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
  const [showImagesManager, setShowImagesManager] = useState(false)
  const [selectedProductForImages, setSelectedProductForImages] = useState<Product | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "" as string | number,
    categoryId: 0,
    imageUrl: "",
    stockStatus: "InStock" as "InStock" | "OutOfStock" | "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
        
        // ✨ FILTER: Only show active categories (IsActive = true)
        const activeCategories = categoriesData.filter(cat => cat.isActive !== false)
        
        console.log(`📋 Loaded ${categoriesData.length} categories, ${activeCategories.length} active`)
        setCategories(activeCategories)
      } catch (catError) {
        console.warn("❌ Cannot load categories from API (403 - permission denied). Extracting from existing products.")
        
        // Fallback: Extract categories from existing products (these are already filtered by backend)
        const uniqueCategories: Category[] = []
        const categoryMap = new Map<number, string>()

        productsData.forEach(product => {
          if (product.categoryId && product.categoryName && !categoryMap.has(product.categoryId)) {
            categoryMap.set(product.categoryId, product.categoryName)
            uniqueCategories.push({
              id: product.categoryId,
              name: product.categoryName,
              isActive: true // Categories from existing products are assumed active
            })
          }
        })

        if (uniqueCategories.length === 0) {
          console.warn("⚠️ No categories found from products. Enterprise has no products yet.")
          // Don't add default categories - force user to contact admin
        }

        console.log(`📋 Extracted ${uniqueCategories.length} categories from existing products`)
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
    
    // Warn if no active categories available
    if (categories.length === 0) {
      console.warn('⚠️ No active categories available.')
      alert('⚠️ Không có danh mục nào khả dụng.\n\nVui lòng liên hệ SystemAdmin để kích hoạt danh mục sản phẩm.')
      return
    }
    
    // Auto-select first active category
    const defaultCategoryId = categories[0].id
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: defaultCategoryId,
      imageUrl: "",
      stockStatus: "InStock", // Default: Còn hàng
    })
    setImageFile(null)
    setImagePreview(null)
    setShowModal(true)
    
    console.log(`📝 Creating new product with default category: ${categories[0].name} (ID: ${defaultCategoryId})`)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      categoryId: product.categoryId || 0,
      imageUrl: product.imageUrl || "",
      stockStatus: (product.stockStatus || "InStock") as "InStock" | "OutOfStock" | "",
    })
    setImageFile(null)
    setImagePreview(product.imageUrl || null)
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

    console.log('🔍 DEBUG - Form data before submit:', formData)

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
    if (!formData.categoryId || formData.categoryId === 0) {
      setError("Vui lòng chọn danh mục sản phẩm")
      return
    }
    
    // Verify selected category is still active
    const selectedCategory = categories.find(cat => cat.id === formData.categoryId)
    if (!selectedCategory) {
      setError("Danh mục đã chọn không còn khả dụng. Vui lòng chọn danh mục khác.")
      console.warn(`⚠️ Category ${formData.categoryId} not found in active categories list`)
      return
    }

    try {
      // Handle image: use uploaded file (base64) or existing URL
      let finalImageUrl = formData.imageUrl.trim()
      
      if (imageFile) {
        // Convert file to base64
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const result = reader.result as string
            resolve(result)
          }
          reader.onerror = reject
          reader.readAsDataURL(imageFile)
        })
        finalImageUrl = base64Image
      } else if (editingProduct && !formData.imageUrl.trim() && editingProduct.imageUrl) {
        // If editing and no new file/URL selected, keep existing image
        finalImageUrl = editingProduct.imageUrl
      }
      
      // Prepare payload with validated price and default imageUrl if empty
      const payload = {
        ...formData,
        price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price,
        imageUrl: finalImageUrl || '/hero.jpg', // Use default if empty
        stockStatus: formData.stockStatus || "InStock" // Default to InStock if empty
      }
      
      console.log('📤 Sending product payload:', payload)
      console.log('📸 ImageUrl:', payload.imageUrl)
      console.log('📦 StockStatus:', payload.stockStatus)
      console.log('📁 Selected category:', selectedCategory.name, `(ID: ${selectedCategory.id})`)
      console.log('✅ Category is active and available')

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
        console.log('🚀 Creating new product...')
        const newProduct = await createProduct(payload)
        console.log('✅ Product created successfully:', newProduct)
        setSuccess("Đã tạo sản phẩm mới! Sản phẩm đang chờ quản trị viên duyệt.")
        setProducts(prev => [newProduct, ...prev])
      }

      setShowModal(false)
      setImageFile(null)
      setImagePreview(null)
      setTimeout(() => setSuccess(null), 5000)
      await loadData() // Reload to get latest data
    } catch (err) {
      console.error('❌ Error creating/updating product:', err)
      
      let errorMessage = "Có lỗi xảy ra"
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Parse backend validation errors (400 Bad Request)
        if (errorMessage.includes("400")) {
          // Try to extract more specific error info
          if (errorMessage.includes("imageUrl") || errorMessage.includes("ImageUrl")) {
            errorMessage = "⚠️ URL hình ảnh không hợp lệ. Vui lòng nhập URL đầy đủ (bắt đầu bằng http:// hoặc https://)"
          } else if (errorMessage.includes("category") || errorMessage.includes("Category")) {
            errorMessage = "⚠️ Danh mục không hợp lệ. Vui lòng chọn danh mục khác."
          } else if (errorMessage.includes("enterprise") || errorMessage.includes("Enterprise")) {
            errorMessage = "⚠️ Không tìm thấy doanh nghiệp. Vui lòng đăng nhập lại."
          } else {
            errorMessage = `⚠️ Dữ liệu không hợp lệ: ${errorMessage}`
          }
        }
      }
      
      setError(errorMessage)
      setTimeout(() => setError(null), 8000)
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
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📦 Quản lý sản phẩm</h2>
            <p className="text-green-100 text-lg">Tạo, chỉnh sửa và quản lý sản phẩm của doanh nghiệp</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"

          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo sản phẩm mới
          </button>
        </div>
      </div>


        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">

          {[
            { id: "all" as const, label: "Tất cả" },
            { id: "Approved" as const, label: "Đã duyệt" },
            { id: "PendingApproval" as const, label: "Chờ duyệt" },
            { id: "Rejected" as const, label: "Bị từ chối" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-5 py-2.5 font-medium text-sm rounded-lg transition-all ${
                filter === tab.id
                  ? "bg-white text-green-700 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
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

            <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group">

              {/* Product Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                <Image
                  src={product.imageUrl || "/hero.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-3 right-3">
                  {getStatusBadge(product.status || "PendingApproval")}
                </div>
                {product.ocopRating && (
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                      ⭐ {product.ocopRating}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                  <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {product.price.toLocaleString("vi-VN")}₫
                  </span>
                  {product.categoryName && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                      {product.categoryName}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Sửa
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProductForImages(product)
                      setShowImagesManager(true)
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center"
                    title="Quản lý ảnh"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center"
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
                onClick={() => {
                  setShowModal(false)
                  setImageFile(null)
                  setImagePreview(null)
                }}
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
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    required
                  >
                    <option value={0} disabled>-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Không có danh mục khả dụng. Vui lòng liên hệ quản trị viên.
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Chỉ hiển thị danh mục đã được SystemAdmin kích hoạt
                  </p>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Hình ảnh sản phẩm
                </label>
                
                {/* Image Preview */}
                {(imagePreview || (editingProduct && editingProduct.imageUrl)) && (
                  <div className="mb-3">
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={imagePreview || editingProduct?.imageUrl || '/hero.jpg'}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                          setFormData({ ...formData, imageUrl: "" })
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                        title="Xóa ảnh"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* File Input */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      
                      // Validate file type
                      if (!file.type.match(/^image\//)) {
                        setError("Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF, etc.)")
                        setTimeout(() => setError(null), 5000)
                        return
                      }
                      
                      // Validate file size (5 MB)
                      const maxSize = 5 * 1024 * 1024 // 5 MB
                      if (file.size > maxSize) {
                        setError(`Dung lượng file không được vượt quá 5 MB. File hiện tại: ${(file.size / (1024 * 1024)).toFixed(2)} MB`)
                        setTimeout(() => setError(null), 5000)
                        return
                      }
                      
                      // Create preview
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string)
                        setImageFile(file)
                        setFormData({ ...formData, imageUrl: "" }) // Clear URL if file is selected
                        setError(null)
                      }
                      reader.onerror = () => {
                        setError("Không thể đọc file ảnh. Vui lòng thử lại.")
                        setTimeout(() => setError(null), 5000)
                      }
                      reader.readAsDataURL(file)
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all group"
                  >
                    <div className="flex flex-col items-center">
                      <svg className="w-8 h-8 text-gray-400 group-hover:text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">
                        {imagePreview ? "Chọn ảnh khác" : "Chọn ảnh từ thiết bị"}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        JPG, PNG, GIF (tối đa 5 MB)
                      </span>
                    </div>
                  </label>
                </div>
                
                {/* Alternative: URL Input (optional) */}
                <div className="mt-3">
                  <details className="group">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      💡 Hoặc nhập URL hình ảnh (tùy chọn)
                    </summary>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, imageUrl: e.target.value })
                          if (e.target.value.trim()) {
                            setImageFile(null)
                            setImagePreview(e.target.value.trim())
                          }
                        }}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-sm"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </details>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  📸 Để trống nếu không có ảnh, hệ thống sẽ dùng ảnh mặc định
                </p>
              </div>

              {/* Stock Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tình trạng kho <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.stockStatus}
                  onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value as "InStock" | "OutOfStock" | "" })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  required
                >
                  <option value="">Không xác định</option>
                  <option value="InStock">Còn hàng</option>
                  <option value="OutOfStock">Hết hàng</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  📦 Cập nhật trạng thái tồn kho của sản phẩm
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
                  onClick={() => {
                    setShowModal(false)
                    setImageFile(null)
                    setImagePreview(null)
                  }}
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

      {/* Product Images Manager Modal */}
      {showImagesManager && selectedProductForImages && (
        <ProductImagesManager
          productId={selectedProductForImages.id}
          productName={selectedProductForImages.name}
          onClose={() => {
            setShowImagesManager(false)
            setSelectedProductForImages(null)
          }}
        />
      )}
    </div>
  )
}

