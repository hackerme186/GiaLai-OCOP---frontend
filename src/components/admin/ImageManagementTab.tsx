"use client"

import { useState, useEffect } from "react"
import ImageUploader from "@/components/upload/ImageUploader"
import Image from "next/image"
import { uploadImage, checkUploadPermission } from "@/lib/upload"
import { getProducts, getProduct, updateProduct, updateProductImage, Product } from "@/lib/api"
import { getEnterprises, updateEnterprise, Enterprise } from "@/lib/api"
import { getUsers, updateUser, User } from "@/lib/api"
import { isValidImageUrl, getImageUrl, getImageAttributes } from "@/lib/imageUtils"

type ImageFolder = "GiaLaiOCOP/Products" | "GiaLaiOCOP/Enterprises" | "GiaLaiOCOP/Users" | "GiaLaiOCOP/Images"

interface ImageItem {
  url: string
  publicId?: string
  folder: ImageFolder
  uploadedAt?: string
}

export default function ImageManagementTab() {
  const [activeFolder, setActiveFolder] = useState<ImageFolder>("GiaLaiOCOP/Products")
  const [uploadedImages, setUploadedImages] = useState<ImageItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newImageUrl, setNewImageUrl] = useState<string>("")
  const [uploadMode, setUploadMode] = useState<"single" | "multiple">("single")

  // Items for each folder
  const [products, setProducts] = useState<Product[]>([])
  const [enterprises, setEnterprises] = useState<Enterprise[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  
  // Selected item
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Search
  const [searchQuery, setSearchQuery] = useState("")
  
  // Pending image URL (uploaded but not saved to database yet)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)

  const folders: Array<{ id: ImageFolder; label: string; icon: string; description: string }> = [
    {
      id: "GiaLaiOCOP/Products",
      label: "Ảnh Sản phẩm",
      icon: "📦",
      description: "Cập nhật ảnh cho từng sản phẩm",
    },
    {
      id: "GiaLaiOCOP/Enterprises",
      label: "Ảnh Doanh nghiệp",
      icon: "🏢",
      description: "Cập nhật logo cho từng doanh nghiệp",
    },
    {
      id: "GiaLaiOCOP/Users",
      label: "Avatar Người dùng",
      icon: "👤",
      description: "Cập nhật avatar cho từng người dùng",
    },
    {
      id: "GiaLaiOCOP/Images",
      label: "Ảnh Chung",
      icon: "🖼️",
      description: "Quản lý ảnh chung của hệ thống",
    },
  ]

  // Load items based on active folder
  useEffect(() => {
    loadItems()
  }, [activeFolder])

  const loadItems = async () => {
    setLoadingItems(true)
    setError(null)
    try {
      if (activeFolder === "GiaLaiOCOP/Products") {
        const data = await getProducts({ pageSize: 1000, status: "Approved" })
        setProducts(data || [])
      } else if (activeFolder === "GiaLaiOCOP/Enterprises") {
        const data = await getEnterprises({ pageSize: 1000 })
        setEnterprises(data || [])
      } else if (activeFolder === "GiaLaiOCOP/Users") {
        const data = await getUsers()
        setUsers(data || [])
      }
    } catch (err) {
      console.error("Error loading items:", err)
      setError("Không thể tải danh sách. Vui lòng thử lại.")
    } finally {
      setLoadingItems(false)
    }
  }

  // Check permission for each folder
  const canUploadToFolder = (folder: ImageFolder): boolean => {
    const permission = checkUploadPermission(folder)
    return permission.allowed
  }

  useEffect(() => {
    setError(null)
    setSuccess(null)
    setSelectedProduct(null)
    setSelectedEnterprise(null)
    setSelectedUser(null)
    setSearchQuery("")
    setPendingImageUrl(null)
  }, [activeFolder])

  // Filter items by search query
  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id?.toString().includes(searchQuery)
  )

  const filteredEnterprises = enterprises.filter((e) =>
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.id?.toString().includes(searchQuery)
  )

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id?.toString().includes(searchQuery)
  )

  const handleSingleUpload = async (imageUrl: string) => {
    try {
      setUploading(true)
      setError(null)

      // For Products/Enterprises/Users: Save to pending, wait for save button
      if (activeFolder !== "GiaLaiOCOP/Images" && getCurrentItem()) {
        setPendingImageUrl(imageUrl)
        setSuccess("Ảnh đã được upload. Nhấn 'Lưu' để cập nhật vào database.")
      } else {
        // For general images: Add to list immediately
        const newImage: ImageItem = {
          url: imageUrl,
          folder: activeFolder,
          uploadedAt: new Date().toISOString(),
        }
        setUploadedImages((prev) => [newImage, ...prev])
        setNewImageUrl(imageUrl)
        setSuccess(`Đã upload ảnh thành công vào folder: ${activeFolder}`)
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể upload ảnh"
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveImage = async () => {
    if (!pendingImageUrl) return

    try {
      setUploading(true)
      setError(null)

      // Update selected item based on folder
      if (activeFolder === "GiaLaiOCOP/Products" && selectedProduct) {
        // SystemAdmin: Use dedicated image endpoint (simpler, no need full product data)
        // EnterpriseAdmin: Use regular updateProduct endpoint
        const { getRoleFromToken } = await import("@/lib/auth")
        const token = localStorage.getItem("ocop_auth_token")
        const role = token ? getRoleFromToken(token) : ""
        const isSystemAdmin = role?.toLowerCase() === "systemadmin"
        
        if (isSystemAdmin) {
          // Use dedicated image endpoint for SystemAdmin
          await updateProductImage(selectedProduct.id, pendingImageUrl)
        } else {
          // EnterpriseAdmin: Need to send full product data
          const fullProduct = await getProduct(selectedProduct.id)
          await updateProduct(selectedProduct.id, {
            name: fullProduct.name,
            description: fullProduct.description || "",
            price: fullProduct.price,
            imageUrl: pendingImageUrl,
            categoryId: fullProduct.categoryId || undefined,
            stockStatus: fullProduct.stockStatus || undefined,
          })
        }
        
        setSuccess(`Đã cập nhật ảnh cho sản phẩm "${selectedProduct.name}"`)
        await loadItems()
        const updatedProduct = products.find((p) => p.id === selectedProduct.id)
        if (updatedProduct) {
          setSelectedProduct(updatedProduct)
          setPendingImageUrl(null) // Clear pending after save
        }
      } else if (activeFolder === "GiaLaiOCOP/Enterprises" && selectedEnterprise) {
        // Get full enterprise data first, then update with imageUrl
        const { getEnterprise } = await import("@/lib/api")
        const fullEnterprise = await getEnterprise(selectedEnterprise.id)
        
        // Chỉ gửi các trường có giá trị hợp lệ (không gửi empty string)
        const updatePayload: any = {
          imageUrl: pendingImageUrl,
        }
        
        // Chỉ thêm các trường nếu có giá trị
        if (fullEnterprise.name) updatePayload.name = fullEnterprise.name
        if (fullEnterprise.description !== undefined) updatePayload.description = fullEnterprise.description || null
        if (fullEnterprise.address) updatePayload.address = fullEnterprise.address
        if (fullEnterprise.ward) updatePayload.ward = fullEnterprise.ward
        if (fullEnterprise.district) updatePayload.district = fullEnterprise.district
        if (fullEnterprise.province) updatePayload.province = fullEnterprise.province
        if (fullEnterprise.latitude !== undefined) updatePayload.latitude = fullEnterprise.latitude
        if (fullEnterprise.longitude !== undefined) updatePayload.longitude = fullEnterprise.longitude
        if (fullEnterprise.phoneNumber) updatePayload.phoneNumber = fullEnterprise.phoneNumber
        // EmailContact: chỉ gửi nếu có giá trị hợp lệ (không phải empty string)
        if (fullEnterprise.emailContact && fullEnterprise.emailContact.trim() !== '') {
          updatePayload.emailContact = fullEnterprise.emailContact.trim()
        } else {
          updatePayload.emailContact = null
        }
        if (fullEnterprise.website) updatePayload.website = fullEnterprise.website
        if (fullEnterprise.businessField) updatePayload.businessField = fullEnterprise.businessField
        if (fullEnterprise.ocopRating !== undefined) updatePayload.ocopRating = fullEnterprise.ocopRating
        if (fullEnterprise.approvalStatus) updatePayload.approvalStatus = fullEnterprise.approvalStatus
        if (fullEnterprise.rejectionReason !== undefined) updatePayload.rejectionReason = fullEnterprise.rejectionReason || null
        
        await updateEnterprise(selectedEnterprise.id, updatePayload)
        setSuccess(`Đã cập nhật logo cho doanh nghiệp "${selectedEnterprise.name}"`)
        await loadItems()
        const updatedEnterprise = enterprises.find((e) => e.id === selectedEnterprise.id)
        if (updatedEnterprise) {
          setSelectedEnterprise(updatedEnterprise)
          setPendingImageUrl(null) // Clear pending after save
        }
      } else if (activeFolder === "GiaLaiOCOP/Users" && selectedUser) {
        // Get full user data first, then update with avatarUrl
        const { getUser } = await import("@/lib/api")
        const fullUser = await getUser(selectedUser.id)
        
        // Chỉ gửi các trường có giá trị hợp lệ
        const updatePayload: any = {
          avatarUrl: pendingImageUrl,
        }
        
        // Chỉ thêm các trường nếu có giá trị
        if (fullUser.name) updatePayload.name = fullUser.name
        if (fullUser.email) updatePayload.email = fullUser.email
        if (fullUser.role) updatePayload.role = fullUser.role
        if (fullUser.enterpriseId !== undefined) updatePayload.enterpriseId = fullUser.enterpriseId
        if (fullUser.phoneNumber !== undefined) updatePayload.phoneNumber = fullUser.phoneNumber || null
        if (fullUser.gender !== undefined) updatePayload.gender = fullUser.gender || null
        if (fullUser.dateOfBirth !== undefined) updatePayload.dateOfBirth = fullUser.dateOfBirth || null
        if (fullUser.shippingAddress !== undefined) updatePayload.shippingAddress = fullUser.shippingAddress || null
        if (fullUser.isEmailVerified !== undefined) updatePayload.isEmailVerified = fullUser.isEmailVerified
        if (fullUser.isActive !== undefined) updatePayload.isActive = fullUser.isActive
        if (fullUser.provinceId !== undefined) updatePayload.provinceId = fullUser.provinceId
        if (fullUser.districtId !== undefined) updatePayload.districtId = fullUser.districtId
        if (fullUser.wardId !== undefined) updatePayload.wardId = fullUser.wardId
        if (fullUser.addressDetail !== undefined) updatePayload.addressDetail = fullUser.addressDetail || null
        
        await updateUser(selectedUser.id, updatePayload)
        setSuccess(`Đã cập nhật avatar cho người dùng "${selectedUser.name || selectedUser.email}"`)
        await loadItems()
        const updatedUser = users.find((u) => u.id === selectedUser.id)
        if (updatedUser) {
          setSelectedUser(updatedUser)
          setPendingImageUrl(null) // Clear pending after save
        }
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      let errorMessage = "Không thể cập nhật ảnh"
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Handle 403 Forbidden - Permission denied
        if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
          errorMessage = `⚠️ Lỗi quyền truy cập (403 Forbidden)\n\n` +
            `Backend hiện tại chỉ cho phép EnterpriseAdmin cập nhật sản phẩm của họ.\n\n` +
            `💡 Giải pháp:\n` +
            `1. Backend cần cấu hình để cho phép SystemAdmin update products\n` +
            `2. Hoặc tạo endpoint riêng cho SystemAdmin để update ảnh\n\n` +
            `📝 Lưu ý: Ảnh đã được upload thành công, nhưng chưa lưu vào database.`
        }
        
        // Handle 401 Unauthorized
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          errorMessage = "⚠️ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
        }
      }
      
      setError(errorMessage)
      console.error("Error updating image:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleCancelUpdate = () => {
    setPendingImageUrl(null)
    setError(null)
    setSuccess("Đã hủy cập nhật ảnh")
    setTimeout(() => setSuccess(null), 2000)
  }

  const handleMultipleUpload = async (imageUrls: string[]) => {
    try {
      setUploading(true)
      setError(null)

      const newImages: ImageItem[] = imageUrls.map((url) => ({
        url,
        folder: activeFolder,
        uploadedAt: new Date().toISOString(),
      }))

      setUploadedImages((prev) => [...newImages, ...prev])
      setSuccess(`Đã upload ${imageUrls.length} ảnh thành công vào folder: ${activeFolder}`)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể upload ảnh"
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (imageUrl: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa ảnh này?")) {
      setUploadedImages((prev) => prev.filter((img) => img.url !== imageUrl))
      setSuccess("Đã xóa ảnh khỏi danh sách")
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setSuccess("Đã copy URL ảnh vào clipboard!")
    setTimeout(() => setSuccess(null), 2000)
  }

  // Get current selected item
  const getCurrentItem = () => {
    if (activeFolder === "GiaLaiOCOP/Products") return selectedProduct
    if (activeFolder === "GiaLaiOCOP/Enterprises") return selectedEnterprise
    if (activeFolder === "GiaLaiOCOP/Users") return selectedUser
    return null
  }

  const getCurrentImageUrl = () => {
    // Show pending image if exists (new upload), otherwise show current image
    if (pendingImageUrl) return pendingImageUrl
    
    const item = getCurrentItem()
    if (!item) return undefined
    if (activeFolder === "GiaLaiOCOP/Products") return (item as Product).imageUrl
    if (activeFolder === "GiaLaiOCOP/Enterprises") return (item as Enterprise).imageUrl
    if (activeFolder === "GiaLaiOCOP/Users") return (item as User).avatarUrl
    return undefined
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Quản lý Ảnh</h2>
          <p className="text-sm text-gray-500 mt-1">Cập nhật ảnh cho từng sản phẩm, doanh nghiệp, và người dùng</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Folder Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {folders.map((folder) => {
            const hasPermission = canUploadToFolder(folder.id)
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                disabled={!hasPermission}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeFolder === folder.id
                    ? "bg-indigo-600 text-white"
                    : hasPermission
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-400 cursor-not-allowed"
                }`}
                title={hasPermission ? folder.description : "Bạn không có quyền upload vào folder này"}
              >
                <span className="mr-2">{folder.icon}</span>
                {folder.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Items List for Products/Enterprises/Users */}
      {activeFolder !== "GiaLaiOCOP/Images" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Chọn {activeFolder === "GiaLaiOCOP/Products" ? "sản phẩm" : activeFolder === "GiaLaiOCOP/Enterprises" ? "doanh nghiệp" : "người dùng"} để cập nhật ảnh
          </h3>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Tìm kiếm ${activeFolder === "GiaLaiOCOP/Products" ? "sản phẩm" : activeFolder === "GiaLaiOCOP/Enterprises" ? "doanh nghiệp" : "người dùng"}...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Items Grid */}
          {loadingItems ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Đang tải...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {activeFolder === "GiaLaiOCOP/Products" &&
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product)
                      setPendingImageUrl(null)
                    }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedProduct?.id === product.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {product.imageUrl && (
                        <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            {...getImageAttributes(product.imageUrl)}
                            unoptimized={product.imageUrl.includes("gialai-ocop-be.onrender.com") || product.imageUrl.includes("res.cloudinary.com")}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-gray-500">ID: {product.id}</p>
                        {product.price && (
                          <p className="text-sm text-gray-600">{product.price.toLocaleString("vi-VN")} VNĐ</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {activeFolder === "GiaLaiOCOP/Enterprises" &&
                filteredEnterprises.map((enterprise) => (
                  <div
                    key={enterprise.id}
                    onClick={() => {
                      setSelectedEnterprise(enterprise)
                      setPendingImageUrl(null)
                    }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedEnterprise?.id === enterprise.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {enterprise.imageUrl && (
                        <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={enterprise.imageUrl}
                            alt={enterprise.name}
                            fill
                            className="object-cover"
                            {...getImageAttributes(enterprise.imageUrl)}
                            unoptimized={enterprise.imageUrl.includes("gialai-ocop-be.onrender.com") || enterprise.imageUrl.includes("res.cloudinary.com")}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{enterprise.name}</p>
                        <p className="text-sm text-gray-500">ID: {enterprise.id}</p>
                        <p className="text-sm text-gray-600 truncate">{enterprise.address}</p>
                      </div>
                    </div>
                  </div>
                ))}

              {activeFolder === "GiaLaiOCOP/Users" &&
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user)
                      setPendingImageUrl(null)
                    }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedUser?.id === user.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isValidImageUrl(user.avatarUrl) && (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                          <Image
                            src={getImageUrl(user.avatarUrl)}
                            alt={user.name || user.email}
                            fill
                            className="object-cover"
                            {...getImageAttributes(user.avatarUrl)}
                            unoptimized={user.avatarUrl?.includes("gialai-ocop-be.onrender.com") || user.avatarUrl?.includes("res.cloudinary.com")}
                            onError={(e) => {
                              // Ẩn ảnh nếu lỗi
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      {!isValidImageUrl(user.avatarUrl) && (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.name || user.email}</p>
                        <p className="text-sm text-gray-500">ID: {user.id}</p>
                        {user.email && (
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingItems &&
            ((activeFolder === "GiaLaiOCOP/Products" && filteredProducts.length === 0) ||
              (activeFolder === "GiaLaiOCOP/Enterprises" && filteredEnterprises.length === 0) ||
              (activeFolder === "GiaLaiOCOP/Users" && filteredUsers.length === 0)) && (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy {activeFolder === "GiaLaiOCOP/Products" ? "sản phẩm" : activeFolder === "GiaLaiOCOP/Enterprises" ? "doanh nghiệp" : "người dùng"}
              </div>
            )}
        </div>
      )}

      {/* Upload Section */}
      {getCurrentItem() && activeFolder !== "GiaLaiOCOP/Images" && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Cập nhật ảnh cho:{" "}
            <span className="text-indigo-600">
              {activeFolder === "GiaLaiOCOP/Products"
                ? (selectedProduct as Product)?.name
                : activeFolder === "GiaLaiOCOP/Enterprises"
                ? (selectedEnterprise as Enterprise)?.name
                : (selectedUser as User)?.name || (selectedUser as User)?.email}
            </span>
          </h3>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <ImageUploader
              folder={activeFolder}
              onUploaded={handleSingleUpload}
              currentImageUrl={(() => {
                // Ưu tiên pendingImageUrl nếu có
                if (pendingImageUrl && isValidImageUrl(pendingImageUrl)) {
                  return pendingImageUrl
                }
                // Nếu không có pending, lấy từ item hiện tại
                const item = getCurrentItem()
                if (!item) return undefined
                let imageUrl: string | undefined
                if (activeFolder === "GiaLaiOCOP/Products") {
                  imageUrl = (item as Product).imageUrl
                } else if (activeFolder === "GiaLaiOCOP/Enterprises") {
                  imageUrl = (item as Enterprise).imageUrl
                } else if (activeFolder === "GiaLaiOCOP/Users") {
                  imageUrl = (item as User).avatarUrl
                }
                // Chỉ trả về URL hợp lệ
                return isValidImageUrl(imageUrl) ? imageUrl : undefined
              })()}
              placeholder="Chọn ảnh để cập nhật"
              maxPreviewSize={300}
              showRemoveButton={false}
              disabled={uploading}
            />
            
            {/* Save/Cancel Buttons */}
            {pendingImageUrl && (
              <div className="mt-4 flex gap-3 justify-end">
                <button
                  onClick={handleCancelUpdate}
                  disabled={uploading}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveImage}
                  disabled={uploading || !pendingImageUrl}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploading ? "Đang lưu..." : "💾 Lưu ảnh"}
                </button>
              </div>
            )}
            
            {/* Current image info if no pending */}
            {!pendingImageUrl && getCurrentImageUrl() && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ảnh hiện tại:</span> Đã được lưu trong database
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Section for General Images */}
      {activeFolder === "GiaLaiOCOP/Images" && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload ảnh vào: <span className="text-indigo-600">{activeFolder}</span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">{folders.find((f) => f.id === activeFolder)?.description}</p>

            {/* Upload Mode Toggle */}
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={uploadMode === "single"}
                  onChange={() => setUploadMode("single")}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm font-medium text-gray-700">Upload đơn</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={uploadMode === "multiple"}
                  onChange={() => setUploadMode("multiple")}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm font-medium text-gray-700">Upload nhiều ảnh</span>
              </label>
            </div>
          </div>

          {/* Upload Component */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            {uploadMode === "single" ? (
              <ImageUploader
                folder={activeFolder}
                onUploaded={handleSingleUpload}
                placeholder="Chọn ảnh để upload"
                maxPreviewSize={300}
                showRemoveButton={false}
                disabled={uploading}
              />
            ) : (
              <ImageUploader
                folder={activeFolder}
                multiple={true}
                onMultipleUploaded={handleMultipleUpload}
                placeholder="Chọn nhiều ảnh để upload"
                maxPreviewSize={200}
                showRemoveButton={false}
                disabled={uploading}
              />
            )}
          </div>

          {/* Manual URL Input */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hoặc nhập URL ảnh trực tiếp:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={() => {
                  if (newImageUrl.trim()) {
                    handleSingleUpload(newImageUrl.trim())
                    setNewImageUrl("")
                  }
                }}
                disabled={!newImageUrl.trim() || uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Images List (Only for General Images) */}
      {activeFolder === "GiaLaiOCOP/Images" && uploadedImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ảnh đã upload ({uploadedImages.filter((img) => img.folder === activeFolder).length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages
              .filter((img) => img.folder === activeFolder)
              .map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={image.url}
                      alt={`Uploaded image ${index + 1}`}
                      fill
                      className="object-cover"
                      {...getImageAttributes(image.url)}
                      unoptimized={
                        image.url.includes("gialai-ocop-be.onrender.com") ||
                        image.url.includes("res.cloudinary.com") ||
                        image.url.startsWith("blob:")
                      }
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <button
                        onClick={() => copyImageUrl(image.url)}
                        className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                        title="Copy URL"
                      >
                        📋 Copy URL
                      </button>
                      <button
                        onClick={() => handleRemoveImage(image.url)}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        title="Xóa"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate" title={image.url}>
                      {image.url.substring(0, 40)}...
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty State for General Images */}
      {activeFolder === "GiaLaiOCOP/Images" && uploadedImages.filter((img) => img.folder === activeFolder).length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">🖼️</div>
          <p className="text-gray-600">Chưa có ảnh nào trong folder này</p>
          <p className="text-sm text-gray-500 mt-2">Upload ảnh để bắt đầu quản lý</p>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Thông tin</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>SystemAdmin có quyền upload vào tất cả các folder</li>
          <li>Kích thước tối đa: 10MB mỗi ảnh</li>
          <li>Định dạng hỗ trợ: JPG, PNG, GIF, WEBP</li>
          <li>Ảnh được lưu trên Cloudinary và tự động cập nhật vào database</li>
          {activeFolder !== "GiaLaiOCOP/Images" && (
            <li>Chọn một {activeFolder === "GiaLaiOCOP/Products" ? "sản phẩm" : activeFolder === "GiaLaiOCOP/Enterprises" ? "doanh nghiệp" : "người dùng"} ở trên để cập nhật ảnh</li>
          )}
        </ul>
      </div>
    </div>
  )
}
