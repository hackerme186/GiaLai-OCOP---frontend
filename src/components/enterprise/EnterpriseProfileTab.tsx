"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { getMyEnterprise, updateMyEnterprise, uploadImage, uploadDocument, type Enterprise, type User } from "@/lib/api"

interface EnterpriseProfileTabProps {
  user: User | null
}

export default function EnterpriseProfileTab({ user }: EnterpriseProfileTabProps) {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    ward: "",
    district: "",
    province: "",
    phoneNumber: "",
    emailContact: "",
    website: "",
    businessField: "",
  })
  
  // File uploads
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  
  useEffect(() => {
    if (user?.enterpriseId) {
      loadEnterprise()
    }
  }, [user?.enterpriseId])

  const loadEnterprise = async () => {
    if (!user?.enterpriseId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await getMyEnterprise()
      setEnterprise(data)
      
      // Populate form
      setFormData({
        name: data.name || "",
        description: data.description || "",
        address: data.address || "",
        ward: data.ward || "",
        district: data.district || "",
        province: data.province || "",
        phoneNumber: data.phoneNumber || "",
        emailContact: data.emailContact || "",
        website: data.website || "",
        businessField: data.businessField || "",
      })
      
      // Set previews
      if (data.imageUrl) {
        setLogoPreview(data.imageUrl)
      }
    } catch (err) {
      console.error("Failed to load enterprise:", err)
      setError("Không thể tải thông tin doanh nghiệp")
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.match(/^image\//)) {
      setError("Vui lòng chọn file ảnh hợp lệ")
      return
    }
    
    const maxSize = 5 * 1024 * 1024 // 5 MB
    if (file.size > maxSize) {
      setError(`Dung lượng file không được vượt quá 5 MB`)
      return
    }
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
      setLogoFile(file)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.match(/^image\//)) {
      setError("Vui lòng chọn file ảnh hợp lệ")
      return
    }
    
    const maxSize = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxSize) {
      setError(`Dung lượng file không được vượt quá 10 MB`)
      return
    }
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setBannerPreview(reader.result as string)
      setBannerFile(file)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type === "application/pdf" || file.type.match(/^image\//)
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10 MB
      return isValidType && isValidSize
    })
    
    if (validFiles.length !== files.length) {
      setError("Một số file không hợp lệ. Chỉ chấp nhận PDF hoặc ảnh, tối đa 10 MB mỗi file.")
    }
    
    setDocumentFiles(prev => [...prev, ...validFiles])
  }

  const removeDocument = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.enterpriseId) return
    
    try {
      setSaving(true)
      setError(null)
      
      // Upload logo if changed
      let logoUrl = enterprise?.imageUrl || ""
      if (logoFile) {
        const uploadResult = await uploadImage(logoFile, "enterprises")
        logoUrl = uploadResult.imageUrl
      }
      
      // Upload documents if any
      const uploadedDocuments: string[] = []
      for (const docFile of documentFiles) {
        try {
          const uploadResult = await uploadDocument(docFile)
          uploadedDocuments.push(uploadResult.documentUrl)
        } catch (err) {
          console.error("Failed to upload document:", err)
        }
      }
      
      // Update enterprise
      await updateMyEnterprise({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        ward: formData.ward,
        district: formData.district,
        province: formData.province,
        phoneNumber: formData.phoneNumber,
        emailContact: formData.emailContact,
        website: formData.website,
        businessField: formData.businessField,
        imageUrl: logoUrl,
      })
      
      setSuccess("Đã cập nhật thông tin doanh nghiệp thành công!")
      setTimeout(() => setSuccess(null), 3000)
      await loadEnterprise()
      
      // Clear file states
      setLogoFile(null)
      setDocumentFiles([])
    } catch (err) {
      console.error("Failed to update enterprise:", err)
      setError(err instanceof Error ? err.message : "Không thể cập nhật thông tin")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải thông tin doanh nghiệp...</p>
      </div>
    )
  }

  if (!enterprise) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-red-600">Không tìm thấy thông tin doanh nghiệp</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border-2 border-green-200 text-green-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-lg p-4 flex items-center justify-between">
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hồ sơ doanh nghiệp</h2>
        <p className="text-sm text-gray-500">Quản lý thông tin và tài liệu của doanh nghiệp</p>
      </div>

      {/* Approval Status */}
      {enterprise && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái phê duyệt</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {(() => {
                const status = enterprise.approvalStatus || "Pending"
                switch (status.toLowerCase()) {
                  case "approved":
                    return (
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
                        Đã duyệt
                      </span>
                    )
                  case "rejected":
                    return (
                      <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold">
                        Đã từ chối
                      </span>
                    )
                  default:
                    return (
                      <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-semibold">
                        Chờ duyệt
                      </span>
                    )
                }
              })()}
            </div>
            {enterprise.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 mb-1">Lý do từ chối:</p>
                <p className="text-sm text-red-700">{enterprise.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Lưu ý:</p>
            <ul className="space-y-1">
              <li>• Thông tin doanh nghiệp sẽ được System Admin xem xét và phê duyệt</li>
              <li>• Sau khi cập nhật, thông tin sẽ chuyển về trạng thái "Chờ duyệt"</li>
              <li>• Chỉ thông tin đã được duyệt mới hiển thị công khai</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Logo doanh nghiệp
          </label>
          {logoPreview && (
            <div className="mb-3">
              <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={logoPreview}
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
          <p className="text-xs text-gray-500 mt-1">JPG, PNG (tối đa 5 MB)</p>
        </div>

        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Banner doanh nghiệp
          </label>
          {bannerPreview && (
            <div className="mb-3">
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={bannerPreview}
                  alt="Banner"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
          <p className="text-xs text-gray-500 mt-1">JPG, PNG (tối đa 10 MB)</p>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tên doanh nghiệp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Ngành nghề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.businessField}
              onChange={(e) => setFormData({ ...formData, businessField: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Mô tả doanh nghiệp
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
            rows={4}
          />
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Phường/Xã
            </label>
            <input
              type="text"
              value={formData.ward}
              onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              required
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.emailContact}
              onChange={(e) => setFormData({ ...formData, emailContact: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Tài liệu xác thực (PDF hoặc ảnh)
          </label>
          <input
            type="file"
            accept=".pdf,image/*"
            multiple
            onChange={handleDocumentUpload}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
          <p className="text-xs text-gray-500 mt-1">PDF hoặc ảnh (tối đa 10 MB mỗi file)</p>
          
          {documentFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {documentFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  )
}

