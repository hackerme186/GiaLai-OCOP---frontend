"use client"

import { useEffect, useState } from "react"
import { getUsers, updateUser, deleteUser, getEnterprises, type User, type Enterprise } from "@/lib/api"

export default function UserManagementTab() {
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [enterprises, setEnterprises] = useState<Enterprise[]>([])
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingUser, setDeletingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState<Partial<User>>({})
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        loadUsers()
        loadEnterprises()
    }, [])

    const loadEnterprises = async () => {
        try {
            const data = await getEnterprises()
            const list = Array.isArray(data) ? data : (data as any)?.items || []
            setEnterprises(list)
        } catch (err) {
            console.error("Failed to load enterprises:", err)
        }
    }

    const loadUsers = async () => {
        setLoading(true)
        try {
            const data = await getUsers()
            const list = Array.isArray(data) ? data : (data as any)?.items || []
            setUsers(list)
            console.log(`✅ Loaded ${list.length} users`)
        } catch (err) {
            console.error("Failed to load users:", err)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            enterpriseId: user.enterpriseId,
            phoneNumber: user.phoneNumber || "",
            gender: user.gender || "",
            dateOfBirth: user.dateOfBirth || "",
            shippingAddress: user.shippingAddress || "",
            avatarUrl: user.avatarUrl || "",
            isEmailVerified: user.isEmailVerified,
            provinceId: user.provinceId,
            districtId: user.districtId,
            wardId: user.wardId,
            addressDetail: user.addressDetail || "",
        })
        setShowEditModal(true)
    }

    const handleSaveEdit = async () => {
        if (!editingUser) return

        try {
            const payload: any = {}
            if (formData.name !== undefined) payload.name = formData.name
            if (formData.email !== undefined) payload.email = formData.email
            if (formData.role !== undefined) payload.role = formData.role
            if (formData.enterpriseId !== undefined) payload.enterpriseId = formData.enterpriseId
            if (formData.phoneNumber !== undefined) payload.phoneNumber = formData.phoneNumber || null
            if (formData.gender !== undefined) payload.gender = formData.gender || null
            if (formData.dateOfBirth !== undefined) payload.dateOfBirth = formData.dateOfBirth || null
            if (formData.shippingAddress !== undefined) payload.shippingAddress = formData.shippingAddress || null
            if (formData.avatarUrl !== undefined) payload.avatarUrl = formData.avatarUrl || null
            if (formData.isEmailVerified !== undefined) payload.isEmailVerified = formData.isEmailVerified
            if (formData.provinceId !== undefined) payload.provinceId = formData.provinceId || null
            if (formData.districtId !== undefined) payload.districtId = formData.districtId || null
            if (formData.wardId !== undefined) payload.wardId = formData.wardId || null
            if (formData.addressDetail !== undefined) payload.addressDetail = formData.addressDetail || null

            await updateUser(editingUser.id, payload)
            alert("Đã cập nhật thông tin người dùng thành công!")
            setShowEditModal(false)
            setEditingUser(null)
            setFormData({})
            await loadUsers()
        } catch (err) {
            alert("Cập nhật thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"))
        }
    }

    const handleDelete = (user: User) => {
        setDeletingUser(user)
        setShowDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        if (!deletingUser) return

        setDeleting(true)
        try {
            await deleteUser(deletingUser.id)
            alert("Đã xóa người dùng thành công! Tất cả dữ liệu liên quan (đơn hàng, đánh giá, v.v.) đã được xóa.")
            setShowDeleteModal(false)
            setDeletingUser(null)
            await loadUsers()
        } catch (err: any) {
            console.error("Delete user error:", err)

            // Lấy thông báo lỗi chi tiết từ error object
            let errorMessage = "Lỗi không xác định"
            let errorDetails = ""

            if (err instanceof Error) {
                errorMessage = err.message

                // Lấy thông tin chi tiết từ error object (đã được set trong request function)
                const errorAny = err as any
                if (errorAny.bodyMessage) {
                    errorMessage = errorAny.bodyMessage
                }
                if (errorAny.bodyDetails) {
                    errorDetails = errorAny.bodyDetails
                }
                if (errorAny.bodyError && !errorMessage.includes(errorAny.bodyError)) {
                    errorMessage += ` (${errorAny.bodyError})`
                }

                // Nếu có response data
                if (errorAny.response && typeof errorAny.response === 'object') {
                    if (errorAny.response.message) {
                        errorMessage = errorAny.response.message
                    }
                    if (errorAny.response.details) {
                        errorDetails = errorAny.response.details
                    }
                }
            }

            const fullMessage = errorDetails
                ? `${errorMessage}\n\nChi tiết: ${errorDetails}`
                : errorMessage

            alert(`Xóa thất bại:\n\n${fullMessage}\n\nVui lòng kiểm tra console để xem chi tiết lỗi.`)
        } finally {
            setDeleting(false)
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role?.toLowerCase()) {
            case "systemadmin":
                return { text: "Quản trị hệ thống", color: "bg-purple-100 text-purple-800" }
            case "enterpriseadmin":
                return { text: "Quản trị doanh nghiệp", color: "bg-blue-100 text-blue-800" }
            case "customer":
                return { text: "Khách hàng", color: "bg-green-100 text-green-800" }
            default:
                return { text: role || "Không xác định", color: "bg-gray-100 text-gray-800" }
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quản lý người dùng</h2>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Không có người dùng nào</div>
            ) : (
                <div className="border rounded-lg shadow-sm overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">ID</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">Tên</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">Email</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">Vai trò</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">Doanh nghiệp</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">Số điện thoại</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-700">Email đã xác thực</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => {
                                const roleInfo = getRoleLabel(user.role)
                                return (
                                    <tr key={user.id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{user.id}</td>
                                        <td className="px-4 py-3 font-medium">{user.name || "-"}</td>
                                        <td className="px-4 py-3 text-gray-600">{user.email || "-"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${roleInfo.color}`}>
                                                {roleInfo.text}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {user.enterprise ? (
                                                <span className="text-sm">{user.enterprise.name}</span>
                                            ) : user.enterpriseId ? (
                                                <span className="text-sm text-gray-400">ID: {user.enterpriseId}</span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{user.phoneNumber || "-"}</td>
                                        <td className="px-4 py-3">
                                            {user.isEmailVerified ? (
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Đã xác thực
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Chưa xác thực
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-all duration-200"
                                                    title="Chỉnh sửa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all duration-200"
                                                    title="Xóa người dùng"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa người dùng</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false)
                                    setEditingUser(null)
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
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Tên</label>
                                <input
                                    type="text"
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email || ""}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Vai trò</label>
                                <select
                                    value={formData.role || ""}
                                    onChange={(e) => {
                                        const newRole = e.target.value
                                        setFormData({
                                            ...formData,
                                            role: newRole,
                                            // Nếu không phải EnterpriseAdmin, xóa enterpriseId
                                            enterpriseId: newRole === "EnterpriseAdmin" ? formData.enterpriseId : undefined
                                        })
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Customer">Khách hàng</option>
                                    <option value="EnterpriseAdmin">Quản trị doanh nghiệp</option>
                                    <option value="SystemAdmin">Quản trị hệ thống</option>
                                </select>
                            </div>

                            {formData.role === "EnterpriseAdmin" && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Doanh nghiệp</label>
                                    <select
                                        value={formData.enterpriseId || ""}
                                        onChange={(e) => setFormData({ ...formData, enterpriseId: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Chọn doanh nghiệp</option>
                                        {enterprises.map((enterprise) => (
                                            <option key={enterprise.id} value={enterprise.id}>
                                                {enterprise.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Số điện thoại</label>
                                <input
                                    type="text"
                                    value={formData.phoneNumber || ""}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Giới tính</label>
                                <select
                                    value={formData.gender || ""}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Ngày sinh</label>
                                <input
                                    type="date"
                                    value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ""}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Địa chỉ giao hàng</label>
                                <input
                                    type="text"
                                    value={formData.shippingAddress || ""}
                                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Avatar URL</label>
                                <input
                                    type="url"
                                    value={formData.avatarUrl || ""}
                                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isEmailVerified || false}
                                        onChange={(e) => setFormData({ ...formData, isEmailVerified: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-900">Email đã xác thực</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowEditModal(false)
                                    setEditingUser(null)
                                    setFormData({})
                                }}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-red-600">Xóa người dùng</h3>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeletingUser(null)
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Người dùng:</p>
                            <p className="font-semibold text-gray-900">{deletingUser.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{deletingUser.email}</p>
                        </div>

                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800 font-medium mb-2">⚠️ Cảnh báo:</p>
                            <p className="text-sm text-red-700 mb-2">
                                Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác.
                            </p>
                            <p className="text-sm text-red-700 font-semibold">
                                Tất cả dữ liệu liên quan sẽ bị xóa tự động:
                            </p>
                            <ul className="text-sm text-red-700 list-disc list-inside mt-2 space-y-1">
                                <li>Đơn hàng và chi tiết đơn hàng</li>
                                <li>Thanh toán</li>
                                <li>Địa chỉ giao hàng</li>
                                <li>Thông báo</li>
                                <li>Đánh giá sản phẩm</li>
                                <li>Đơn đăng ký doanh nghiệp</li>
                                <li>Ảnh đại diện</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeletingUser(null)
                                }}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

