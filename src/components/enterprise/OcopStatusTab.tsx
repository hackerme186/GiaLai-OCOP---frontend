"use client"

import { useEffect, useState } from "react"
import { getEnterpriseProducts, type Product, type User } from "@/lib/api"

interface OcopStatusTabProps {
  user: User | null
}

export default function OcopStatusTab({ user }: OcopStatusTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      
      if (!user?.enterpriseId) {
        console.warn("No enterpriseId found")
        setLoading(false)
        return
      }
      
      const data = await getEnterpriseProducts(user.enterpriseId, { pageSize: 100 })
      setProducts(data)
    } catch (err) {
      console.error("Failed to load products:", err)
    } finally {
      setLoading(false)
    }
  }

  const statusCounts = {
    Approved: products.filter(p => p.status === "Approved").length,
    PendingApproval: products.filter(p => p.status === "PendingApproval").length,
    Rejected: products.filter(p => p.status === "Rejected").length,
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Trạng thái OCOP</h2>
        <p className="text-sm text-gray-500">Theo dõi trạng thái duyệt sản phẩm OCOP của doanh nghiệp</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-4xl font-bold text-green-600">{statusCounts.Approved}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Đã duyệt</h3>
          <p className="text-sm text-gray-600">Sản phẩm đã được phê duyệt</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-600">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-4xl font-bold text-yellow-600">{statusCounts.PendingApproval}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Chờ duyệt</h3>
          <p className="text-sm text-gray-600">Đang chờ quản trị viên xét duyệt</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-600">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-4xl font-bold text-red-600">{statusCounts.Rejected}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Bị từ chối</h3>
          <p className="text-sm text-gray-600">Sản phẩm không được phê duyệt</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Quy trình duyệt OCOP</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Sau khi tạo hoặc chỉnh sửa sản phẩm, trạng thái sẽ là <strong>"Chờ duyệt"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Quản trị viên hệ thống (SystemAdmin) sẽ xem xét và phê duyệt sản phẩm</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Chỉ sản phẩm <strong>"Đã duyệt"</strong> mới hiển thị trên website và có thể bán</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Nếu sản phẩm bị từ chối, bạn có thể chỉnh sửa và gửi lại để duyệt</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Product List by Status */}
      {products.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Danh sách sản phẩm theo trạng thái</h3>
          <div className="space-y-3">
            {["Approved", "PendingApproval", "Rejected"].map((status) => {
              const statusProducts = products.filter(p => p.status === status)
              if (statusProducts.length === 0) return null

              const labels: Record<string, string> = {
                Approved: "Đã duyệt",
                PendingApproval: "Chờ duyệt",
                Rejected: "Bị từ chối"
              }

              return (
                <details key={status} className="group">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-semibold text-gray-900">{labels[status]}</span>
                        <span className="text-sm text-gray-500">({statusProducts.length} sản phẩm)</span>
                      </div>
                    </div>
                  </summary>
                  <div className="mt-2 ml-8 space-y-2">
                    {statusProducts.map((product) => (
                      <div key={product.id} className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-600">{product.price.toLocaleString("vi-VN")}₫</p>
                          </div>
                          {product.ocopRating && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                              ⭐ {product.ocopRating}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

