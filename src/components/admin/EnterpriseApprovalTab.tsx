"use client"

import { useEffect, useMemo, useState } from "react"
import {
  EnterpriseApplication,
  approveEnterpriseApplication,
  getEnterpriseApplications,
  rejectEnterpriseApplication,
  createProductForEnterprise,
  getUser,
  getCategories,
  type Category,
  type CreateProductDto
} from "@/lib/api"

const PAGE_SIZE = 10

export default function EnterpriseApprovalTab() {
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<EnterpriseApplication[]>([])
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search: "",
    address: "",
    field: "",
    status: "Pending"
  })
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({})
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null)
  const [viewingApplication, setViewingApplication] = useState<EnterpriseApplication | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEnterpriseApplications()
      const list = Array.isArray(data)
        ? data
        : (data as any)?.items || (data as any)?.data || []
      setApplications(list)
    } catch (err) {
      console.error("Failed to load enterprise applications:", err)
      setApplications([])
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách hồ sơ OCOP"
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch = filters.search
        ? app.enterpriseName
          ?.toLowerCase()
          .includes(filters.search.toLowerCase())
        : true
      const matchAddress = filters.address
        ? (
          `${app.address} ${app.district} ${app.province}`.toLowerCase()
        ).includes(filters.address.toLowerCase())
        : true
      const matchField = filters.field
        ? app.businessField
          ?.toLowerCase()
          .includes(filters.field.toLowerCase())
        : true
      const matchStatus =
        !filters.status || filters.status === "all"
          ? true
          : (app.status || "Pending")
            .toLowerCase()
            .includes(filters.status.toLowerCase())

      return matchSearch && matchAddress && matchField && matchStatus
    })
  }, [applications, filters])

  const totalPages = Math.ceil(filteredApplications.length / PAGE_SIZE) || 1
  const pagedApplications = filteredApplications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  useEffect(() => {
    if (page > totalPages) {
      setPage(Math.max(1, totalPages))
    }
  }, [totalPages, page])

  const handleApprove = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn duyệt hồ sơ này?")) return
    
    // Tìm application data trước khi approve
    const application = applications.find(app => app.id === id)
    if (!application) {
      alert("Không tìm thấy thông tin đơn đăng ký")
      return
    }

    try {
      // Bước 1: Duyệt đơn đăng ký OCOP
      await approveEnterpriseApplication(id)
      console.log("✅ Đã duyệt đơn đăng ký OCOP:", id)

      // Bước 2: Lấy thông tin user để lấy enterpriseId
      let enterpriseId: number | undefined
      try {
        const user = await getUser(application.userId)
        enterpriseId = user.enterpriseId
        console.log("✅ Lấy được enterpriseId:", enterpriseId)
      } catch (userErr) {
        console.warn("⚠️ Không thể lấy enterpriseId từ user:", userErr)
        // Có thể backend chưa tạo enterprise ngay, đợi một chút
        await new Promise(resolve => setTimeout(resolve, 1000))
        try {
          const user = await getUser(application.userId)
          enterpriseId = user.enterpriseId
          console.log("✅ Lấy được enterpriseId sau khi đợi:", enterpriseId)
        } catch (retryErr) {
          console.error("❌ Vẫn không lấy được enterpriseId:", retryErr)
        }
      }

      // Bước 3: Tạo sản phẩm từ thông tin trong application
      if (application.productName && enterpriseId) {
        try {
          // Tìm categoryId từ productCategory name
          let categoryId: number | undefined
          if (application.productCategory) {
            try {
              const categories = await getCategories(true) // Chỉ lấy active categories
              const category = categories.find(
                cat => cat.name.toLowerCase().trim() === application.productCategory.toLowerCase().trim()
              )
              if (category) {
                categoryId = category.id
                console.log("✅ Tìm thấy categoryId:", categoryId, "cho category:", application.productCategory)
              } else {
                console.warn("⚠️ Không tìm thấy category với tên:", application.productCategory)
              }
            } catch (catErr) {
              console.warn("⚠️ Không thể load categories:", catErr)
            }
          }

          // Lấy hình ảnh đầu tiên từ productImages (comma-separated)
          const productImageUrl = application.productImages 
            ? application.productImages.split(',')[0].trim() 
            : undefined

          // Tạo sản phẩm với status "PendingApproval" để SystemAdmin có thể duyệt
          const productData: CreateProductDto = {
            name: application.productName,
            description: application.productDescription || "",
            price: 0, // Giá mặc định, có thể cập nhật sau
            imageUrl: productImageUrl,
            stockStatus: "InStock",
            categoryId: categoryId,
            enterpriseId: enterpriseId, // Gán enterpriseId để sản phẩm thuộc về enterprise đã được duyệt
            // Không set ocopRating ở đây, để SystemAdmin quyết định khi duyệt
          }

          console.log("📤 Tạo sản phẩm từ đơn đăng ký OCOP:", {
            ...productData,
            enterpriseId: enterpriseId,
          })
          
          // Tạo sản phẩm sử dụng API dành cho SystemAdmin
          // API: POST /api/products/enterprise/{enterpriseId}
          const createdProduct = await createProductForEnterprise(enterpriseId, productData)
          console.log("✅ Đã tạo sản phẩm:", createdProduct)

          // Kiểm tra xem sản phẩm đã có enterpriseId chưa
          if (createdProduct && createdProduct.enterpriseId) {
            console.log("✅ Sản phẩm đã được gán enterpriseId:", createdProduct.enterpriseId)
          } else {
            console.warn("⚠️ Sản phẩm chưa có enterpriseId. Backend có thể cần xử lý để gán enterpriseId cho sản phẩm này.")
            console.warn("⚠️ EnterpriseId cần gán:", enterpriseId)
          }

          alert("Đã duyệt thành công và tạo sản phẩm! Sản phẩm đã được chuyển vào phần duyệt sản phẩm.")
        } catch (productErr) {
          console.error("❌ Lỗi khi tạo sản phẩm:", productErr)
          // Vẫn báo thành công duyệt đơn, nhưng cảnh báo về sản phẩm
          alert(
            "Đã duyệt thành công!\n\n" +
            "⚠️ Lưu ý: Không thể tự động tạo sản phẩm. " +
            "Vui lòng tạo sản phẩm thủ công hoặc kiểm tra lại thông tin đơn đăng ký.\n\n" +
            "Lỗi: " + (productErr instanceof Error ? productErr.message : "Lỗi không xác định")
          )
        }
      } else {
        if (!application.productName) {
          console.warn("⚠️ Đơn đăng ký không có thông tin sản phẩm")
        }
        if (!enterpriseId) {
          console.warn("⚠️ Không lấy được enterpriseId, không thể tạo sản phẩm")
        }
        alert("Đã duyệt thành công!\n\n⚠️ Lưu ý: Không thể tự động tạo sản phẩm do thiếu thông tin.")
      }

      await loadApplications()
    } catch (err) {
      console.error("❌ Lỗi khi duyệt đơn đăng ký:", err)
      alert(
        "Duyệt thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định")
      )
    }
  }

  const handleReject = async (id: number) => {
    const reason = (rejectReason[id] || "").trim()
    if (!reason) {
      alert("Vui lòng nhập lý do từ chối")
      return
    }
    if (!confirm("Bạn có chắc chắn muốn từ chối hồ sơ này?")) return
    try {
      await rejectEnterpriseApplication(id, reason)
      alert("Đã từ chối thành công!")
      setShowRejectModal(null)
      setRejectReason((prev) => ({ ...prev, [id]: "" }))
      await loadApplications()
    } catch (err) {
      alert(
        "Từ chối thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định")
      )
    }
  }

  const handleSearch = () => {
    setPage(1)
  }

  const pendingCount = applications.filter(a => (a.status || "Pending").toLowerCase() === "pending").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📋 Duyệt đơn đăng ký doanh nghiệp</h2>
            <p className="text-white/90 text-lg">Xem xét và phê duyệt đơn đăng ký OCOP của các doanh nghiệp</p>
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm opacity-90">Đơn chờ duyệt</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tên doanh nghiệp</label>
            <div className="relative">
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((v) => ({ ...v, search: e.target.value }))
                }
                placeholder="Nhập tên doanh nghiệp..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ / Tỉnh / Huyện</label>
            <div className="relative">
              <input
                value={filters.address}
                onChange={(e) =>
                  setFilters((v) => ({ ...v, address: e.target.value }))
                }
                placeholder="Nhập địa chỉ..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lĩnh vực kinh doanh</label>
            <div className="relative">
              <input
                value={filters.field}
                onChange={(e) =>
                  setFilters((v) => ({ ...v, field: e.target.value }))
                }
                placeholder="Nhập lĩnh vực..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white cursor-pointer"
            >
              <option value="Pending">⏳ Chờ duyệt</option>
              <option value="Approved">✅ Đã duyệt</option>
              <option value="Rejected">❌ Đã từ chối</option>
              <option value="all">📋 Tất cả</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSearch}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm
          </button>
          <button
            onClick={() => {
              setFilters({
                search: "",
                address: "",
                field: "",
                status: "Pending"
              })
              setPage(1)
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-200 font-semibold transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Xóa lọc
          </button>
          {filteredApplications.length !== applications.length && (
            <span className="text-sm text-gray-600 ml-auto">
              Tìm thấy {filteredApplications.length} / {applications.length} đơn đăng ký
            </span>
          )}
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4" />
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
                onClick={loadApplications}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      ) : pagedApplications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
          <div className="text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium text-lg mb-2">Không có dữ liệu</p>
            <p className="text-gray-400 text-sm">
              {filters.search || filters.address || filters.field || filters.status !== "Pending"
                ? "Thử thay đổi bộ lọc để xem thêm kết quả"
                : "Chưa có đơn đăng ký nào trong hệ thống"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pagedApplications.map((item, index) => {
            const isPending = (item.status || "Pending").toLowerCase() === "pending"
            const statusInfo = {
              pending: { text: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: "⏳" },
              approved: { text: "Đã duyệt", color: "bg-green-100 text-green-800 border-green-300", icon: "✅" },
              rejected: { text: "Đã từ chối", color: "bg-red-100 text-red-800 border-red-300", icon: "❌" },
            }
            const status = statusInfo[(item.status || "Pending").toLowerCase() as keyof typeof statusInfo] || statusInfo.pending
            
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl hover:border-indigo-300 transition-all duration-300 overflow-hidden"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Header với status */}
                <div className={`p-6 ${isPending ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-b-2 border-yellow-200' : status.color.includes('green') ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border-b-2 border-red-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {item.enterpriseName || "Tên không xác định"}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border-2 ${status.color}`}>
                          <span>{status.icon}</span>
                          {status.text}
                        </span>
                        {item.createdAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Địa chỉ</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {[item.address, item.district, item.province]
                          .filter(Boolean)
                          .join(", ") || "Chưa có địa chỉ"}
                      </p>
                    </div>
                  </div>

                  {/* Business Field */}
                  {item.businessField && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Lĩnh vực</p>
                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-200">
                          {item.businessField}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Product Info */}
                  {item.productName && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-sm font-bold text-green-800">Sản phẩm đại diện</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                        {item.productCategory && (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                            {item.productCategory}
                          </span>
                        )}
                        {item.productDescription && (
                          <p className="text-xs text-gray-600 line-clamp-2">{item.productDescription}</p>
                        )}
                        {item.productImages && (
                          <div className="flex gap-2 mt-2">
                            {item.productImages.split(',').slice(0, 3).map((url, idx) => (
                              <img
                                key={idx}
                                src={url.trim()}
                                alt={`Product ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-green-200"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            ))}
                            {item.productImages.split(',').length > 3 && (
                              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center text-green-700 text-xs font-semibold">
                                +{item.productImages.split(',').length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {item.adminComment && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs font-semibold text-red-800 mb-1">Lý do từ chối:</p>
                      <p className="text-xs text-red-700 line-clamp-2">{item.adminComment}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200">
                    {isPending ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingApplication(item)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleApprove(item.id)}
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
                        onClick={() => setViewingApplication(item)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
      {filteredApplications.length > PAGE_SIZE && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold text-gray-900">{(page - 1) * PAGE_SIZE + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(page * PAGE_SIZE, filteredApplications.length)}</span> trong tổng số <span className="font-semibold text-gray-900">{filteredApplications.length}</span> đơn đăng ký
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
              <div className="px-6 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <span className="text-sm font-bold text-indigo-900">
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

      {/* View Details Modal */}
      {viewingApplication && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex items-center justify-between shadow-lg">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Chi tiết đơn đăng ký</h3>
                <p className="text-white/90 text-sm">{viewingApplication.enterpriseName}</p>
              </div>
              <button
                onClick={() => setViewingApplication(null)}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Status Badge & Date */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${
                    (viewingApplication.status || "").toLowerCase() === "pending"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                      : (viewingApplication.status || "").toLowerCase() === "approved"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-red-100 text-red-800 border-red-300"
                  }`}>
                    {(viewingApplication.status || "Pending").toLowerCase() === "pending" ? "⏳" : 
                     (viewingApplication.status || "").toLowerCase() === "approved" ? "✅" : "❌"} {" "}
                    {viewingApplication.status || "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    Ngày tạo: {viewingApplication.createdAt ? new Date(viewingApplication.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}
                  </span>
                </div>
              </div>

              {/* Enterprise Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">
                    1. Thông tin doanh nghiệp
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Tên doanh nghiệp</label>
                    <p className="text-base font-bold text-gray-900">{viewingApplication.enterpriseName || "-"}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Loại hình doanh nghiệp</label>
                    <p className="text-base font-semibold text-gray-900">{viewingApplication.businessType || "-"}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Mã số thuế</label>
                    <p className="text-base font-semibold text-gray-900 font-mono">{viewingApplication.taxCode || "-"}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Số giấy phép kinh doanh</label>
                    <p className="text-base font-semibold text-gray-900 font-mono">{viewingApplication.businessLicenseNumber || "-"}</p>
                  </div>
                  {viewingApplication.licenseIssuedDate && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Ngày cấp giấy phép</label>
                      <p className="text-base font-semibold text-gray-900">{new Date(viewingApplication.licenseIssuedDate).toLocaleDateString("vi-VN")}</p>
                    </div>
                  )}
                  {viewingApplication.licenseIssuedBy && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Nơi cấp giấy phép</label>
                      <p className="text-base font-semibold text-gray-900">{viewingApplication.licenseIssuedBy}</p>
                    </div>
                  )}
                  <div className="md:col-span-2 bg-white rounded-xl p-4 border border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Địa chỉ</label>
                    <p className="text-base font-semibold text-gray-900">
                      {[
                        viewingApplication.address,
                        viewingApplication.ward,
                        viewingApplication.district,
                        viewingApplication.province
                      ].filter(Boolean).join(", ") || "-"}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Số điện thoại</label>
                    <p className="text-base font-semibold text-gray-900">{viewingApplication.phoneNumber || "-"}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Email liên hệ</label>
                    <p className="text-base font-semibold text-gray-900">{viewingApplication.emailContact || "-"}</p>
                  </div>
                  {viewingApplication.website && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Website</label>
                      <a href={viewingApplication.website} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                        {viewingApplication.website}
                      </a>
                    </div>
                  )}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Lĩnh vực kinh doanh</label>
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-200">
                      {viewingApplication.businessField || "-"}
                    </span>
                  </div>
                  {viewingApplication.productionLocation && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Địa điểm sản xuất</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.productionLocation}</p>
                    </div>
                  )}
                  {viewingApplication.numberOfEmployees && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Số lao động</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.numberOfEmployees}</p>
                    </div>
                  )}
                  {viewingApplication.productionScale && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quy mô sản xuất</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.productionScale}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Representative Information */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">
                    2. Thông tin đại diện pháp luật
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Họ tên đại diện</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.representativeName || "-"}</p>
                  </div>
                  {viewingApplication.representativePosition && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Chức vụ đại diện</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.representativePosition}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">CMND/CCCD</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.representativeIdNumber || "-"}</p>
                  </div>
                  {viewingApplication.representativeIdIssuedDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngày cấp</label>
                      <p className="text-gray-900 mt-1">{new Date(viewingApplication.representativeIdIssuedDate).toLocaleDateString("vi-VN")}</p>
                    </div>
                  )}
                  {viewingApplication.representativeIdIssuedBy && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nơi cấp</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.representativeIdIssuedBy}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">
                    3. Thông tin sản phẩm
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tên sản phẩm OCOP</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.productName || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nhóm sản phẩm</label>
                    <p className="text-gray-900 mt-1">{viewingApplication.productCategory || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Mô tả sản phẩm</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{viewingApplication.productDescription || "-"}</p>
                  </div>
                  {viewingApplication.productOrigin && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Xuất xứ sản phẩm</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.productOrigin}</p>
                    </div>
                  )}
                  {viewingApplication.productCertifications && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Chứng nhận sản phẩm</label>
                      <p className="text-gray-900 mt-1">{viewingApplication.productCertifications}</p>
                    </div>
                  )}
                  {viewingApplication.productImages && (
                    <div className="md:col-span-2 bg-white rounded-xl p-4 border border-gray-200">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Hình ảnh sản phẩm</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {viewingApplication.productImages.split(',').filter(Boolean).map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={url.trim()}
                              alt={`Product ${idx + 1}`}
                              className="w-full h-40 object-cover rounded-xl border-2 border-gray-200 group-hover:border-indigo-400 transition-all shadow-md hover:shadow-xl"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all flex items-center justify-center">
                              <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              {viewingApplication.additionalNotes && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Ghi chú bổ sung
                  </h4>
                  <p className="text-gray-900 whitespace-pre-wrap">{viewingApplication.additionalNotes}</p>
                </div>
              )}

              {/* Admin Comment (if rejected) */}
              {viewingApplication.adminComment && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="text-lg font-semibold text-red-900 mb-2">Lý do từ chối</h4>
                  <p className="text-red-800 whitespace-pre-wrap">{viewingApplication.adminComment}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => setViewingApplication(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold shadow-sm"
                >
                  Đóng
                </button>
                {(viewingApplication.status || "").toLowerCase() === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        setViewingApplication(null)
                        handleApprove(viewingApplication.id)
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      ✓ Duyệt đơn
                    </button>
                    <button
                      onClick={() => {
                        setViewingApplication(null)
                        setShowRejectModal(viewingApplication.id)
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      ✕ Từ chối
                    </button>
                  </>
                )}
              </div>
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
                <h3 className="text-2xl font-bold text-gray-900">Từ chối đơn đăng ký</h3>
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
                placeholder="Nhập lý do từ chối đơn đăng ký này..."
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
                onClick={() => handleReject(showRejectModal)}
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

