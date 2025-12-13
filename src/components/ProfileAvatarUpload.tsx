"use client"
import { useState, useEffect, useRef } from "react"
import { uploadAvatar, getAvatar, deleteAvatar, type AvatarResponse } from "@/lib/api"
import Image from "next/image"

interface ProfileAvatarUploadProps {
  onUploadSuccess?: () => void
}

export default function ProfileAvatarUpload({ onUploadSuccess }: ProfileAvatarUploadProps) {
  const [avatar, setAvatar] = useState<AvatarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadAvatar()
  }, [])

  const loadAvatar = async () => {
    try {
      setLoading(true)
      const data = await getAvatar()
      if (data.imageUrl) {
        setAvatar(data)
      }
    } catch (err) {
      console.error("Failed to load avatar:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ chấp nhận file hình ảnh: JPG, JPEG, PNG")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước file không được vượt quá 5MB")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setError(null)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError("Vui lòng chọn file")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const response = await uploadAvatar(file)
      setAvatar(response)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onUploadSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể upload avatar")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa avatar?")) return

    try {
      await deleteAvatar()
      setAvatar(null)
      setPreview(null)
      onUploadSuccess?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xóa avatar")
    }
  }

  const handleCancelPreview = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Đang tải avatar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Ảnh đại diện</h2>

      {/* Current Avatar */}
      <div className="flex items-start space-x-6">
        <div className="relative">
          {avatar?.imageUrl || preview ? (
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
              <Image
                src={preview || avatar?.imageUrl || "/icon.png"}
                alt="Avatar"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
            >
              {avatar ? "Thay đổi avatar" : "Chọn ảnh"}
            </label>
            <p className="mt-2 text-sm text-gray-500">
              Chấp nhận: JPG, JPEG, PNG (tối đa 5MB)
            </p>
          </div>

          {/* Preview Actions */}
          {preview && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? "Đang upload..." : "Xác nhận"}
              </button>
              <button
                onClick={handleCancelPreview}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
            </div>
          )}

          {/* Delete Avatar */}
          {avatar?.imageUrl && !preview && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Xóa avatar
            </button>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

