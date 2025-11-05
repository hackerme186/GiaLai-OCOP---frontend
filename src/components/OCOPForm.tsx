"use client"

import { useState } from "react"
import { OcopRegistrationDto } from "@/lib/api"

interface OCOPFormProps {
  onSubmit: (data: OcopRegistrationDto) => void
}

export default function OCOPForm({ onSubmit }: OCOPFormProps) {
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [certificateNumber, setCertificateNumber] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
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
  type ProductFormItem = { name: string; description: string; priceText: string }
  const [products, setProducts] = useState<ProductFormItem[]>([
    { name: "", description: "", priceText: "" }
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // --- 0. THÊM STATE MỚI (dưới dòng 44) ---
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImages, setProductImages] = useState<File[]>([]); // allow multiple
  // Multi-file upload for attached docs
  const [attachedDocs, setAttachedDocs] = useState<File[]>([]); // replace attachedDocuments

  const addProduct = () => {
    setProducts(prev => ([...prev, { name: "", description: "", priceText: "" }]))
  }

  const removeProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index))
  }

  const updateProduct = (index: number, field: keyof ProductFormItem, value: any) => {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
    setErrors(prev => {
      const copy = { ...prev }
      delete copy[`product_${index}_${field}`]
      return copy
    })
  }

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {}
    if (!name.trim()) nextErrors.name = "Vui lòng nhập tên doanh nghiệp"
    if (!description.trim()) nextErrors.description = "Vui lòng nhập mô tả"
    if (!address.trim()) nextErrors.address = "Vui lòng nhập địa chỉ"
    if (!phone.trim()) nextErrors.phone = "Vui lòng nhập số điện thoại"
    if (!email.trim()) nextErrors.email = "Vui lòng nhập email"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {}
    products.forEach((p, i) => {
      if (!p.name.trim()) nextErrors[`product_${i}_name`] = "Vui lòng nhập tên sản phẩm"
      if (!p.description.trim()) nextErrors[`product_${i}_description`] = "Vui lòng nhập mô tả sản phẩm"
      if (!p.priceText.trim()) nextErrors[`product_${i}_priceText`] = "Vui lòng nhập giá"
    })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // --- SUBMIT: ĐƯA ĐẦY ĐỦ DỮ LIỆU VÀO PAYLOAD ---
    const payload: OcopRegistrationDto = {
      enterpriseName: name,
      businessType,
      taxCode,
      businessLicenseNumber,
      licenseIssuedDate,
      licenseIssuedBy,
      address,
      ward,
      district,
      province,
      phoneNumber: phone,
      emailContact: email,
      website,
      representativeName,
      representativePosition,
      representativeIdNumber,
      representativeIdIssuedDate,
      representativeIdIssuedBy,
      productionLocation,
      numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : undefined,
      productionScale,
      businessField,
      productName,
      productCategory,
      productDescription,
      productOrigin,
      productCertifications: productCertifications.length ? productCertifications : undefined,
      productImages: undefined, // TODO: Upload files and get URLs
      attachedDocuments: undefined, // TODO: Upload files and get URLs
      additionalNotes,
      status: undefined
    }

    onSubmit(payload)
  }

        return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        form input::placeholder,
        form textarea::placeholder {
          color: #374151 !important;
          opacity: 1 !important;
        }
        form input[type="text"],
        form input[type="email"],
        form input[type="number"],
        form input[type="tel"],
        form input[type="date"],
        form textarea {
          color: #111827 !important;
        }
      `}} />
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên doanh nghiệp *</label>
                <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập tên doanh nghiệp" />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại hình doanh nghiệp</label>
                <input type="text" value={businessType} onChange={e=>setBusinessType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập loại hình doanh nghiệp" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã số thuế</label>
                <input type="text" value={taxCode} onChange={e=>setTaxCode(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập mã số thuế" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số giấy phép kinh doanh</label>
                <input type="text" value={businessLicenseNumber} onChange={e=>setBusinessLicenseNumber(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập số giấy phép kinh doanh" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày cấp giấy phép</label>
                <input type="date" value={licenseIssuedDate} onChange={e=>setLicenseIssuedDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nơi cấp giấy phép</label>
                <input type="text" value={licenseIssuedBy} onChange={e=>setLicenseIssuedBy(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập nơi cấp giấy phép" />
              </div>
              {/* địa chỉ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố</label>
                <input type="text" value={province} onChange={e=>setProvince(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập tỉnh/thành phố" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
                <input type="text" value={district} onChange={e=>setDistrict(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập quận/huyện" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phường/Xã</label>
                <input type="text" value={ward} onChange={e=>setWard(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập phường/xã" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ *</label>
                <input type="text" required value={address} onChange={e=>setAddress(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập địa chỉ trụ sở / sản xuất" />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                <input type="text" required value={phone} onChange={e=>setPhone(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Số điện thoại liên hệ" />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email liên hệ *</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Email doanh nghiệp" />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input type="text" value={website} onChange={e=>setWebsite(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Trang web (nếu có)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quy mô sản xuất</label>
                <input type="text" value={productionScale} onChange={e=>setProductionScale(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập quy mô sản xuất" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Địa điểm sản xuất</label>
                <input type="text" value={productionLocation} onChange={e=>setProductionLocation(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Địa điểm sản xuất" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lao động</label>
                <input type="number" value={numberOfEmployees} onChange={e=>setNumberOfEmployees(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập số lao động" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lĩnh vực kinh doanh</label>
                <input type="text" value={businessField} onChange={e=>setBusinessField(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập lĩnh vực kinh doanh" />
              </div>
            </div>
            <h4 className="text-lg font-medium mt-6">2. Thông tin đại diện pháp luật</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên đại diện</label>
                <input type="text" value={representativeName} onChange={e=>setRepresentativeName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập họ tên đại diện" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chức vụ đại diện</label>
                <input type="text" value={representativePosition} onChange={e=>setRepresentativePosition(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập chức vụ đại diện" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CMND/CCCD</label>
                <input type="text" value={representativeIdNumber} onChange={e=>setRepresentativeIdNumber(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập CMND/CCCD" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày cấp</label>
                <input type="date" value={representativeIdIssuedDate} onChange={e=>setRepresentativeIdIssuedDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nơi cấp</label>
                <input type="text" value={representativeIdIssuedBy} onChange={e=>setRepresentativeIdIssuedBy(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập nơi cấp" />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú bổ sung</label>
              <textarea rows={2} value={additionalNotes} onChange={e=>setAdditionalNotes(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Ghi chú bổ sung (nếu có)" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">3. Thông tin sản phẩm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm</label>
                <input type="text" value={productName} onChange={e=>setProductName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập tên sản phẩm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục sản phẩm</label>
                <input type="text" value={productCategory} onChange={e=>setProductCategory(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập danh mục sản phẩm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả sản phẩm</label>
                <textarea rows={3} value={productDescription} onChange={e=>setProductDescription(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Mô tả sản phẩm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Xuất xứ sản phẩm</label>
                <input type="text" value={productOrigin} onChange={e=>setProductOrigin(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Nhập xuất xứ sản phẩm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chứng nhận sản phẩm</label>
                <input type="text" value={productCertifications} onChange={e=>setProductCertifications(e.target.value.split(','))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="Mỗi chứng nhận ngăn cách bởi dấu phẩy" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh sản phẩm</label>
                <input type="file" accept="image/*" multiple onChange={e=>setProductImages(Array.from(e.target.files||[]))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" />
                {!!productImages.length && <ul className="text-xs mt-1">{productImages.map(f=><li key={f.name}>{f.name}</li>)}</ul>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tài liệu đính kèm</label>
                <input type="file" multiple onChange={e=>setAttachedDocs(Array.from(e.target.files||[]))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" />
                {!!attachedDocs.length && <ul className="text-xs mt-1">{attachedDocs.map(f=><li key={f.name}>{f.name}</li>)}</ul>}
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
                <p className="text-gray-700"><span className="font-medium">Mô tả:</span> {description || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Địa chỉ:</span> {address || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Điện thoại:</span> {phone || '(chưa nhập)'}</p>
                <p className="text-gray-700"><span className="font-medium">Email:</span> {email || '(chưa nhập)'}</p>
                {!!website && (
                  <p className="text-gray-700"><span className="font-medium">Website:</span> {website}</p>
                )}
                {!!certificateNumber && (
                  <p className="text-gray-700"><span className="font-medium">Mã chứng nhận:</span> {certificateNumber}</p>
                )}
                {logoFile && (
                  <p className="text-gray-700"><span className="font-medium">Logo:</span> {logoFile.name}</p>
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
                <p className="text-gray-700"><span className="font-medium">Hình ảnh:</span> {productImages.length ? productImages.map(f=>f.name).join(', ') : '(chưa nhập)'}</p>
              </div>
              <h4 className="font-semibold text-gray-900">Tài liệu đính kèm</h4>
              <div>
                <p className="text-gray-700">Tài liệu đính kèm: {attachedDocs.length ? attachedDocs.map(f=>f.name).join(', ') : '(chưa nhập)'}</p>
              </div>
              <h4 className="font-semibold text-gray-900">Ghi chú bổ sung</h4>
              <div>
                <p className="text-gray-700">Ghi chú bổ sung: {additionalNotes || '(chưa nhập)'}</p>
              </div>
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
              const ok = step === 1 ? validateStep1() : step === 2 ? validateStep2() : true
              if (ok) setStep(Math.min(totalSteps, step + 1))
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Tiếp theo
          </button>
        ) : (
          <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">GỬI ĐĂNG KÝ</button>
        )}
      </div>
    </form>
    </>
  )
}
