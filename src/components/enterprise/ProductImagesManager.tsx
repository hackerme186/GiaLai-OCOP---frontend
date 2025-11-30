"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  getProductImages,
  uploadProductImage,
  deleteProductImage,
  type ProductImage,
} from "@/lib/api"

interface ProductImagesManagerProps {
  productId: number
  productName: string
  onClose: () => void
}

export default function ProductImagesManager({
  productId,
  productName,
  onClose,
}: ProductImagesManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadImages()
  }, [productId])

  const loadImages = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getProductImages(productId)
      setImages(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách ảnh")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Kích thước file không được vượt quá 10MB")
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await uploadProductImage(productId, file)
      setSuccess("Upload ảnh thành công!")
      setTimeout(() => setSuccess(null), 3000)
      await loadImages()
      // Reset file input
      e.target.value = ""
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể upload ảnh")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ảnh này?")) {
      return
    }

    try {
      await deleteProductImage(productId, imageId)
      setSuccess("Xóa ảnh thành công!")
      setTimeout(() => setSuccess(null), 3000)
      await loadImages()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa ảnh")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quản lý ảnh sản phẩm</h2>
            <p className="text-sm text-gray-500 mt-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="product-image-upload"
            />
            <label
              htmlFor="product-image-upload"
              className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang upload...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm ảnh mới
                </>
              )}
            </label>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF tối đa 10MB</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          {/* Images Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Đang tải ảnh...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Chưa có ảnh nào. Hãy upload ảnh đầu tiên!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                >
                  <Image
                    src={image.url}
                    alt={image.fileName}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {image.isApproved ? (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        ✓ Đã duyệt
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                        ⏳ Chờ duyệt
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs text-white bg-black bg-opacity-50 rounded px-2 py-1 truncate">
                      {image.fileName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

