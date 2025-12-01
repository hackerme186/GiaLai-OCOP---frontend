"use client"

import { useEffect, useState } from "react"
import { getUsers, updateUser, deleteUser, getEnterprises, type User, type Enterprise } from "@/lib/api"
import ImageUploader from "@/components/upload/ImageUploader"
import { uploadImage } from "@/lib/upload"
import Image from "next/image"
import { isValidImageUrl, getImageUrl, getImageAttributes } from "@/lib/imageUtils"

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
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

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
            isActive: user.isActive !== undefined ? user.isActive : true,
            provinceId: user.provinceId,
            districtId: user.districtId,
            wardId: user.wardId,
            addressDetail: user.addressDetail || "",
        })
        setAvatarPreview(user.avatarUrl || null)
        setShowEditModal(true)
    }

    const handleAvatarUpload = async (imageUrl: string) => {
        setUploadingAvatar(true)
        try {
            setFormData({ ...formData, avatarUrl: imageUrl })
            setAvatarPreview(imageUrl)
        } catch (err) {
            console.error("Error setting avatar:", err)
            alert("Có lỗi xảy ra khi cập nhật avatar. Vui lòng thử lại.")
        } finally {
            setUploadingAvatar(false)
        }
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
            if (formData.isActive !== undefined) payload.isActive = formData.isActive
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
                return { text: "Quản trị hệ thống", color: "bg-purple-100 text-purple-800 border-purple-300" }
            case "enterpriseadmin":
                return { text: "Quản trị doanh nghiệp", color: "bg-blue-100 text-blue-800 border-blue-300" }
            case "customer":
                return { text: "Khách hàng", color: "bg-green-100 text-green-800 border-green-300" }
            default:
                return { text: role || "Không xác định", color: "bg-gray-100 text-gray-800 border-gray-300" }
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">👥 Quản lý người dùng</h2>
                        <p className="text-white/90 text-lg">Quản lý tất cả người dùng trong hệ thống OCOP Gia Lai</p>
                    </div>
                    {users.length > 0 && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                            <div className="text-2xl font-bold">{users.length}</div>
                            <div className="text-sm opacity-90">Tổng người dùng</div>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                    </div>
                </div>
            ) : users.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
                    <div className="text-center">
                        <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-gray-500 font-medium text-lg mb-2">Không có người dùng nào</p>
                        <p className="text-gray-400 text-sm">Chưa có người dùng nào trong hệ thống</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                                <tr>
                                    <th className="text-left px-6 py-4 font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">ID</th>
                                    <th className="text-left px-6 py-4 font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Tên</th>
                                    <th className="text-left px-6 py-4 font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Email</th>
                                    <th className="text-left px-6 py-4 font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Vai trò</th>
                                    <th className="text-left px-6 py-4 font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Doanh nghiệp</th>
                                    <th className="text-left px-6 py-4 font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Số điện thoại</th>
                                    <th className="text-left px-6 py-4 font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Email đã xác thực</th>
                                    <th className="text-right px-6 py-4 font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => {
                                    const roleInfo = getRoleLabel(user.role)
                                    return (
                                        <tr 
                                            key={user.id} 
                                            className="border-t hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200"
                                            style={{
                                                animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                                            }}
                                        >
                                            <td className="px-6 py-4 font-bold text-gray-900">{user.id}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">{user.name || "-"}</td>
                                            <td className="px-6 py-4 text-gray-600">{user.email || "-"}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${roleInfo.color}`}>
                                                    {roleInfo.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {user.enterprise ? (
                                                    <span className="text-sm font-semibold">{user.enterprise.name}</span>
                                                ) : user.enterpriseId ? (
                                                    <span className="text-sm text-gray-400">ID: {user.enterpriseId}</span>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{user.phoneNumber || "-"}</td>
                                            <td className="px-6 py-4">
                                                {user.isEmailVerified ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border-2 border-green-300">
                                                        ✅ Đã xác thực
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-300">
                                                        ⏳ Chưa xác thực
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-t-2 border-gray-200">
                        <div className="text-sm font-semibold text-gray-700">
                            Tổng cộng: <span className="text-lg font-bold text-purple-600">{users.length}</span> người dùng
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
                        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 flex items-center justify-between shadow-lg -m-8 mb-0 rounded-t-2xl">
                            <h3 className="text-2xl font-bold text-white">✏️ Chỉnh sửa người dùng</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false)
                                    setEditingUser(null)
                                    setFormData({})
                                }}
                                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="pt-8">

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
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Ảnh đại diện (Avatar)</label>
                                
                                {/* Avatar Preview */}
                                {avatarPreview && isValidImageUrl(avatarPreview) && (
                                    <div className="mb-3 flex items-center gap-4">
                                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 bg-gray-200">
                                            <Image
                                                src={getImageUrl(avatarPreview)}
                                                alt="Avatar preview"
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                                {...getImageAttributes(avatarPreview)}
                                                unoptimized={avatarPreview.includes("gialai-ocop-be.onrender.com") || avatarPreview.includes("res.cloudinary.com")}
                                                onError={(e) => {
                                                    // Ẩn ảnh nếu lỗi
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAvatarPreview(null)
                                                setFormData({ ...formData, avatarUrl: "" })
                                            }}
                                            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                            Xóa ảnh
                                        </button>
                                    </div>
                                )}

                                {/* Image Uploader */}
                                <div className="mb-3">
                                    <ImageUploader
                                        folder="GiaLaiOCOP/Users"
                                        onUploaded={handleAvatarUpload}
                                        currentImageUrl={avatarPreview || undefined}
                                        disabled={uploadingAvatar}
                                        placeholder="Chọn ảnh đại diện..."
                                        maxPreviewSize={200}
                                        showRemoveButton={false}
                                    />
                                </div>

                                {/* Manual URL Input (Optional) */}
                                <div className="mt-3">
                                    <label className="block text-xs text-gray-600 mb-1">Hoặc nhập URL ảnh (tùy chọn)</label>
                                    <input
                                        type="url"
                                        value={formData.avatarUrl || ""}
                                        onChange={(e) => {
                                            setFormData({ ...formData, avatarUrl: e.target.value })
                                            setAvatarPreview(e.target.value || null)
                                        }}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
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

                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive !== undefined ? formData.isActive : true}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-900">Tài khoản đang hoạt động</span>
                                </label>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h4 className="text-sm font-bold text-gray-900 mb-3">Địa chỉ chi tiết</h4>
                                
                                <div className="mb-3">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Mã tỉnh/thành phố</label>
                                    <input
                                        type="number"
                                        value={formData.provinceId || ""}
                                        onChange={(e) => setFormData({ ...formData, provinceId: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập mã tỉnh/thành phố"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Mã quận/huyện</label>
                                    <input
                                        type="number"
                                        value={formData.districtId || ""}
                                        onChange={(e) => setFormData({ ...formData, districtId: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập mã quận/huyện"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Mã phường/xã</label>
                                    <input
                                        type="number"
                                        value={formData.wardId || ""}
                                        onChange={(e) => setFormData({ ...formData, wardId: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập mã phường/xã"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Địa chỉ chi tiết</label>
                                    <input
                                        type="text"
                                        value={formData.addressDetail || ""}
                                        onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Số nhà, tên đường, ..."
                                    />
                                </div>
                            </div>
                        </div>

                            <div className="flex gap-3 mt-8 pt-6 border-t-2 border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false)
                                        setEditingUser(null)
                                        setFormData({})
                                        setAvatarPreview(null)
                                    }}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-sm"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    💾 Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-scaleIn">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-red-600">Xóa người dùng</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeletingUser(null)
                                }}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
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
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-sm"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                            >
                                {deleting ? "Đang xóa..." : "🗑️ Xác nhận xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

