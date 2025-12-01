"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { getEnterprises, updateEnterprise, deleteEnterprise, type Enterprise } from "@/lib/api"

export default function EnterpriseManagementTab() {
    const [loading, setLoading] = useState(false)
    const [enterprises, setEnterprises] = useState<Enterprise[]>([])
    const [editingEnterprise, setEditingEnterprise] = useState<Enterprise | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [showApproveModal, setShowApproveModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingEnterprise, setDeletingEnterprise] = useState<Enterprise | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    useEffect(() => {
        loadEnterprises()
    }, [])

    const loadEnterprises = async () => {
        setLoading(true)
        try {
            const data = await getEnterprises()
            const list = Array.isArray(data) ? data : (data as any)?.items || []
            setEnterprises(list)
            console.log(`✅ Loaded ${list.length} enterprises`)
        } catch (err) {
            console.error("Failed to load enterprises:", err)
            setEnterprises([])
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = (enterprise: Enterprise) => {
        setEditingEnterprise(enterprise)
        setShowApproveModal(true)
    }

    const handleReject = (enterprise: Enterprise) => {
        setEditingEnterprise(enterprise)
        setRejectionReason("")
        setShowRejectModal(true)
    }

    const handleSaveApprove = async () => {
        if (!editingEnterprise) return

        try {
            // Update Enterprise với ApprovalStatus = "Approved"
            const payload: Partial<Enterprise> = {
                id: editingEnterprise.id,
                name: editingEnterprise.name,
                description: editingEnterprise.description || "",
                address: editingEnterprise.address || "",
                ward: editingEnterprise.ward || "",
                district: editingEnterprise.district || "",
                province: editingEnterprise.province || "",
                phoneNumber: editingEnterprise.phoneNumber || "",
                emailContact: editingEnterprise.emailContact || "",
                website: editingEnterprise.website || "",
                businessField: editingEnterprise.businessField || "",
                imageUrl: editingEnterprise.imageUrl,
                latitude: editingEnterprise.latitude,
                longitude: editingEnterprise.longitude,
                averageRating: editingEnterprise.averageRating,
                approvalStatus: "Approved",
                rejectionReason: undefined,
            }
            await updateEnterprise(editingEnterprise.id, payload)
            alert("Đã duyệt doanh nghiệp thành công!")
            setShowApproveModal(false)
            setEditingEnterprise(null)
            await loadEnterprises()
        } catch (err) {
            alert("Duyệt thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"))
        }
    }

    const handleSaveReject = async () => {
        if (!editingEnterprise || !rejectionReason.trim()) {
            alert("Vui lòng nhập lý do từ chối")
            return
        }

        try {
            // Update Enterprise với ApprovalStatus = "Rejected"
            await updateEnterprise(editingEnterprise.id, {
                id: editingEnterprise.id,
                name: editingEnterprise.name,
                description: editingEnterprise.description || "",
                address: editingEnterprise.address || "",
                ward: editingEnterprise.ward || "",
                district: editingEnterprise.district || "",
                province: editingEnterprise.province || "",
                phoneNumber: editingEnterprise.phoneNumber || "",
                emailContact: editingEnterprise.emailContact || "",
                website: editingEnterprise.website || "",
                businessField: editingEnterprise.businessField || "",
                imageUrl: editingEnterprise.imageUrl,
                latitude: editingEnterprise.latitude,
                longitude: editingEnterprise.longitude,
                averageRating: editingEnterprise.averageRating,
                approvalStatus: "Rejected",
                rejectionReason: rejectionReason.trim(),
            })
            alert("Đã từ chối doanh nghiệp thành công!")
            setShowRejectModal(false)
            setEditingEnterprise(null)
            setRejectionReason("")
            await loadEnterprises()
        } catch (err) {
            alert("Từ chối thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"))
        }
    }

    const handleDelete = (enterprise: Enterprise) => {
        setDeletingEnterprise(enterprise)
        setShowDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        if (!deletingEnterprise) return

        try {
            await deleteEnterprise(deletingEnterprise.id)
            alert("Đã xóa doanh nghiệp thành công!")
            setShowDeleteModal(false)
            setDeletingEnterprise(null)
            await loadEnterprises()
        } catch (err) {
            alert("Xóa thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"))
        }
    }

    const getApprovalStatus = (enterprise: Enterprise) => {
        const status = enterprise.approvalStatus || "Pending"
        switch (status.toLowerCase()) {
            case "approved":
                return {
                    text: "Đã duyệt",
                    color: "bg-green-100 text-green-800",
                    borderColor: "border-green-300",
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ),
                }
            case "rejected":
                return {
                    text: "Đã từ chối",
                    color: "bg-red-100 text-red-800",
                    borderColor: "border-red-300",
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ),
                }
            default:
                return {
                    text: "Chờ duyệt",
                    color: "bg-yellow-100 text-yellow-800",
                    borderColor: "border-yellow-300",
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                }
        }
    }

    // Filter enterprises
    const filteredEnterprises = useMemo(() => {
        return enterprises.filter((enterprise) => {
            const matchesSearch = searchQuery === "" || 
                enterprise.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                enterprise.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                enterprise.businessField?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                enterprise.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                enterprise.province?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus = statusFilter === "all" || 
                (statusFilter === "pending" && (enterprise.approvalStatus || "Pending").toLowerCase() === "pending") ||
                (statusFilter === "approved" && (enterprise.approvalStatus || "").toLowerCase() === "approved") ||
                (statusFilter === "rejected" && (enterprise.approvalStatus || "").toLowerCase() === "rejected")

            return matchesSearch && matchesStatus
        })
    }, [enterprises, searchQuery, statusFilter])

    return (
        <div className="space-y-6">
            {/* Header với stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý doanh nghiệp</h2>
                    <p className="text-gray-600">Quản lý và duyệt các doanh nghiệp OCOP trong hệ thống</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg">
                        <div className="text-2xl font-bold">{enterprises.length}</div>
                        <div className="text-sm opacity-90">Tổng doanh nghiệp</div>
                    </div>
                </div>
            </div>

            {/* Search và Filter */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tìm kiếm</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm theo tên, địa chỉ, lĩnh vực..."
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                            />
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    {/* Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Lọc theo trạng thái</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
                        >
                            <option value="all">Tất cả</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Đã từ chối</option>
                        </select>
                    </div>
                </div>
                {filteredEnterprises.length !== enterprises.length && (
                    <div className="mt-4 text-sm text-gray-600">
                        Hiển thị {filteredEnterprises.length} / {enterprises.length} doanh nghiệp
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                    </div>
                </div>
            ) : filteredEnterprises.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-gray-500 font-medium text-lg mb-2">Không tìm thấy doanh nghiệp nào</p>
                        <p className="text-gray-400 text-sm">
                            {searchQuery || statusFilter !== "all" 
                                ? "Thử thay đổi bộ lọc để xem thêm kết quả" 
                                : "Chưa có doanh nghiệp nào trong hệ thống"}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEnterprises.map((enterprise, index) => {
                        const status = getApprovalStatus(enterprise)
                        const isPending = (enterprise.approvalStatus || "Pending").toLowerCase() === "pending"
                        return (
                            <div
                                key={enterprise.id}
                                className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
                                style={{
                                    animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
                                }}
                            >
                                {/* Image */}
                                <div className="relative h-48 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 overflow-hidden">
                                    {enterprise.imageUrl ? (
                                        <Image
                                            src={enterprise.imageUrl}
                                            alt={enterprise.name || "Enterprise"}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-20 h-20 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                    )}
                                    {/* Status Badge */}
                                    <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full ${status.color} ${status.borderColor} border-2 shadow-lg backdrop-blur-sm`}>
                                        {status.icon}
                                        <span className="text-xs font-bold">{status.text}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                        {enterprise.name || "Tên không xác định"}
                                    </h3>
                                    
                                    {/* Location */}
                                    <div className="flex items-start gap-2 mb-3">
                                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <p className="text-sm text-gray-600 line-clamp-2 flex-1">
                                            {[enterprise.address, enterprise.district, enterprise.province]
                                                .filter(Boolean)
                                                .join(", ") || "Chưa có địa chỉ"}
                                        </p>
                                    </div>

                                    {/* Business Field */}
                                    {enterprise.businessField && (
                                        <div className="flex items-start gap-2 mb-4">
                                            <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                                                {enterprise.businessField}
                                            </span>
                                        </div>
                                    )}

                                    {/* Rejection Reason */}
                                    {enterprise.rejectionReason && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-xs font-semibold text-red-800 mb-1">Lý do từ chối:</p>
                                            <p className="text-xs text-red-700">{enterprise.rejectionReason}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-4 border-t border-gray-200">
                                        {isPending ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(enterprise)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Duyệt
                                                </button>
                                                <button
                                                    onClick={() => handleReject(enterprise)}
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
                                                onClick={() => handleDelete(enterprise)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Xóa doanh nghiệp
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Approve Modal */}
            {showApproveModal && editingEnterprise && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all animate-scaleIn">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Duyệt doanh nghiệp</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowApproveModal(false)
                                    setEditingEnterprise(null)
                                }}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Doanh nghiệp:</p>
                            <p className="text-lg font-bold text-gray-900">{editingEnterprise.name}</p>
                        </div>

                        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm text-gray-700">
                                Bạn có chắc chắn muốn duyệt doanh nghiệp này không? Doanh nghiệp sẽ được hiển thị công khai trên hệ thống.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false)
                                    setEditingEnterprise(null)
                                }}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-sm"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveApprove}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                ✓ Xác nhận duyệt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && editingEnterprise && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all animate-scaleIn">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Từ chối doanh nghiệp</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false)
                                    setEditingEnterprise(null)
                                    setRejectionReason("")
                                }}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Doanh nghiệp:</p>
                            <p className="text-lg font-bold text-gray-900">{editingEnterprise.name}</p>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                                Lý do từ chối <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Nhập lý do từ chối doanh nghiệp này..."
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all"
                                rows={5}
                            />
                            {rejectionReason.trim() && (
                                <p className="mt-2 text-xs text-gray-500">
                                    {rejectionReason.length} ký tự
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false)
                                    setEditingEnterprise(null)
                                    setRejectionReason("")
                                }}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-sm"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveReject}
                                disabled={!rejectionReason.trim()}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                            >
                                ✕ Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingEnterprise && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all animate-scaleIn">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-red-600">Xóa doanh nghiệp</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeletingEnterprise(null)
                                }}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Doanh nghiệp:</p>
                            <p className="text-lg font-bold text-gray-900">{deletingEnterprise.name}</p>
                        </div>

                        <div className="mb-8 p-5 bg-red-50 border-2 border-red-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="text-sm text-red-800 font-bold mb-2">⚠️ Cảnh báo:</p>
                                    <p className="text-sm text-red-700 leading-relaxed">
                                        Bạn có chắc chắn muốn xóa doanh nghiệp này không? Hành động này <strong>không thể hoàn tác</strong>.
                                        Tất cả dữ liệu liên quan (sản phẩm, đơn hàng, v.v.) có thể bị ảnh hưởng.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeletingEnterprise(null)
                                }}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-sm"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                🗑️ Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
