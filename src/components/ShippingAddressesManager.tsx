"use client"
import { useState, useEffect } from "react"
import {
  getShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  setDefaultShippingAddress,
  type ShippingAddress,
  type CreateShippingAddressDto,
} from "@/lib/api"
import { getProvinces, getDistricts, getWards, type Province, type District, type Ward } from "@/lib/api"

interface ShippingAddressesManagerProps {
  onSelect?: (address: ShippingAddress) => void
  showSelectButton?: boolean
}

export default function ShippingAddressesManager({ onSelect, showSelectButton = false }: ShippingAddressesManagerProps) {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null)

  // Form state
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [addressLine, setAddressLine] = useState("")
  const [ward, setWard] = useState("")
  const [district, setDistrict] = useState("")
  const [province, setProvince] = useState("")
  const [label, setLabel] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  // Address dropdowns
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null)
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null)

  useEffect(() => {
    loadAddresses()
    loadProvinces()
  }, [])

  useEffect(() => {
    if (selectedProvinceId) {
      loadDistricts(selectedProvinceId)
    } else {
      setDistricts([])
      setWards([])
    }
  }, [selectedProvinceId])

  useEffect(() => {
    if (selectedDistrictId) {
      loadWards(selectedDistrictId)
    } else {
      setWards([])
    }
  }, [selectedDistrictId])

  const loadAddresses = async () => {
    try {
      setLoading(true)
      const data = await getShippingAddresses()
      setAddresses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách địa chỉ")
    } finally {
      setLoading(false)
    }
  }

  const loadProvinces = async () => {
    try {
      const data = await getProvinces()
      setProvinces(data)
    } catch (err) {
      console.error("Failed to load provinces:", err)
    }
  }

  const loadDistricts = async (provinceId: number) => {
    try {
      const data = await getDistricts(provinceId)
      setDistricts(data)
    } catch (err) {
      console.error("Failed to load districts:", err)
    }
  }

  const loadWards = async (districtId: number) => {
    try {
      const data = await getWards(districtId)
      setWards(data)
    } catch (err) {
      console.error("Failed to load wards:", err)
    }
  }

  const handleOpenForm = (address?: ShippingAddress) => {
    if (address) {
      setEditingAddress(address)
      setFullName(address.fullName)
      setPhoneNumber(address.phoneNumber)
      setAddressLine(address.addressLine)
      setWard(address.ward)
      setDistrict(address.district)
      setProvince(address.province)
      setLabel(address.label || "")
      setIsDefault(address.isDefault)
      // Try to find province/district IDs from names
      const provinceObj = provinces.find(p => p.name === address.province)
      if (provinceObj) {
        setSelectedProvinceId(provinceObj.id)
      }
    } else {
      setEditingAddress(null)
      resetForm()
    }
    setShowForm(true)
  }

  const resetForm = () => {
    setFullName("")
    setPhoneNumber("")
    setAddressLine("")
    setWard("")
    setDistrict("")
    setProvince("")
    setLabel("")
    setIsDefault(false)
    setSelectedProvinceId(null)
    setSelectedDistrictId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const payload: CreateShippingAddressDto = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        addressLine: addressLine.trim(),
        ward: ward.trim(),
        district: district.trim(),
        province: province.trim(),
        label: label.trim() || undefined,
        isDefault,
      }

      if (editingAddress) {
        await updateShippingAddress(editingAddress.id, payload)
      } else {
        await createShippingAddress(payload)
      }

      await loadAddresses()
      setShowForm(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu địa chỉ")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return

    try {
      await deleteShippingAddress(id)
      await loadAddresses()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xóa địa chỉ. Có thể địa chỉ này đã được sử dụng trong đơn hàng.")
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultShippingAddress(id)
      await loadAddresses()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể đặt địa chỉ mặc định")
    }
  }

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = parseInt(e.target.value)
    setSelectedProvinceId(provinceId)
    const provinceObj = provinces.find(p => p.id === provinceId)
    if (provinceObj) {
      setProvince(provinceObj.name)
    }
    setDistrict("")
    setWard("")
    setSelectedDistrictId(null)
  }

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = parseInt(e.target.value)
    setSelectedDistrictId(districtId)
    const districtObj = districts.find(d => d.id === districtId)
    if (districtObj) {
      setDistrict(districtObj.name)
    }
    setWard("")
  }

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = parseInt(e.target.value)
    const wardObj = wards.find(w => w.id === wardId)
    if (wardObj) {
      setWard(wardObj.name)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Đang tải địa chỉ...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Địa chỉ giao hàng ({addresses.length})
        </h2>
        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Thêm địa chỉ
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại *
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0123456789"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tỉnh/Thành phố *
              </label>
              {provinces.length > 0 ? (
                <select
                  required
                  value={selectedProvinceId || ""}
                  onChange={handleProvinceChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Tỉnh/Thành phố"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              )}
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quận/Huyện *
              </label>
              {districts.length > 0 ? (
                <select
                  required
                  value={selectedDistrictId || ""}
                  onChange={handleDistrictChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Quận/Huyện"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              )}
            </div>

            {/* Ward */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phường/Xã *
              </label>
              {wards.length > 0 ? (
                <select
                  required
                  onChange={handleWardChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">Chọn phường/xã</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="Phường/Xã"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              )}
            </div>

            {/* Address Line */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ chi tiết *
              </label>
              <input
                type="text"
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Số nhà, tên đường..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhãn (tùy chọn)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nhà, Công ty, ..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            {/* Is Default */}
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Đặt làm địa chỉ mặc định
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {editingAddress ? "Cập nhật" : "Thêm địa chỉ"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Chưa có địa chỉ nào. Hãy thêm địa chỉ đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                address.isDefault
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {address.isDefault && (
                    <span className="inline-block px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded mb-2">
                      Mặc định
                    </span>
                  )}
                  {address.label && (
                    <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded ml-2">
                      {address.label}
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900 mt-2">{address.fullName}</h3>
                  <p className="text-sm text-gray-600">{address.phoneNumber}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Đặt làm mặc định"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenForm(address)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Sửa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                {address.addressLine}, {address.ward}, {address.district}, {address.province}
              </p>
              {showSelectButton && onSelect && (
                <button
                  onClick={() => onSelect(address)}
                  className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Chọn địa chỉ này
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

