"use client"

import { useState } from "react"

interface OCOPFormData {
  // 1. Thông tin chủ thể
  subjectName: string
  subjectType: string
  taxCode: string
  address: string
  representative: string
  phone: string
  email: string
  website: string
  establishmentYear: number
  workforceSize: number

  // 2. Thông tin sản phẩm
  productName: string
  productGroup: string
  shortDescription: string
  packagingSpec: string
  mainMaterials: string
  materialOrigin: string
  productionProcess: string
  annualOutput: number
  sellingPrice: number
  productImages: File[]
  brandLogo: File[]
  packagingLabels: File[]
  currentCertifications: string[]
  consumerMarket: string

  // 3. Cơ sở sản xuất
  facilityLocation: string
  workshopArea: number
  equipmentMachinery: string
  productionCapacity: string
  wasteTreatmentSystem: string
  hygieneStandards: string

  // 4. Hồ sơ đính kèm
  businessLicense: File
  testReports: File
  certifications: File
  productPhotos: File
  trademarkCertificate: File

  // 5. Đề xuất & hỗ trợ
  desiredLevel: string
  desiredSupport: string[]
  notes: string

  // 6. Xác nhận và gửi
  infoCommitment: boolean
  submitterName: string
  submissionDate: string
}

interface OCOPFormProps {
  onSubmit: (data: OCOPFormData) => void
}

