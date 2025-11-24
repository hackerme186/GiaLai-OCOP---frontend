"use client"

import { useState, useRef, useEffect } from "react"
import { uploadImage, uploadImages, checkUploadPermission, type UploadFolder } from "@/lib/upload"
import Image from "next/image"

interface ImageUploaderProps {
  /**
   * Callback khi upload thành công (single image)
   */
  onUploaded?: (imageUrl: string) => void
  /**
   * Callback khi upload nhiều ảnh thành công
   */
  onMultipleUploaded?: (imageUrls: string[]) => void
  /**
   * Cho phép upload nhiều ảnh
   */
  multiple?: boolean
  /**
   * Folder lưu trữ trên Cloudinary
   */
  folder?: UploadFolder
  /**
   * URL ảnh hiện tại (để hiển thị preview)
   */
  currentImageUrl?: string
  /**
   * Disabled state
   */
  disabled?: boolean
  /**
   * Custom className
   */
  className?: string
  /**
   * Placeholder text
   */
  placeholder?: string
  /**
   * Max width/height cho preview
   */
  maxPreviewSize?: number
  /**
   * Hiển thị nút xóa ảnh hiện tại
   */
  showRemoveButton?: boolean
  /**
   * Callback khi xóa ảnh
   */
  onRemove?: () => void
}

export default function ImageUploader({
  onUploaded,
  onMultipleUploaded,
  multiple = false,
  folder = "GiaLaiOCOP/Images",
  currentImageUrl,
  disabled = false,
  className = "",
  placeholder = "Chọn ảnh",
  maxPreviewSize = 200,
  showRemoveButton = false,
  onRemove,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | string[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check permission when component mounts or folder changes
  useEffect(() => {
    const checkPermission = () => {
      const permission = checkUploadPermission(folder || "GiaLaiOCOP/Images")
      if (!permission.allowed) {
        setPermissionError(permission.error || "Bạn không có quyền upload ảnh vào folder này.")
      } else {
        setPermissionError(null)
      }
    }
    checkPermission()
  }, [folder])

  // Set preview from currentImageUrl when it changes
  useEffect(() => {
    if (currentImageUrl && !preview) {
      setPreview(currentImageUrl)
    }
  }, [currentImageUrl])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check permission before proceeding
    const permission = checkUploadPermission(folder || "GiaLaiOCOP/Images")
    if (!permission.allowed) {
      setError(permission.error || "Bạn không có quyền upload ảnh vào folder này.")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setError(null)
    setPermissionError(null)
    setUploading(true)

    try {
      // Create preview URLs
      if (multiple) {
        const previewUrls: string[] = []
        for (let i = 0; i < files.length; i++) {
          previewUrls.push(URL.createObjectURL(files[i]))
        }
        setPreview(previewUrls)
      } else {
        setPreview(URL.createObjectURL(files[0]))
      }

      // Upload files
      const fileArray = Array.from(files)
      if (multiple) {
        const imageUrls = await uploadImages(fileArray, folder)
        onMultipleUploaded?.(imageUrls)
        // Keep preview URLs after upload
      } else {
        const imageUrl = await uploadImage(files[0], folder)
        onUploaded?.(imageUrl)
        // Replace preview with uploaded URL
        setPreview(imageUrl)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload thất bại"
      setError(errorMessage)
      // Clear preview on error
      setPreview(null)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onRemove?.()
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      <div className="space-y-3">
        {/* Preview Section */}
        {preview && (
          <div className="relative">
            {multiple ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(preview as string[]).map((url, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg overflow-hidden border-2 border-gray-200"
                    style={{ maxWidth: maxPreviewSize, maxHeight: maxPreviewSize }}
                  >
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      width={maxPreviewSize}
                      height={maxPreviewSize}
                      className="object-cover w-full h-full"
                      unoptimized={url.startsWith("blob:")}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative inline-block">
                <div
                  className="rounded-lg overflow-hidden border-2 border-gray-200"
                  style={{ maxWidth: maxPreviewSize, maxHeight: maxPreviewSize }}
                >
                  <Image
                    src={preview as string}
                    alt="Preview"
                    width={maxPreviewSize}
                    height={maxPreviewSize}
                    className="object-cover"
                    unoptimized={
                      (preview as string).startsWith("blob:") ||
                      (preview as string).includes("gialai-ocop-be.onrender.com") ||
                      (preview as string).includes("res.cloudinary.com")
                    }
                  />
                </div>
                {showRemoveButton && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={disabled || uploading}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                    title="Xóa ảnh"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Permission Error */}
        {permissionError && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-yellow-700">{permissionError}</p>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading || !!permissionError}
          className={`w-full px-4 py-3 rounded-lg border-2 border-dashed transition-all ${
            disabled || uploading || permissionError
              ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
              : "border-indigo-300 bg-indigo-50 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                <span className="font-medium">Đang upload...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">{placeholder}</span>
              </>
            )}
          </div>
        </button>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Helper Text */}
        <p className="text-xs text-gray-500">
          {multiple ? "Có thể chọn nhiều ảnh cùng lúc" : "Kích thước tối đa: 10MB • Định dạng: JPG, PNG, GIF, WEBP"}
        </p>
      </div>
    </div>
  )
}

