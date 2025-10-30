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

    const payload: OcopRegistrationDto = {
      enterpriseName: name,
      businessType: businessType || undefined,
      taxCode: taxCode || undefined,
      businessLicenseNumber: businessLicenseNumber || undefined,
      licenseIssuedDate: licenseIssuedDate || undefined,
      licenseIssuedBy: licenseIssuedBy || undefined,
      address: address || undefined,
      ward: ward || undefined,
      district: district || undefined,
      province: province || undefined,
      phoneNumber: phone || undefined,
      emailContact: email || undefined,
      website: website || undefined,
      representativeName: representativeName || undefined,
      representativePosition: representativePosition || undefined,
      representativeIdNumber: representativeIdNumber || undefined,
      representativeIdIssuedDate: representativeIdIssuedDate || undefined,
      representativeIdIssuedBy: representativeIdIssuedBy || undefined,
      productionLocation: productionLocation || undefined,
      numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : undefined,
      productionScale: productionScale || undefined,
      businessField: businessField || undefined,
      productName: products[0]?.name || undefined,
      productCategory: productCategory || undefined,
      productDescription: products[0]?.description || undefined,
      productOrigin: productOrigin || undefined,
      productCertifications: productCertifications.length ? productCertifications : undefined,
      productImages: undefined,
      attachedDocuments: undefined,
      additionalNotes: additionalNotes || undefined,
      status: undefined,
    }

    onSubmit(payload)
  }

        return (
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
            <h3 className="text-xl font-semibold text-gray-900 mb-6">1. Thông tin doanh nghiệp </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên doanh nghiệp *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập tên doanh nghiệp"
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Mô tả doanh nghiệp"
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Địa điểm sản xuất</label>
                <input
                  type="text"
                  value={productionLocation}
                  onChange={(e) => setProductionLocation(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Địa điểm sản xuất"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập địa chỉ trụ sở / sản xuất"
                />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Số điện thoại liên hệ"
                />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Email doanh nghiệp"
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Trang web (nếu có)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo (ảnh)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã chứng nhận / Giấy phép</label>
                <input
                  type="text"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Số chứng nhận OCOP / GPKD (nếu có)"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">2. Sản phẩm </h3>
            <div className="space-y-6">
              {products.map((product, index) => (
                <div key={index} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Sản phẩm #{index + 1}</h4>
                    {products.length > 1 && (
                      <button type="button" onClick={() => removeProduct(index)} className="text-red-600 hover:text-red-800 text-sm">Xóa</button>
                    )}
                  </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                        value={product.name}
                        onChange={(e) => updateProduct(index, 'name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        placeholder="Nhập tên sản phẩm"
                      />
                      {errors[`product_${index}_name`] && <p className="text-sm text-red-600 mt-1">{errors[`product_${index}_name`]}</p>}
              </div>
              <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  rows={3}
                        value={product.description}
                        onChange={(e) => updateProduct(index, 'description', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        placeholder="Mô tả sản phẩm"
                />
                      {errors[`product_${index}_description`] && <p className="text-sm text-red-600 mt-1">{errors[`product_${index}_description`]}</p>}
              </div>
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Giá (VND)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={product.priceText}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '')
                          updateProduct(index, 'priceText', v)
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        placeholder="Nhập giá"
                      />
                      {errors[`product_${index}_priceText`] && <p className="text-sm text-red-600 mt-1">{errors[`product_${index}_priceText`]}</p>}
              </div>
            </div>
          </div>
              ))}
              <button type="button" onClick={addProduct} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">+ Thêm sản phẩm</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">3. Xác nhận</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Doanh nghiệp</h4>
                <p className="text-gray-700"><span className="font-medium">Tên:</span> {name || '(chưa nhập)'}
                </p>
                <p className="text-gray-700"><span className="font-medium">Mô tả:</span> {description || '(chưa nhập)'}
                </p>
                <p className="text-gray-700"><span className="font-medium">Địa chỉ:</span> {address || '(chưa nhập)'}
                </p>
                <p className="text-gray-700"><span className="font-medium">Điện thoại:</span> {phone || '(chưa nhập)'}
                </p>
                <p className="text-gray-700"><span className="font-medium">Email:</span> {email || '(chưa nhập)'}
                </p>
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
              <div>
                <h4 className="font-semibold text-gray-900">Sản phẩm</h4>
                <div className="space-y-3">
                  {products.map((p, i) => (
                    <div key={i} className="bg-gray-50 rounded p-3">
                      <p className="text-gray-700"><span className="font-medium">Tên:</span> {p.name || '(chưa nhập)'} </p>
                      <p className="text-gray-700"><span className="font-medium">Giá:</span> {p.priceText ? Number(p.priceText).toLocaleString('vi-VN') : '(chưa nhập)'} ₫</p>
                      <p className="text-gray-700"><span className="font-medium">Mô tả:</span> {p.description || '(chưa nhập)'} </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className={`px-6 py-2 rounded-lg font-medium ${step === 1 ? 'bg-gray-2 00 text-gray-400 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-700'}`}>Quay lại</button>
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
  )
}