export default function OCOPForm({ onSubmit }: OCOPFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<OCOPFormData>>({
    subjectType: "",
    productGroup: "",
    wasteTreatmentSystem: "",
    hygieneStandards: "",
    desiredLevel: "",
    currentCertifications: [],
    desiredSupport: [],
    infoCommitment: false,
    productImages: [],
    brandLogo: [],
    packagingLabels: []
  })

  const totalSteps = 6

  const handleInputChange = (field: keyof OCOPFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (field: keyof OCOPFormData, files: FileList | null) => {
    if (!files) return
    
    if (field === 'productImages' || field === 'brandLogo' || field === 'packagingLabels') {
      const fileArray = Array.from(files)
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as File[] || []), ...fileArray]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: files[0]
      }))
    }
  }

  const handleCheckboxChange = (field: keyof OCOPFormData, value: string) => {
    const currentValues = formData[field] as string[] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    setFormData(prev => ({
      ...prev,
      [field]: newValues
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as OCOPFormData)
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">1. Thông tin chủ thể</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên chủ thể *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subjectName || ""}
                  onChange={(e) => handleInputChange('subjectName', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập tên chủ thể"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại hình chủ thể *
                </label>
                <select
                  required
                  value={formData.subjectType || ""}
                  onChange={(e) => handleInputChange('subjectType', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">Chọn loại hình</option>
                  <option value="doanh-nghiep">Doanh nghiệp</option>
                  <option value="htx">HTX</option>
                  <option value="ho-kd">Hộ KD</option>
                  <option value="ca-nhan">Cá nhân</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã số thuế *
                </label>
                <input
                  type="text"
                  required
                  value={formData.taxCode || ""}
                  onChange={(e) => handleInputChange('taxCode', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập mã số thuế"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address || ""}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Người đại diện *
                </label>
                <input
                  type="text"
                  required
                  value={formData.representative || ""}
                  onChange={(e) => handleInputChange('representative', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập tên người đại diện"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website/Fanpage
                </label>
                <input
                  type="text"
                  value={formData.website || ""}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập website hoặc fanpage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Năm thành lập *
                </label>
                <input
                  type="number"
                  required
                  value={formData.establishmentYear || ""}
                  onChange={(e) => handleInputChange('establishmentYear', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập năm thành lập"
                  min="1900"
                  max="2030"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quy mô lao động *
                </label>
                <input
                  type="number"
                  required
                  value={formData.workforceSize || ""}
                  onChange={(e) => handleInputChange('workforceSize', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập số lượng lao động"
                  min="1"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">2. Thông tin sản phẩm</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  required
                  value={formData.productName || ""}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập tên sản phẩm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhóm sản phẩm *
                </label>
                <select
                  required
                  value={formData.productGroup || ""}
                  onChange={(e) => handleInputChange('productGroup', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">Chọn nhóm sản phẩm</option>
                  <option value="nong-san">Nông sản</option>
                  <option value="thu-cong-my-nghe">Thủ công mỹ nghệ</option>
                  <option value="thuc-pham">Thực phẩm</option>
                  <option value="duoc-lieu">Dược liệu</option>
                  <option value="khac">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quy cách đóng gói
                </label>
                <input
                  type="text"
                  value={formData.packagingSpec || ""}
                  onChange={(e) => handleInputChange('packagingSpec', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Ví dụ: 500g/hộp, 1kg/túi"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả ngắn *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.shortDescription || ""}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Mô tả ngắn gọn về sản phẩm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nguyên liệu chính *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.mainMaterials || ""}
                  onChange={(e) => handleInputChange('mainMaterials', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Liệt kê các nguyên liệu chính sử dụng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nguồn gốc nguyên liệu
                </label>
                <input
                  type="text"
                  value={formData.materialOrigin || ""}
                  onChange={(e) => handleInputChange('materialOrigin', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nguồn gốc nguyên liệu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sản lượng/năm
                </label>
                <input
                  type="number"
                  value={formData.annualOutput || ""}
                  onChange={(e) => handleInputChange('annualOutput', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập sản lượng hàng năm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quy trình sản xuất
                </label>
                <textarea
                  rows={4}
                  value={formData.productionProcess || ""}
                  onChange={(e) => handleInputChange('productionProcess', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Mô tả quy trình sản xuất"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá bán (VND)
                </label>
                <input
                  type="number"
                  value={formData.sellingPrice || ""}
                  onChange={(e) => handleInputChange('sellingPrice', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập giá bán"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thị trường tiêu thụ
                </label>
                <input
                  type="text"
                  value={formData.consumerMarket || ""}
                  onChange={(e) => handleInputChange('consumerMarket', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Thị trường tiêu thụ chính"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh sản phẩm (3-5 ảnh)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload('productImages', e.target.files)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Chọn 3-5 hình ảnh sản phẩm</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo thương hiệu
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('brandLogo', e.target.files)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhãn mác bao bì
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('packagingLabels', e.target.files)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chứng nhận hiện có
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['VietGAP', 'GlobalGAP', 'HACCP', 'ISO 9001', 'ISO 22000', 'Khác'].map((cert) => (
                    <label key={cert} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={(formData.currentCertifications || []).includes(cert)}
                        onChange={() => handleCheckboxChange('currentCertifications', cert)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{cert}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">3. Cơ sở sản xuất</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa điểm cơ sở *
                </label>
                <input
                  type="text"
                  required
                  value={formData.facilityLocation || ""}
                  onChange={(e) => handleInputChange('facilityLocation', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập địa điểm cơ sở sản xuất"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diện tích nhà xưởng (m²)
                </label>
                <input
                  type="number"
                  value={formData.workshopArea || ""}
                  onChange={(e) => handleInputChange('workshopArea', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập diện tích"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Công suất sản xuất
                </label>
                <input
                  type="text"
                  value={formData.productionCapacity || ""}
                  onChange={(e) => handleInputChange('productionCapacity', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Ví dụ: 1000 tấn/năm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thiết bị / máy móc
                </label>
                <textarea
                  rows={3}
                  value={formData.equipmentMachinery || ""}
                  onChange={(e) => handleInputChange('equipmentMachinery', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Mô tả thiết bị, máy móc hiện có"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hệ thống xử lý chất thải
                </label>
                <div className="space-y-2">
                  {['Có', 'Không'].map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="wasteTreatmentSystem"
                        value={option}
                        checked={formData.wasteTreatmentSystem === option}
                        onChange={(e) => handleInputChange('wasteTreatmentSystem', e.target.value)}
                        className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu chuẩn vệ sinh ATTP
                </label>
                <select
                  value={formData.hygieneStandards || ""}
                  onChange={(e) => handleInputChange('hygieneStandards', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">Chọn trạng thái</option>
                  <option value="dat">Đạt</option>
                  <option value="chua-dat">Chưa đạt</option>
                  <option value="dang-xin-cap">Đang xin cấp</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">4. Hồ sơ đính kèm</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giấy phép kinh doanh
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload('businessLicense', e.target.files)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hồ sơ kiểm nghiệm
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload('testReports', e.target.files)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chứng nhận VietGAP / ATTP
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload('certifications', e.target.files)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh sản phẩm
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload('productPhotos', e.target.files)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giấy chứng nhận nhãn hiệu
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload('trademarkCertificate', e.target.files)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">5. Đề xuất & hỗ trợ</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cấp đánh giá mong muốn
                </label>
                <select
                  value={formData.desiredLevel || ""}
                  onChange={(e) => handleInputChange('desiredLevel', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">Chọn cấp đánh giá</option>
                  <option value="huyen">Huyện</option>
                  <option value="tinh">Tỉnh</option>
                  <option value="quoc-gia">Quốc gia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hỗ trợ mong muốn
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['Đào tạo', 'Quảng bá', 'Thiết kế bao bì', 'Tiếp thị', 'Xuất khẩu', 'Khác'].map((support) => (
                    <label key={support} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={(formData.desiredSupport || []).includes(support)}
                        onChange={() => handleCheckboxChange('desiredSupport', support)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{support}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  rows={4}
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Nhập ghi chú bổ sung hoặc yêu cầu đặc biệt"
                />
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">6. Xác nhận và gửi</h3>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    required
                    checked={formData.infoCommitment || false}
                    onChange={(e) => handleInputChange('infoCommitment', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Cam kết thông tin chính xác *
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ tên người nộp hồ sơ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.submitterName || ""}
                    onChange={(e) => handleInputChange('submitterName', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    placeholder="Nhập họ tên người nộp hồ sơ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày nộp hồ sơ *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.submissionDate || ""}
                    onChange={(e) => handleInputChange('submissionDate', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < totalSteps && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Bước {currentStep} / {totalSteps}
          </p>
        </div>
      </div>

      {/* Form content */}
      <div className="mb-8">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`px-6 py-2 rounded-lg font-medium ${
            currentStep === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          Quay lại
        </button>

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={nextStep}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Tiếp theo
          </button>
        ) : (
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            GỬI ĐĂNG KÝ
          </button>
        )}
      </div>
    </form>
  )
}
