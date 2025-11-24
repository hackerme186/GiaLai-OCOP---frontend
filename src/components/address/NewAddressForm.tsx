"use client"

import { useState, useEffect, useRef } from "react"
import { getCurrentAddress } from "@/lib/geolocation"
import { getProvinces, getDistricts, getWards, updateShippingAddressDetail, type Province, type District, type Ward } from "@/lib/api"

interface NewAddressFormProps {
    onBack?: () => void
    onSubmit?: (data: AddressFormData) => void
    initialData?: Partial<AddressFormData>
}

export interface AddressFormData {
    fullName: string
    phoneNumber: string
    provinceId: number
    districtId: number
    wardId: number
    specificAddress: string
    addressType: "home" | "office"
    isDefault: boolean
    latitude?: number
    longitude?: number
}

export default function NewAddressForm({ onBack, onSubmit, initialData }: NewAddressFormProps) {
    const [fullName, setFullName] = useState(initialData?.fullName || "")
    const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || "")
    const [provinceId, setProvinceId] = useState<number>(initialData?.provinceId || 0)
    const [districtId, setDistrictId] = useState<number>(initialData?.districtId || 0)
    const [wardId, setWardId] = useState<number>(initialData?.wardId || 0)
    const [specificAddress, setSpecificAddress] = useState(initialData?.specificAddress || "")
    const [addressType, setAddressType] = useState<"home" | "office">(initialData?.addressType || "home")
    const [isDefault, setIsDefault] = useState(initialData?.isDefault || false)
    const [loadingLocation, setLoadingLocation] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Data từ API
    const [provinces, setProvinces] = useState<Province[]>([])
    const [districts, setDistricts] = useState<District[]>([])
    const [wards, setWards] = useState<Ward[]>([])
    const [loadingProvinces, setLoadingProvinces] = useState(true)
    const [loadingDistricts, setLoadingDistricts] = useState(false)
    const [loadingWards, setLoadingWards] = useState(false)

    // Track xem đã load initial data chưa để tránh load trùng
    const hasLoadedInitialData = useRef(false)

    // Load provinces khi component mount
    useEffect(() => {
        const loadProvinces = async () => {
            try {
                setLoadingProvinces(true)
                setError(null)
                console.log("🔄 Loading provinces...")
                const data = await getProvinces()
                console.log("✅ Loaded provinces:", data.length, "items", data)

                if (data && data.length > 0) {
                    setProvinces(data)
                } else {
                    console.warn("⚠️ No provinces found")
                    setError("Không tìm thấy dữ liệu tỉnh/thành phố. Vui lòng kiểm tra database.")
                    setProvinces([])
                }
            } catch (err) {
                console.error("❌ Error loading provinces:", err)
                setError(err instanceof Error ? err.message : "Không thể tải danh sách tỉnh/thành phố")
                setProvinces([])
            } finally {
                setLoadingProvinces(false)
            }
        }
        loadProvinces()
    }, [])

    // Load districts và wards từ initialData khi component mount (nếu có)
    useEffect(() => {
        const loadInitialAddressData = async () => {
            // Chỉ load 1 lần khi có initialData và provinces đã load xong
            if (hasLoadedInitialData.current || loadingProvinces || provinces.length === 0) {
                return
            }

            if (initialData?.provinceId && initialData.provinceId > 0) {
                try {
                    hasLoadedInitialData.current = true
                    setLoadingDistricts(true)
                    const districtsData = await getDistricts(initialData.provinceId)
                    setDistricts(districtsData)

                    if (initialData?.districtId && initialData.districtId > 0) {
                        setLoadingWards(true)
                        const wardsData = await getWards(initialData.districtId)
                        setWards(wardsData)
                        setLoadingWards(false)
                    }
                } catch (err) {
                    console.error("Error loading initial address data:", err)
                } finally {
                    setLoadingDistricts(false)
                }
            }
        }
        loadInitialAddressData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provinces.length, loadingProvinces])

    // Load districts khi provinceId thay đổi
    useEffect(() => {
        if (provinceId <= 0) {
            setDistricts([])
            setWards([])
            setDistrictId(0)
            setWardId(0)
            return
        }

        // Load districts khi provinceId thay đổi
        const loadDistricts = async () => {
            try {
                setLoadingDistricts(true)
                setError(null)
                // Reset districts và wards khi province thay đổi
                setDistrictId(0)
                setWardId(0)
                setDistricts([])
                setWards([])

                console.log("🔄 Loading districts for provinceId:", provinceId)
                const data = await getDistricts(provinceId)
                console.log("✅ Loaded districts:", data.length, "items", data)

                if (data && data.length > 0) {
                    setDistricts(data)
                } else {
                    console.warn("⚠️ No districts found for provinceId:", provinceId)
                    setDistricts([])
                }
            } catch (err) {
                console.error("❌ Error loading districts:", err)
                setError(err instanceof Error ? err.message : "Không thể tải danh sách quận/huyện")
                setDistricts([])
            } finally {
                setLoadingDistricts(false)
            }
        }

        // Chỉ skip nếu đã load từ initialData và provinceId không đổi
        const shouldSkip = hasLoadedInitialData.current &&
            initialData?.provinceId === provinceId &&
            districts.length > 0

        if (!shouldSkip) {
            loadDistricts()
        } else {
            console.log("⏭️ Skipping - already loaded from initialData")
        }
    }, [provinceId])

    // Load wards khi districtId thay đổi
    useEffect(() => {
        if (districtId <= 0) {
            setWards([])
            setWardId(0)
            return
        }

        // Load wards khi districtId thay đổi
        const loadWards = async () => {
            try {
                setLoadingWards(true)
                setError(null)
                // Reset wards khi district thay đổi
                setWardId(0)
                setWards([])

                console.log("🔄 Loading wards for districtId:", districtId)
                const data = await getWards(districtId)
                console.log("✅ Loaded wards:", data.length, "items", data)

                if (data && data.length > 0) {
                    setWards(data)
                } else {
                    console.warn("⚠️ No wards found for districtId:", districtId)
                    setWards([])
                }
            } catch (err) {
                console.error("❌ Error loading wards:", err)
                setError(err instanceof Error ? err.message : "Không thể tải danh sách phường/xã")
                setWards([])
            } finally {
                setLoadingWards(false)
            }
        }

        // Chỉ skip nếu đã load từ initialData và districtId không đổi
        const shouldSkip = hasLoadedInitialData.current &&
            initialData?.districtId === districtId &&
            wards.length > 0

        if (!shouldSkip) {
            loadWards()
        } else {
            console.log("⏭️ Skipping - already loaded from initialData")
        }
    }, [districtId])

    const handleAddLocation = async () => {
        setLoadingLocation(true)
        setError(null)
        try {
            const addressResult = await getCurrentAddress()
            setSpecificAddress(addressResult.address)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể lấy vị trí từ GPS")
        } finally {
            setLoadingLocation(false)
        }
    }

    const handleSubmit = async () => {
        // Clear error trước khi validate
        setError(null)

        // Validation
        if (!fullName.trim()) {
            setError("Vui lòng nhập họ và tên")
            return
        }
        if (!phoneNumber.trim()) {
            setError("Vui lòng nhập số điện thoại")
            return
        }
        if (!provinceId || provinceId <= 0) {
            setError("Vui lòng chọn Tỉnh/Thành phố")
            return
        }
        if (!districtId || districtId <= 0) {
            setError("Vui lòng chọn Quận/Huyện")
            return
        }
        if (!wardId || wardId <= 0) {
            setError("Vui lòng chọn Phường/Xã")
            return
        }
        if (!specificAddress.trim()) {
            setError("Vui lòng nhập địa chỉ cụ thể")
            return
        }

        setLoading(true)

        try {
            // Gọi API cập nhật địa chỉ
            await updateShippingAddressDetail({
                provinceId,
                districtId,
                wardId,
                addressDetail: specificAddress.trim(),
            })

            const formData: AddressFormData = {
                fullName: fullName.trim(),
                phoneNumber: phoneNumber.trim(),
                provinceId,
                districtId,
                wardId,
                specificAddress: specificAddress.trim(),
                addressType,
                isDefault,
            }

            // Gọi callback sau khi API thành công
            onSubmit?.(formData)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật địa chỉ"
            setError(errorMessage)
            // Không gọi onSubmit nếu có lỗi
        } finally {
            setLoading(false)
        }
    }

    // Clear error khi user thay đổi input
    const handleInputChange = (setter: (value: any) => void, value: any) => {
        setter(value)
        if (error) {
            setError(null)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Địa chỉ mới (dùng thông tin trước sáp nhập)
            </h2>

            {/* Error Message */}
            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên
                    </label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => handleInputChange(setFullName, e.target.value)}
                        placeholder="Nhập họ và tên"
                        disabled={loading}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Phone Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại
                    </label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => handleInputChange(setPhoneNumber, e.target.value)}
                        placeholder="Nhập số điện thoại"
                        disabled={loading}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Location Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tỉnh/ Thành phố, Quận/Huyện, Phường/Xã
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                            value={provinceId}
                            onChange={(e) => handleInputChange(setProvinceId, Number(e.target.value))}
                            disabled={loadingProvinces || loading}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                            <option value="0">
                                {loadingProvinces ? "Đang tải..." : "Chọn Tỉnh/TP"}
                            </option>
                            {provinces.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={districtId}
                            onChange={(e) => handleInputChange(setDistrictId, Number(e.target.value))}
                            disabled={!provinceId || loadingDistricts || loading}
                            className={`w-full rounded-lg border px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${loadingDistricts
                                ? "border-gray-200"
                                : provinceId && districts.length > 0
                                    ? "border-gray-300 focus:border-orange-500"
                                    : "border-gray-300 focus:border-orange-500"
                                }`}
                        >
                            <option value="0">
                                {loadingDistricts ? "Đang tải..." : districts.length === 0 && provinceId ? "Không có dữ liệu" : "Chọn Quận/Huyện"}
                            </option>
                            {districts.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={wardId}
                            onChange={(e) => handleInputChange(setWardId, Number(e.target.value))}
                            disabled={!districtId || loadingWards || loading}
                            className={`w-full rounded-lg border px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${loadingWards
                                ? "border-gray-200"
                                : districtId && wards.length > 0
                                    ? "border-gray-300 focus:border-orange-500"
                                    : "border-gray-300 focus:border-orange-500"
                                }`}
                        >
                            <option value="0">
                                {loadingWards ? "Đang tải..." : wards.length === 0 && districtId ? "Không có dữ liệu" : "Chọn Phường/Xã"}
                            </option>
                            {wards.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Specific Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ cụ thể
                    </label>
                    <textarea
                        value={specificAddress}
                        onChange={(e) => handleInputChange(setSpecificAddress, e.target.value)}
                        placeholder="Nhập địa chỉ cụ thể (số nhà, tên đường, ...)"
                        rows={3}
                        disabled={loading}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Map/Location Section */}
                <div>
                    <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center relative overflow-hidden">
                        {/* Placeholder map pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100" height="100" fill="url(#grid)" />
                            </svg>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddLocation}
                            disabled={loadingLocation || loading}
                            className="relative z-10 inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-orange-500 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {loadingLocation ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Đang tải...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Thêm vị trí</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Address Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại địa chỉ:
                    </label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => handleInputChange(setAddressType, "home")}
                            disabled={loading}
                            className={`flex-1 px-4 py-2.5 rounded-lg border-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${addressType === "home"
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                                }`}
                        >
                            Nhà Riêng
                        </button>
                        <button
                            type="button"
                            onClick={() => handleInputChange(setAddressType, "office")}
                            disabled={loading}
                            className={`flex-1 px-4 py-2.5 rounded-lg border-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${addressType === "office"
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                                }`}
                        >
                            Văn Phòng
                        </button>
                    </div>
                </div>

                {/* Default Address Checkbox */}
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => handleInputChange(setIsDefault, e.target.checked)}
                            disabled={loading}
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Đặt làm địa chỉ mặc định
                        </span>
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={loading}
                        className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
                    >
                        Trở Lại
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Đang lưu..." : "Hoàn thành"}
                    </button>
                </div>
            </div>
        </div>
    )
}
