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

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Duyệt sản phẩm OCOP</h2>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={filters.search}
            onChange={(e) =>
              setFilters((v) => ({ ...v, search: e.target.value }))
            }
            placeholder="Tìm theo tên sản phẩm hoặc doanh nghiệp"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((v) => ({ ...v, status: e.target.value }))
            }
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="PendingApproval">Chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Đã từ chối</option>
            <option value="all">Tất cả</option>
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
                setFilters({ search: "", status: "PendingApproval" })
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
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : pagedProducts.length === 0 ? (
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
              {pagedProducts.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.enterprise?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.categoryName || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${(item.status || "") === "PendingApproval"
                          ? "bg-yellow-100 text-yellow-800"
                          : item.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                    >
                      {item.status === "PendingApproval"
                        ? "Chờ duyệt"
                        : item.status === "Approved"
                          ? "Đã duyệt"
                          : "Đã từ chối"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleShowProductDetails(item)}
                      className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium"
                    >
                      Chi tiết
                    </button>
                    {item.status === "PendingApproval" && (
                      <>
                        <button
                          onClick={() => handleApprove(item)}
                          className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs font-medium"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => setShowRejectModal(item.id)}
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
        {filteredProducts.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-gray-600">
              Tổng: {filteredProducts.length}
            </span>
            <div className="space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50 hover:bg-gray-200"
              >
                Trước
              </button>
              <span className="px-3 py-1">
                Trang {page}/{totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-gray-900">Chi tiết sản phẩm OCOP</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {/* Image Section */}
              {selectedProduct.imageUrl && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hình ảnh sản phẩm
                  </label>
                  <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
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
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1"
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Tên sản phẩm
                    </label>
                    <p className="text-base text-gray-900 font-medium">
                      {selectedProduct.name || "-"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Doanh nghiệp
                    </label>
                    {loadingEnterprise[selectedProduct.enterpriseId || 0] ? (
                      <p className="text-base text-gray-500 italic">Đang tải...</p>
                    ) : (
                      <p className="text-base text-gray-900">
                        {getEnterpriseName(selectedProduct)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Danh mục
                    </label>
                    <p className="text-base text-gray-900">
                      {selectedProduct.categoryName || "-"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Giá (VNĐ)
                    </label>
                    <p className="text-lg text-green-600 font-bold">
                      {selectedProduct.price
                        ? selectedProduct.price.toLocaleString("vi-VN") + " ₫"
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Tình trạng kho
                    </label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedProduct.stockStatus === "InStock"
                          ? "bg-green-100 text-green-800"
                          : selectedProduct.stockStatus === "OutOfStock"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedProduct.stockStatus === "InStock"
                        ? "Còn hàng"
                        : selectedProduct.stockStatus === "OutOfStock"
                        ? "Hết hàng"
                        : selectedProduct.stockStatus || "Không xác định"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      OCOP Rating
                    </label>
                    {selectedProduct.ocopRating ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-yellow-600">
                          ⭐ {selectedProduct.ocopRating}
                        </span>
                        <span className="text-sm text-gray-600">sao</span>
                      </div>
                    ) : (
                      <p className="text-base text-gray-500 italic">Chưa gán</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Trạng thái duyệt
                    </label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedProduct.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : selectedProduct.status === "PendingApproval"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedProduct.status === "Approved"
                        ? "Đã duyệt"
                        : selectedProduct.status === "PendingApproval"
                        ? "Chờ duyệt"
                        : "Đã từ chối"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả sản phẩm
                </label>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                  <p className="text-base text-gray-700 whitespace-pre-wrap">
                    {selectedProduct.description || (
                      <span className="text-gray-400 italic">Không có mô tả</span>
                    )}
                  </p>
                </div>
              </div>
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
              value={rejectReason[showRejectModal] || ""}
              onChange={(e) =>
                setRejectReason((prev) => ({
                  ...prev,
                  [showRejectModal]: e.target.value
                }))
              }
              placeholder="Nhập lý do từ chối..."
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectReason((prev) => ({ ...prev, [showRejectModal]: "" }))
                  setShowRejectModal(null)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
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

