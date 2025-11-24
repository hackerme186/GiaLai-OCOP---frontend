/**
 * Image Upload Utility
 * Tích hợp với backend upload API theo hướng dẫn HUONG_DAN_UPLOAD_ANH_FE.md
 * Có phân quyền upload ảnh theo role của user
 */

import { getAuthToken, getUserProfile, getRoleFromToken } from "@/lib/auth"
import { API_BASE_URL } from "./api"

export interface UploadImageResponse {
  success: boolean
  imageUrl: string
  publicId?: string
  width?: number
  height?: number
  format?: string
}

export interface UploadImagesResponse {
  success: boolean
  uploadedFiles: Array<{
    imageUrl: string
    publicId?: string
    width?: number
    height?: number
    format?: string
  }>
}

export type UploadFolder = 
  | "GiaLaiOCOP/Images" 
  | "GiaLaiOCOP/Products" 
  | "GiaLaiOCOP/Users"
  | "GiaLaiOCOP/Enterprises"
  | string // Cho phép custom folder

/**
 * Lấy role hiện tại của user
 */
function getCurrentUserRole(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    // Ưu tiên lấy từ token
    const token = getAuthToken()
    if (token) {
      const roleFromToken = getRoleFromToken(token)
      if (roleFromToken) return roleFromToken
    }
    
    // Fallback: lấy từ user profile
    const profile = getUserProfile()
    return profile?.role || null
  } catch {
    return null
  }
}

/**
 * Kiểm tra quyền upload ảnh vào folder cụ thể dựa trên role
 * @param folder Folder cần upload
 * @returns { allowed: boolean, error?: string }
 */
export function checkUploadPermission(folder: UploadFolder): { allowed: boolean; error?: string } {
  const role = getCurrentUserRole()
  if (!role) {
    return { 
      allowed: false, 
      error: "Không thể xác định quyền truy cập. Vui lòng đăng nhập lại." 
    }
  }

  const normalizedRole = role.toLowerCase().trim()
  const normalizedFolder = folder.toLowerCase()

  // Folder "GiaLaiOCOP/Images" - cho phép tất cả role upload (folder mặc định/chung)
  if (normalizedFolder.includes('gialaiocop/images') && !normalizedFolder.includes('products') && 
      !normalizedFolder.includes('users') && !normalizedFolder.includes('enterprises')) {
    return { allowed: true }
  }

  // SystemAdmin: có quyền upload vào mọi folder
  if (normalizedRole === 'systemadmin' || normalizedRole === 'sysadmin') {
    return { allowed: true }
  }

  // EnterpriseAdmin: có quyền upload vào Products, Users, Enterprises
  if (normalizedRole === 'enterpriseadmin') {
    const allowedFolders = ['products', 'users', 'enterprises']
    const isAllowed = allowedFolders.some(allowed => normalizedFolder.includes(allowed))
    
    if (!isAllowed) {
      return { 
        allowed: false, 
        error: "Bạn không có quyền upload ảnh vào folder này. Chỉ được phép upload vào: Products, Users, Enterprises." 
      }
    }
    return { allowed: true }
  }

  // Customer: chỉ được upload vào Users (avatar)
  if (normalizedRole === 'customer' || normalizedRole === 'user') {
    const isUsersFolder = normalizedFolder.includes('users')
    if (!isUsersFolder) {
      return { 
        allowed: false, 
        error: "Bạn chỉ có quyền upload ảnh đại diện (avatar). Vui lòng liên hệ quản trị viên để được cấp quyền cao hơn." 
      }
    }
    return { allowed: true }
  }

  // Default: không có quyền
  return { 
    allowed: false, 
    error: `Role "${role}" không có quyền upload ảnh.` 
  }
}

