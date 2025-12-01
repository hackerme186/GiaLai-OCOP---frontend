"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Product, getProducts, updateProductStatus, getEnterprise, Enterprise } from "@/lib/api"

const PAGE_SIZE = 10

export default function OcopApprovalTab() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filters, setFilters] = useState({ search: "", status: "PendingApproval" })
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({})
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [enterpriseData, setEnterpriseData] = useState<Record<number, Enterprise>>({})
  const [loadingEnterprise, setLoadingEnterprise] = useState<Record<number, boolean>>({})

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProducts()
      const list = Array.isArray(data)
        ? data
        : (data as any)?.items || (data as any)?.data || []
      setProducts(list)
    } catch (err) {
      console.error("Failed to load products for approval:", err)
      setProducts([])
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách sản phẩm"
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchSearch = filters.search
        ? `${product.name} ${product.enterprise?.name || ""}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())
        : true
      const matchStatus =
        !filters.status || filters.status === "all"
          ? true
          : (product.status || "")
            .toLowerCase()
            .includes(filters.status.toLowerCase())
      return matchSearch && matchStatus
    })
  }, [products, filters])

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1
  const pagedProducts = filteredProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  useEffect(() => {
    if (page > totalPages) {
      setPage(Math.max(1, totalPages))
    }
  }, [totalPages, page])

  const handleApprove = async (product: Product) => {
    if (!confirm("Duyệt sản phẩm này?")) return
    try {
      await updateProductStatus(product.id, {
        status: "Approved",
        ocopRating: product.ocopRating
      })
      alert("Đã duyệt sản phẩm!")
      await loadProducts()
    } catch (err) {
      alert(
        "Duyệt thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định")
      )
    }
  }

  const handleReject = async (product: Product) => {
    const reason = (rejectReason[product.id] || "").trim()
    if (!reason) {
      alert("Vui lòng nhập lý do từ chối")
      return
    }
    if (!confirm("Bạn chắc chắn muốn từ chối sản phẩm này?")) return
    try {
      await updateProductStatus(product.id, {
        status: "Rejected"
      })
      alert("Đã từ chối sản phẩm!")
      setRejectReason((prev) => ({ ...prev, [product.id]: "" }))
      setShowRejectModal(null)
      await loadProducts()
    } catch (err) {
      alert(
        "Từ chối thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định")
      )
    }
  }

  const handleSearch = () => {
    setPage(1)
  }

  const loadEnterpriseData = async (enterpriseId: number) => {
    if (!enterpriseId) {
      console.warn('⚠️ Product has no enterpriseId')
      return
    }

    // Skip if already loaded or loading
    if (enterpriseData[enterpriseId] || loadingEnterprise[enterpriseId]) {
      return
    }

    console.log(`📡 Loading enterprise data for ID: ${enterpriseId}`)
    setLoadingEnterprise(prev => ({ ...prev, [enterpriseId]: true }))
    try {
      const enterprise = await getEnterprise(enterpriseId)
      console.log(`✅ Loaded enterprise:`, enterprise)
      setEnterpriseData(prev => ({ ...prev, [enterpriseId]: enterprise }))
    } catch (err) {
      console.error(`❌ Failed to load enterprise ${enterpriseId}:`, err)
      // Don't show error to user, just log it
    } finally {
      setLoadingEnterprise(prev => ({ ...prev, [enterpriseId]: false }))
    }
  }

  const handleShowProductDetails = (product: Product) => {
    console.log('🔍 Opening product details:', {
      id: product.id,
      name: product.name,
      enterpriseId: product.enterpriseId,
      hasEnterprise: !!product.enterprise,
      enterpriseName: product.enterprise?.name
    })
    setSelectedProduct(product)
    // Load enterprise data if we have enterpriseId but no enterprise object
    if (product.enterpriseId && !product.enterprise) {
      loadEnterpriseData(product.enterpriseId)
    } else if (!product.enterpriseId) {
      console.warn(`⚠️ Product ${product.id} (${product.name}) has no enterpriseId`)
    }
  }

  const getEnterpriseName = (product: Product): string => {
    // First try to get from nested enterprise object
    if (product.enterprise?.name) {
      return product.enterprise.name
    }
    // Then try to get from loaded enterprise data
    if (product.enterpriseId && enterpriseData[product.enterpriseId]?.name) {
      return enterpriseData[product.enterpriseId].name
    }
    // Fallback to "-"
    return "-"
  }

  const pendingCount = products.filter(p => p.status === "PendingApproval").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">⭐ Duyệt sản phẩm OCOP</h2>
            <p className="text-white/90 text-lg">Xem xét và phê duyệt sản phẩm OCOP của các doanh nghiệp</p>
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm opacity-90">Sản phẩm chờ duyệt</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((v) => ({ ...v, search: e.target.value }))
                }
                placeholder="Tìm theo tên sản phẩm hoặc doanh nghiệp..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((v) => ({ ...v, status: e.target.value }))
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-white cursor-pointer"
            >
              <option value="PendingApproval">⏳ Chờ duyệt</option>
              <option value="Approved">✅ Đã duyệt</option>
              <option value="Rejected">❌ Đã từ chối</option>
              <option value="all">📋 Tất cả</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSearch}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-orange-700 hover:to-red-700 font-semibold transition-all transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm
          </button>
          <button
            onClick={() => {
              setFilters({ search: "", status: "PendingApproval" })
              setPage(1)
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-200 font-semibold transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Xóa lọc
          </button>
          {filteredProducts.length !== products.length && (
            <span className="text-sm text-gray-600 ml-auto">
              Tìm thấy {filteredProducts.length} / {products.length} sản phẩm
            </span>
          )}
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600 mb-4" />
            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-2">Lỗi tải dữ liệu</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadProducts}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      ) : pagedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
          <div className="text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500 font-medium text-lg mb-2">Không có dữ liệu</p>
            <p className="text-gray-400 text-sm">
              {filters.search || filters.status !== "PendingApproval"
                ? "Thử thay đổi bộ lọc để xem thêm kết quả"
                : "Chưa có sản phẩm nào trong hệ thống"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pagedProducts.map((item, index) => {
            const isPending = item.status === "PendingApproval"
            const statusInfo = {
              PendingApproval: { text: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: "⏳" },
              Approved: { text: "Đã duyệt", color: "bg-green-100 text-green-800 border-green-300", icon: "✅" },
              Rejected: { text: "Đã từ chối", color: "bg-red-100 text-red-800 border-red-300", icon: "❌" },
            }
            const status = statusInfo[item.status as keyof typeof statusInfo] || statusInfo.PendingApproval
            
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl hover:border-orange-300 transition-all duration-300 overflow-hidden"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Header với image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  {item.imageUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/hero.jpg') {
                            target.src = '/hero.jpg';
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className={`absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border-2 ${status.color} backdrop-blur-sm bg-white/90`}>
                    <span>{status.icon}</span>
                    {status.text}
                  </div>
                  {item.ocopRating && (
                    <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                      <span>⭐</span>
                      {item.ocopRating}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Product Name */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    {item.price && (
                      <p className="text-lg font-bold text-orange-600">
                        {item.price.toLocaleString("vi-VN")} ₫
                      </p>
                    )}
                  </div>

                  {/* Enterprise */}
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Doanh nghiệp</p>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {getEnterpriseName(item)}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  {item.categoryName && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Danh mục</p>
                        <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200">
                          {item.categoryName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stock Status */}
                  {item.stockStatus && (
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.stockStatus === "InStock"
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-red-100 text-red-800 border border-red-300"
                      }`}>
                        {item.stockStatus === "InStock" ? "✓ Còn hàng" : "✗ Hết hàng"}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200">
                    {isPending ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowProductDetails(item)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleApprove(item)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Duyệt
                        </button>
                        <button
                          onClick={() => setShowRejectModal(item.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Từ chối
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleShowProductDetails(item)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Xem chi tiết
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredProducts.length > PAGE_SIZE && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold text-gray-900">{(page - 1) * PAGE_SIZE + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(page * PAGE_SIZE, filteredProducts.length)}</span> trong tổng số <span className="font-semibold text-gray-900">{filteredProducts.length}</span> sản phẩm
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 font-semibold shadow-sm hover:shadow-md transition-all disabled:transform-none transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Trước
              </button>
              <div className="px-6 py-2.5 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <span className="text-sm font-bold text-orange-900">
                  Trang {page}/{totalPages}
                </span>
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 font-semibold shadow-sm hover:shadow-md transition-all disabled:transform-none transform hover:-translate-y-0.5"
              >
                Sau
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 px-8 py-6 flex items-center justify-between shadow-lg">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">⭐ Chi tiết sản phẩm OCOP</h3>
                <p className="text-white/90 text-sm">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8">
              {/* Image Section */}
              {selectedProduct.imageUrl && (
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    🖼️ Hình ảnh sản phẩm
                  </label>
                  <div className="relative w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden border-2 border-gray-300 shadow-lg">
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/hero.jpg') {
                          target.src = '/hero.jpg';
                        }
                      }}
                    />
                  </div>
                  {selectedProduct.imageUrl.startsWith('http') && (
                    <a
                      href={selectedProduct.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 font-semibold hover:underline"
                    >
                      Mở ảnh trong tab mới
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              )}

              {/* Product Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Tên sản phẩm
                    </label>
                    <p className="text-lg text-gray-900 font-bold">
                      {selectedProduct.name || "-"}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Doanh nghiệp
                    </label>
                    {loadingEnterprise[selectedProduct.enterpriseId || 0] ? (
                      <p className="text-base text-gray-500 italic">Đang tải...</p>
                    ) : (
                      <p className="text-base text-gray-900 font-semibold">
                        {getEnterpriseName(selectedProduct)}
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Danh mục
                    </label>
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold border border-purple-300">
                      {selectedProduct.categoryName || "-"}
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Giá (VNĐ)
                    </label>
                    <p className="text-2xl text-green-600 font-bold">
                      {selectedProduct.price
                        ? selectedProduct.price.toLocaleString("vi-VN") + " ₫"
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Tình trạng kho
                    </label>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${
                        selectedProduct.stockStatus === "InStock"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : selectedProduct.stockStatus === "OutOfStock"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : "bg-gray-100 text-gray-800 border-gray-300"
                      }`}
                    >
                      {selectedProduct.stockStatus === "InStock"
                        ? "✓ Còn hàng"
                        : selectedProduct.stockStatus === "OutOfStock"
                        ? "✗ Hết hàng"
                        : selectedProduct.stockStatus || "Không xác định"}
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      OCOP Rating
                    </label>
                    {selectedProduct.ocopRating ? (
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-yellow-600">
                          ⭐ {selectedProduct.ocopRating}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">sao</span>
                      </div>
                    ) : (
                      <p className="text-base text-gray-500 italic">Chưa gán</p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Trạng thái duyệt
                    </label>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${
                        selectedProduct.status === "Approved"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : selectedProduct.status === "PendingApproval"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      }`}
                    >
                      {selectedProduct.status === "Approved"
                        ? "✅ Đã duyệt"
                        : selectedProduct.status === "PendingApproval"
                        ? "⏳ Chờ duyệt"
                        : "❌ Đã từ chối"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  📝 Mô tả sản phẩm
                </label>
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 min-h-[120px] border border-gray-200">
                  <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedProduct.description || (
                      <span className="text-gray-400 italic">Không có mô tả</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedProduct.status === "PendingApproval" && (
                <div className="mt-8 pt-6 border-t-2 border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedProduct(null)
                      handleApprove(selectedProduct)
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    ✓ Duyệt sản phẩm
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(null)
                      setShowRejectModal(selectedProduct.id)
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    ✕ Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Từ chối sản phẩm OCOP</h3>
              </div>
              <button
                onClick={() => {
                  setRejectReason((prev) => ({ ...prev, [showRejectModal]: "" }))
                  setShowRejectModal(null)
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason[showRejectModal] || ""}
                onChange={(e) =>
                  setRejectReason((prev) => ({
                    ...prev,
                    [showRejectModal]: e.target.value
                  }))
                }
                placeholder="Nhập lý do từ chối sản phẩm này..."
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 mb-2 min-h-[120px] focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all resize-none"
              />
              {rejectReason[showRejectModal] && (
                <p className="text-xs text-gray-500 text-right">
                  {rejectReason[showRejectModal].length} ký tự
                </p>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectReason((prev) => ({ ...prev, [showRejectModal]: "" }))
                  setShowRejectModal(null)
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold shadow-sm"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const product = products.find((p) => p.id === showRejectModal)
                  if (product) {
                    handleReject(product)
                  }
                }}
                disabled={!rejectReason[showRejectModal]?.trim()}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                ✕ Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

