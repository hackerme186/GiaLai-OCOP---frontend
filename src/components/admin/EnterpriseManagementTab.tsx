"use client"

import { useEffect, useState } from "react"
import { getEnterprises, updateEnterprise, type Enterprise } from "@/lib/api"

export default function EnterpriseManagementTab() {
    const [loading, setLoading] = useState(false)
    const [enterprises, setEnterprises] = useState<Enterprise[]>([])
    const [editingEnterprise, setEditingEnterprise] = useState<Enterprise | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [showApproveModal, setShowApproveModal] = useState(false)

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

    const getApprovalStatus = (enterprise: Enterprise) => {
        const status = enterprise.approvalStatus || "Pending"
        switch (status.toLowerCase()) {
            case "approved":
                return {
                    text: "Đã duyệt",
                    color: "bg-green-100 text-green-800",
                }
            case "rejected":
                return {
                    text: "Đã từ chối",
                    color: "bg-red-100 text-red-800",
                }
            default:
                return {
                    text: "Chờ duyệt",
                    color: "bg-yellow-100 text-yellow-800",
                }
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quản lý doanh nghiệp</h2>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            ) : enterprises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Không có doanh nghiệp nào</div>
            ) : (
                <div className="border rounded-lg shadow-sm overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">Tên doanh nghiệp</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">Địa chỉ</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">Lĩnh vực</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">Trạng thái</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enterprises.map((enterprise) => {
                                const status = getApprovalStatus(enterprise)
                                const isPending = (enterprise.approvalStatus || "Pending").toLowerCase() === "pending"
                                return (
                                    <tr key={enterprise.id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{enterprise.name || "-"}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {[enterprise.address, enterprise.district, enterprise.province]
                                                .filter(Boolean)
                                                .join(", ") || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{enterprise.businessField || "-"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                                {status.text}
                                            </span>
                                            {enterprise.rejectionReason && (
                                                <div className="text-xs text-red-600 mt-1">
                                                    Lý do: {enterprise.rejectionReason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {isPending && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(enterprise)}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(enterprise)}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                                {!isPending && (
                                                    <span className="text-gray-400 text-sm font-medium">Đã xử lý</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Approve Modal */}
            {showApproveModal && editingEnterprise && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Duyệt doanh nghiệp</h3>
                            <button
                                onClick={() => {
                                    setShowApproveModal(false)
                                    setEditingEnterprise(null)
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Doanh nghiệp:</p>
                            <p className="font-semibold text-gray-900">{editingEnterprise.name}</p>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600">
                                Bạn có chắc chắn muốn duyệt doanh nghiệp này không?
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false)
                                    setEditingEnterprise(null)
                                }}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveApprove}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all"
                            >
                                Xác nhận duyệt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && editingEnterprise && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Từ chối doanh nghiệp</h3>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false)
                                    setEditingEnterprise(null)
                                    setRejectionReason("")
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Doanh nghiệp:</p>
                            <p className="font-semibold text-gray-900">{editingEnterprise.name}</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Lý do từ chối <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Nhập lý do từ chối..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false)
                                    setEditingEnterprise(null)
                                    setRejectionReason("")
                                }}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveReject}
                                disabled={!rejectionReason.trim()}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
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