/**
 * Validate file size (max 10MB) và format
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

  if (file.size > maxSize) {
    return { valid: false, error: 'Ảnh quá lớn. Kích thước tối đa là 10MB.' }
  }

  if (!allowedFormats.includes(file.type)) {
    return { valid: false, error: 'Định dạng ảnh không hợp lệ. Chỉ chấp nhận: JPG, PNG, GIF, WEBP.' }
  }

  return { valid: true }
}

/**
 * Upload một ảnh đơn lẻ
 * @param file File ảnh cần upload
 * @param folder Thư mục lưu trữ trên Cloudinary (mặc định: GiaLaiOCOP/Images)
 * @returns URL của ảnh đã upload
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder = "GiaLaiOCOP/Images"
): Promise<string> {
  // Check permission first
  const permission = checkUploadPermission(folder)
  if (!permission.allowed) {
    throw new Error(permission.error || "Bạn không có quyền upload ảnh vào folder này.")
  }

  // Validate file
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error || "File không hợp lệ")
  }

  // Get auth token
  const token = getAuthToken()
  if (!token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
  }

  // Create FormData
  const formData = new FormData()
  formData.append("file", file)

  // Build URL with folder query param
  const url = `${API_BASE_URL}/fileupload/image?folder=${encodeURIComponent(folder)}`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // KHÔNG set Content-Type thủ công - browser sẽ tự động set với boundary
      },
      body: formData,
    })

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        const { logout } = await import("@/lib/auth")
        logout()
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
      }

      // Try to get error message from response
      let errorMessage = `Upload thất bại (${response.status})`
      try {
        const errorText = await response.text()
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.message || errorJson.error || errorMessage
          } catch {
            errorMessage = errorText || errorMessage
          }
        }
      } catch {
        // Ignore parsing errors
      }

      throw new Error(errorMessage)
    }

    const data = await response.json() as UploadImageResponse

    if (!data.success || !data.imageUrl) {
      throw new Error("Backend không trả về URL ảnh hợp lệ")
    }

    return data.imageUrl
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Không thể upload ảnh. Vui lòng thử lại.")
  }
}

/**
 * Upload nhiều ảnh cùng lúc
 * @param files Mảng các file ảnh cần upload
 * @param folder Thư mục lưu trữ trên Cloudinary (mặc định: GiaLaiOCOP/Images)
 * @returns Mảng các URL của ảnh đã upload (theo thứ tự)
 */
export async function uploadImages(
  files: File[],
  folder: UploadFolder = "GiaLaiOCOP/Images"
): Promise<string[]> {
  if (files.length === 0) {
    return []
  }

  // Validate số lượng file (Backend giới hạn tối đa 10 files)
  const MAX_FILES = 10
  if (files.length > MAX_FILES) {
    throw new Error(`Chỉ có thể upload tối đa ${MAX_FILES} ảnh cùng lúc. Bạn đã chọn ${files.length} ảnh.`)
  }

  // Check permission first
  const permission = checkUploadPermission(folder)
  if (!permission.allowed) {
    throw new Error(permission.error || "Bạn không có quyền upload ảnh vào folder này.")
  }

  // Validate all files
  for (const file of files) {
    const validation = validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error || `File ${file.name} không hợp lệ`)
    }
  }

  // Get auth token
  const token = getAuthToken()
  if (!token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
  }

  // Create FormData
  const formData = new FormData()
  files.forEach((file) => {
    formData.append("files", file)
  })

  // Build URL with folder query param
  const url = `${API_BASE_URL}/fileupload/images?folder=${encodeURIComponent(folder)}`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // KHÔNG set Content-Type thủ công - browser sẽ tự động set với boundary
      },
      body: formData,
    })

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        const { logout } = await import("@/lib/auth")
        logout()
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
      }

      // Try to get error message from response
      let errorMessage = `Upload thất bại (${response.status})`
      try {
        const errorText = await response.text()
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.message || errorJson.error || errorMessage
          } catch {
            errorMessage = errorText || errorMessage
          }
        }
      } catch {
        // Ignore parsing errors
      }

      throw new Error(errorMessage)
    }

    const data = await response.json() as UploadImagesResponse

    if (!data.success || !data.uploadedFiles || data.uploadedFiles.length === 0) {
      throw new Error("Backend không trả về danh sách ảnh hợp lệ")
    }

    // Extract image URLs
    const imageUrls = data.uploadedFiles.map((file) => file.imageUrl)

    if (imageUrls.length !== files.length) {
      console.warn(
        `⚠️ Số lượng ảnh upload không khớp: gửi ${files.length} file nhưng nhận ${imageUrls.length} URL`
      )
    }

    return imageUrls
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Không thể upload ảnh. Vui lòng thử lại.")
  }
}

