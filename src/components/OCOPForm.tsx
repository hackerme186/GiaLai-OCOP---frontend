"use client"

import { useState, useEffect } from "react"
import { CreateEnterpriseApplicationDto, getCategories, type Category } from "@/lib/api"
import ImageUploader from "@/components/upload/ImageUploader"

interface OCOPFormProps {
  onSubmit: (data: CreateEnterpriseApplicationDto) => void
}

export default function OCOPForm({ onSubmit }: OCOPFormProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 3
  
  // Add confirmation state for final step
  const [isConfirmed, setIsConfirmed] = useState(false)

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [certificateNumber, setCertificateNumber] = useState("")
  const [logoUrl, setLogoUrl] = useState<string>("")
  // Extended DTO fields
  const [businessType, setBusinessType] = useState("")
  const [taxCode, setTaxCode] = useState("")
  const [businessLicenseNumber, setBusinessLicenseNumber] = useState("")
  const [licenseIssuedDate, setLicenseIssuedDate] = useState("")
  const [licenseIssuedBy, setLicenseIssuedBy] = useState("")
  const [ward, setWard] = useState("")
  const [district, setDistrict] = useState("")
  const [province, setProvince] = useState("")
  const [representativeName, setRepresentativeName] = useState("")
  const [representativePosition, setRepresentativePosition] = useState("")
  const [representativeIdNumber, setRepresentativeIdNumber] = useState("")
  const [representativeIdIssuedDate, setRepresentativeIdIssuedDate] = useState("")
  const [representativeIdIssuedBy, setRepresentativeIdIssuedBy] = useState("")
  const [productionLocation, setProductionLocation] = useState("")
  const [numberOfEmployees, setNumberOfEmployees] = useState<string>("")
  const [productionScale, setProductionScale] = useState("")
  const [businessField, setBusinessField] = useState("")
  const [productCategory, setProductCategory] = useState("")
  const [productOrigin, setProductOrigin] = useState("")
  const [productCertifications, setProductCertifications] = useState<string[]>([])
  const [attachedDocuments, setAttachedDocuments] = useState<File[]>([])
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Product fields for Step 2
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImageUrls, setProductImageUrls] = useState<string[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<File[]>([]);

  // Load categories on component mount
  useEffect(() => {
    loadCategories()
  }, [])
  
  // Reset confirmation when step changes
  useEffect(() => {
    if (step !== totalSteps) {
      setIsConfirmed(false)
    }
  }, [step])

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      // Only load active categories
      const categoriesData = await getCategories(true)
      // Filter to ensure only active categories
      const activeCategories = categoriesData.filter(cat => cat.isActive !== false)
      setCategories(activeCategories)
    } catch (err) {
      // If 403 Forbidden (Customer may not have access), silently fail and use text input
      if (err instanceof Error && (err.message.includes("403") || err.message.includes("Forbidden"))) {
        console.warn("Customer không có quyền truy cập categories API. Sử dụng input text.")
      } else {
        console.error("Failed to load categories:", err)
      }
      // If error, set empty array - user can still type manually if needed
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {}
    if (!name.trim()) nextErrors.name = "Vui lòng nhập tên doanh nghiệp"
    // Removed description validation - field doesn't exist in form
    if (!address.trim()) nextErrors.address = "Vui lòng nhập địa chỉ"
    if (!phone.trim()) nextErrors.phone = "Vui lòng nhập số điện thoại"

    // Email validation with proper format check
    if (!email.trim()) {
      nextErrors.email = "Vui lòng nhập email"
    } else {
      // Strict email regex validation to match backend requirements
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        nextErrors.email = "Email không đúng định dạng (ví dụ: example@company.com)"
      }
    }

    // Required fields for backend validation
    if (!businessField.trim()) nextErrors.businessField = "Ngành nghề kinh doanh là bắt buộc"
    if (!representativeName.trim()) nextErrors.representativeName = "Tên người đại diện là bắt buộc"
    if (!representativeIdNumber.trim()) nextErrors.representativeIdNumber = "Số CCCD/CMND của người đại diện là bắt buộc"
    if (!province.trim()) nextErrors.province = "Tỉnh/Thành phố là bắt buộc"
    if (!district.trim()) nextErrors.district = "Quận/Huyện là bắt buộc"
    if (!businessLicenseNumber.trim()) nextErrors.businessLicenseNumber = "Số giấy phép kinh doanh là bắt buộc"

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {}
    // Required fields for backend validation
    if (!productName.trim()) nextErrors.productName = "Tên sản phẩm OCOP là bắt buộc"
    if (!productCategory.trim()) nextErrors.productCategory = "Nhóm sản phẩm là bắt buộc"
    if (!productDescription.trim()) nextErrors.productDescription = "Mô tả sản phẩm là bắt buộc"

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check confirmation checkbox
    if (!isConfirmed) {
      alert('Vui lòng xác nhận thông tin trước khi gửi đăng ký.')
      return
    }
    
    // Add final confirmation dialog
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn gửi đăng ký OCOP?\n\n" +
      "Sau khi gửi, bạn sẽ không thể chỉnh sửa thông tin."
    )
    
    if (!confirmed) {
      return
    }

    // --- PRE-SUBMIT VALIDATION ---
    const trimmedEmail = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    console.log('🔍 DEBUG - Email value before submit:', {
      raw: email,
      trimmed: trimmedEmail,
      isValid: emailRegex.test(trimmedEmail),
      length: trimmedEmail.length
    })

    if (!emailRegex.test(trimmedEmail)) {
      console.error('❌ Email không hợp lệ trước khi submit:', trimmedEmail)
      alert(`⚠️ Email không hợp lệ: "${trimmedEmail}"\n\nVui lòng nhập email đúng định dạng (ví dụ: contact@company.com)`)
      return
    }

    // --- HELPER: Convert date to UTC ISO string or undefined ---
    const toUTCDate = (dateStr: string): string | undefined => {
      if (!dateStr || dateStr.trim() === '') return undefined
      try {
        // Parse date and convert to UTC ISO string for PostgreSQL compatibility
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return undefined
        return date.toISOString()
      } catch {
        return undefined
      }
    }

    // --- FINAL VALIDATION BEFORE SUBMIT ---
    const finalErrors: Record<string, string> = {}
    if (!businessField.trim()) finalErrors.businessField = "Ngành nghề kinh doanh là bắt buộc"
    if (!productName.trim()) finalErrors.productName = "Tên sản phẩm OCOP là bắt buộc"
    if (!productCategory.trim()) finalErrors.productCategory = "Nhóm sản phẩm là bắt buộc"
    if (!productDescription.trim()) finalErrors.productDescription = "Mô tả sản phẩm là bắt buộc"
    if (!representativeName.trim()) finalErrors.representativeName = "Tên người đại diện là bắt buộc"
    if (!representativeIdNumber.trim()) finalErrors.representativeIdNumber = "Số CCCD/CMND của người đại diện là bắt buộc"
    if (!province.trim()) finalErrors.province = "Tỉnh/Thành phố là bắt buộc"
    if (!district.trim()) finalErrors.district = "Quận/Huyện là bắt buộc"
    if (!businessLicenseNumber.trim()) finalErrors.businessLicenseNumber = "Số giấy phép kinh doanh là bắt buộc"

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors)
      alert("Vui lòng điền đầy đủ các trường bắt buộc trước khi gửi đăng ký.")
      return
    }

    // --- SUBMIT: ĐƯA ĐẦY ĐỦ DỮ LIỆU VÀO PAYLOAD ---
    // Convert dates to UTC first
    const licenseIssuedDateUTC = toUTCDate(licenseIssuedDate)
    const representativeIdIssuedDateUTC = toUTCDate(representativeIdIssuedDate)

    // Build payload with proper handling of optional date fields
    const payload: CreateEnterpriseApplicationDto = {
      enterpriseName: name.trim(),
      businessType: businessType,
      taxCode: taxCode,
      businessLicenseNumber: businessLicenseNumber,
      // Only include licenseIssuedDate if conversion succeeded (returns non-undefined UTC string)
      ...(licenseIssuedDateUTC && { licenseIssuedDate: licenseIssuedDateUTC }),
      licenseIssuedBy: licenseIssuedBy,
      address: address.trim(),
      ward: ward,
      district: district,
      province: province,
      phoneNumber: phone.trim(),
      emailContact: trimmedEmail, // Already validated above
      website: website,
      representativeName: representativeName,
      representativePosition: representativePosition,
      representativeIdNumber: representativeIdNumber,
      // Only include representativeIdIssuedDate if conversion succeeded
      ...(representativeIdIssuedDateUTC && { representativeIdIssuedDate: representativeIdIssuedDateUTC }),
      representativeIdIssuedBy: representativeIdIssuedBy,
      productionLocation: productionLocation,
      numberOfEmployees: numberOfEmployees,
      productionScale: productionScale,
      businessField: businessField,
      productName: productName,
      productCategory: productCategory,
      productDescription: productDescription,
      productOrigin: productOrigin,
      productCertifications: productCertifications.join(','),
      productImages: productImageUrls.join(','), // URLs đã được upload
      attachedDocuments: attachedDocs.map(f => f.name).join(','), // TODO: Upload documents later
      additionalNotes: additionalNotes
    }

    console.log('📤 Gửi dữ liệu đăng ký OCOP:', payload)
    console.log('📧 Email sẽ gửi đi:', payload.emailContact)
    console.log('📅 Date fields (UTC):', {
      licenseIssuedDate: payload.licenseIssuedDate,
      representativeIdIssuedDate: payload.representativeIdIssuedDate
    })
    onSubmit(payload)
  }

  return (
    <form 
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        // Prevent Enter key from accidentally submitting the form
        if (e.key === 'Enter') {
          e.preventDefault()
          
          if (step < totalSteps) {
            console.log('⚠️ Use "Tiếp theo" button to advance to next step')
          } else {
            console.log('⚠️ Please click "GỬI ĐĂNG KÝ" button to submit')
          }
        }
      }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${s <= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {s}
              </div>
              {s < totalSteps && (
                <div className={`w-12 h-1 mx-2 ${s < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Bước {step} / {totalSteps}</p>
        </div>
      </div>

      <div className="mb-8">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">1. Thông tin doanh nghiệp</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* tên DN, loại hình KD, mã số thuế,... */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Tên doanh nghiệp *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập tên doanh nghiệp" />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Loại hình doanh nghiệp</label>
                <input type="text" value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập loại hình doanh nghiệp" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Mã số thuế</label>
                <input type="text" value={taxCode} onChange={e => setTaxCode(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập mã số thuế" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Số giấy phép kinh doanh *</label>
                <input type="text" required value={businessLicenseNumber} onChange={e => setBusinessLicenseNumber(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập số giấy phép kinh doanh" />
                {errors.businessLicenseNumber && <p className="text-sm text-red-600 mt-1">{errors.businessLicenseNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Ngày cấp giấy phép</label>
                <input type="date" value={licenseIssuedDate} onChange={e => setLicenseIssuedDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nơi cấp giấy phép</label>
                <input type="text" value={licenseIssuedBy} onChange={e => setLicenseIssuedBy(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập nơi cấp giấy phép" />
              </div>
              {/* địa chỉ */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Tỉnh/Thành phố *</label>
                <input type="text" required value={province} onChange={e => setProvince(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập tỉnh/thành phố" />
                {errors.province && <p className="text-sm text-red-600 mt-1">{errors.province}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Quận/Huyện *</label>
                <input type="text" required value={district} onChange={e => setDistrict(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập quận/huyện" />
                {errors.district && <p className="text-sm text-red-600 mt-1">{errors.district}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Phường/Xã</label>
                <input type="text" value={ward} onChange={e => setWard(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập phường/xã" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Địa chỉ *</label>
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập địa chỉ trụ sở / sản xuất" />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Số điện thoại *</label>
                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Số điện thoại liên hệ" />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email liên hệ *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Email doanh nghiệp" />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Website</label>
                <input type="text" value={website} onChange={e => setWebsite(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Trang web (nếu có)" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Logo doanh nghiệp</label>
                <ImageUploader
                  folder="GiaLaiOCOP/Enterprises"
                  currentImageUrl={logoUrl || undefined}
                  onUploaded={(imageUrl) => {
                    setLogoUrl(imageUrl)
                  }}
                  onRemove={() => {
                    setLogoUrl("")
                  }}
                  showRemoveButton={!!logoUrl}
                  placeholder="Chọn logo doanh nghiệp"
                  maxPreviewSize={200}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Quy mô sản xuất</label>
                <input type="text" value={productionScale} onChange={e => setProductionScale(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập quy mô sản xuất" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Địa điểm sản xuất</label>
                <input type="text" value={productionLocation} onChange={e => setProductionLocation(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Địa điểm sản xuất" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Số lao động</label>
                <input type="text" value={numberOfEmployees} onChange={e => setNumberOfEmployees(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="VD: 15 hoặc 10-20 người" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Lĩnh vực kinh doanh *</label>
                <input type="text" required value={businessField} onChange={e => setBusinessField(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập lĩnh vực kinh doanh" />
                {errors.businessField && <p className="text-sm text-red-600 mt-1">{errors.businessField}</p>}
              </div>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mt-6">2. Thông tin đại diện pháp luật</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Họ tên đại diện *</label>
                <input type="text" required value={representativeName} onChange={e => setRepresentativeName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập họ tên đại diện" />
                {errors.representativeName && <p className="text-sm text-red-600 mt-1">{errors.representativeName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Chức vụ đại diện</label>
                <input type="text" value={representativePosition} onChange={e => setRepresentativePosition(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập chức vụ đại diện" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">CMND/CCCD *</label>
                <input type="text" required value={representativeIdNumber} onChange={e => setRepresentativeIdNumber(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập CMND/CCCD" />
                {errors.representativeIdNumber && <p className="text-sm text-red-600 mt-1">{errors.representativeIdNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Ngày cấp</label>
                <input type="date" value={representativeIdIssuedDate} onChange={e => setRepresentativeIdIssuedDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nơi cấp</label>
                <input type="text" value={representativeIdIssuedBy} onChange={e => setRepresentativeIdIssuedBy(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập nơi cấp" />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">Ghi chú bổ sung</label>
              <textarea rows={2} value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Ghi chú bổ sung (nếu có)" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">3. Thông tin sản phẩm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Tên sản phẩm OCOP *</label>
                <input type="text" required value={productName} onChange={e => setProductName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập tên sản phẩm" />
                {errors.productName && <p className="text-sm text-red-600 mt-1">{errors.productName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nhóm sản phẩm *</label>
                {loadingCategories ? (
                  <div className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500">
                    Đang tải danh mục...
                  </div>
                ) : categories.length > 0 ? (
                  <select
                    required
                    value={productCategory}
                    onChange={e => setProductCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  >
                    <option value="">Chọn nhóm sản phẩm</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={productCategory}
                    onChange={e => setProductCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    placeholder="Nhập nhóm sản phẩm"
                  />
                )}
                {errors.productCategory && <p className="text-sm text-red-600 mt-1">{errors.productCategory}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Mô tả sản phẩm *</label>
                <textarea rows={3} required value={productDescription} onChange={e => setProductDescription(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Mô tả sản phẩm" />
                {errors.productDescription && <p className="text-sm text-red-600 mt-1">{errors.productDescription}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Xuất xứ sản phẩm</label>
                <input type="text" value={productOrigin} onChange={e => setProductOrigin(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập xuất xứ sản phẩm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Chứng nhận sản phẩm</label>
                <input type="text" value={productCertifications} onChange={e => setProductCertifications(e.target.value.split(','))} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Mỗi chứng nhận ngăn cách bởi dấu phẩy" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Hình ảnh sản phẩm</label>
                <ImageUploader
                  folder="GiaLaiOCOP/Enterprises"
                  multiple={true}
                  onMultipleUploaded={(imageUrls) => {
                    setProductImageUrls(imageUrls)
                  }}
                  placeholder="Chọn nhiều ảnh sản phẩm"
                  maxPreviewSize={200}
                />
                {productImageUrls.length > 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    ✅ Đã upload {productImageUrls.length} ảnh
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Tài liệu đính kèm</label>
                <input type="file" multiple onChange={e => setAttachedDocs(Array.from(e.target.files || []))} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" />
                {!!attachedDocs.length && <ul className="text-xs text-gray-700 mt-1">{attachedDocs.map(f => <li key={f.name}>{f.name}</li>)}</ul>}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">4. Xác nhận đăng ký</h3>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Thông tin doanh nghiệp</h4>
              <div>
                <p className="text-gray-700"><span className="font-medium">Tên:</span> {name || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Địa chỉ:</span> {address || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Điện thoại:</span> {phone || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Email:</span> {email || '(chưa nhập)'}</p>
                {!!website && (
                  <p className="text-gray-700"><span className="font-medium">Website:</span> {website}</p>
                )}
                {!!certificateNumber && (
                  <p className="text-gray-700"><span className="font-medium">Mã chứng nhận:</span> {certificateNumber}</p>
                )}
                {logoUrl && (
                  <div className="text-gray-700">
                    <span className="font-medium">Logo:</span>
                    <img src={logoUrl} alt="Logo" className="w-32 h-32 object-contain mt-2 rounded" />
                  </div>
                )}
              </div>
              <h4 className="font-semibold text-gray-900">Thông tin đại diện pháp luật</h4>
              <div>
                <p className="text-gray-700"><span className="font-medium">Họ tên:</span> {representativeName || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Chức vụ:</span> {representativePosition || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">CMND/CCCD:</span> {representativeIdNumber || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Ngày cấp:</span> {representativeIdIssuedDate || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Nơi cấp:</span> {representativeIdIssuedBy || '(chưa nhập)'}</p>
              </div>
              <h4 className="font-semibold text-gray-900">Thông tin sản phẩm</h4>
              <div>
                <p className="text-gray-700"><span className="font-medium">Tên sản phẩm:</span> {productName || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Danh mục:</span> {productCategory || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Mô tả:</span> {productDescription || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Xuất xứ:</span> {productOrigin || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Chứng nhận:</span> {productCertifications.length ? productCertifications.join(', ') : '(chưa nhập)'}</p>
                <div className="text-gray-700">
                  <span className="font-medium">Hình ảnh:</span>
                  {productImageUrls.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {productImageUrls.map((url, idx) => (
                        <img key={idx} src={url} alt={`Product ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                      ))}
                    </div>
                  ) : (
                    <span className="ml-1">(chưa nhập)</span>
                  )}
                </div>
              </div>
              <h4 className="font-semibold text-gray-900">Tài liệu đính kèm</h4>
              <div>
                <p className="text-gray-700">Tài liệu đính kèm: {attachedDocs.length ? attachedDocs.map(f => f.name).join(', ') : '(chưa nhập)'}</p>
              </div>
              <h4 className="font-semibold text-gray-900">Ghi chú bổ sung</h4>
              <div>
                <p className="text-gray-700">Ghi chú bổ sung: {additionalNotes || '(chưa nhập)'}</p>
              </div>
            </div>
            
            {/* Confirmation Checkbox */}
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  <strong>Tôi xác nhận</strong> rằng tất cả thông tin trên là chính xác và đầy đủ. 
                  Tôi hiểu rằng việc cung cấp thông tin sai lệch có thể dẫn đến từ chối đơn đăng ký.
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className={`px-6 py-2 rounded-lg font-medium ${step === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-700'}`}>Quay lại</button>
        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => {
              // Validate step hiện tại trước khi chuyển
              const isValid = step === 1 ? validateStep1() : step === 2 ? validateStep2() : true
              
              // Chỉ chuyển bước khi validation thành công và user click nút "Tiếp theo"
              // Không tự động chuyển bước sau khi validate
              if (isValid) {
                // Chỉ chuyển sang bước tiếp theo khi click nút
                const nextStep = step + 1
                if (nextStep <= totalSteps) {
                  setStep(nextStep)
                }
              }
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Tiếp theo
          </button>
        ) : (
          <button 
            type="submit"
            disabled={!isConfirmed}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              isConfirmed 
                ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!isConfirmed ? 'Vui lòng xác nhận thông tin trước' : 'Gửi đăng ký OCOP'}
          >
            {isConfirmed ? 'GỬI ĐĂNG KÝ ✓' : 'GỬI ĐĂNG KÝ'}
          </button>
        )}
      </div>
    </form>
  )
}
