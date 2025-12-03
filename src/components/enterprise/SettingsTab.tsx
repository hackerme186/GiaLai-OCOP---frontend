"use client"

import { useEffect, useState } from "react"
import { getMyEnterprise, updateMyEnterprise, getEnterpriseSettings, updateEnterpriseSettings, type Enterprise, type User, type EnterpriseSettings, type ShippingMethod } from "@/lib/api"

interface SettingsTabProps {
  user: User | null
}


export default function SettingsTab({ user }: SettingsTabProps) {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([
    { id: "cod", name: "Thanh toán khi nhận hàng (COD)", enabled: true, fee: 0, description: "Khách hàng thanh toán khi nhận hàng" },
    { id: "standard", name: "Giao hàng tiêu chuẩn", enabled: true, fee: 30000, description: "Giao hàng trong 3-5 ngày" },
    { id: "express", name: "Giao hàng nhanh", enabled: false, fee: 50000, description: "Giao hàng trong 1-2 ngày" },
  ])

  const [settings, setSettings] = useState({
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    businessHours: "08:00 - 17:00",
    returnPolicy: "",
    shippingPolicy: "",
  })

  useEffect(() => {
    if (user?.enterpriseId) {
      loadSettings()
    }
  }, [user?.enterpriseId])

  const loadSettings = async () => {
    if (!user?.enterpriseId) return
    
    try {
      setLoading(true)
      
      // Try to load settings from API
      try {
        const settingsData = await getEnterpriseSettings()
        setShippingMethods(settingsData.shippingMethods || [])
        setSettings({
          contactEmail: settingsData.contactEmail || "",
          contactPhone: settingsData.contactPhone || "",
          contactAddress: settingsData.contactAddress || "",
          businessHours: settingsData.businessHours || "08:00 - 17:00",
          returnPolicy: settingsData.returnPolicy || "",
          shippingPolicy: settingsData.shippingPolicy || "",
        })
      } catch (settingsError) {
        // Fallback to enterprise data
        const enterpriseData = await getMyEnterprise()
        setEnterprise(enterpriseData)
        setSettings({
          contactEmail: enterpriseData.emailContact || "",
          contactPhone: enterpriseData.phoneNumber || "",
          contactAddress: enterpriseData.address || "",
          businessHours: "08:00 - 17:00",
          returnPolicy: "",
          shippingPolicy: "",
        })
      }
    } catch (err) {
      console.error("Failed to load settings:", err)
      setError("Không thể tải thông tin cài đặt")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!user?.enterpriseId) return
    
    try {
      setSaving(true)
      setError(null)
      
      // Update enterprise basic info
      await updateMyEnterprise({
        emailContact: settings.contactEmail,
        phoneNumber: settings.contactPhone,
        address: settings.contactAddress,
      })
      
      // Update enterprise settings
      await updateEnterpriseSettings({
        enterpriseId: user.enterpriseId,
        shippingMethods: shippingMethods,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        contactAddress: settings.contactAddress,
        businessHours: settings.businessHours,
        returnPolicy: settings.returnPolicy,
        shippingPolicy: settings.shippingPolicy,
      })
      
      setSuccess("Đã lưu cài đặt thành công!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Failed to save settings:", err)
      setError(err instanceof Error ? err.message : "Không thể lưu cài đặt")
    } finally {
      setSaving(false)
    }
  }

  const toggleShippingMethod = (id: string) => {
    setShippingMethods(prev => prev.map(method =>
      method.id === id ? { ...method, enabled: !method.enabled } : method
    ))
  }

  const updateShippingFee = (id: string, fee: number) => {
    setShippingMethods(prev => prev.map(method =>
      method.id === id ? { ...method, fee } : method
    ))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải cài đặt...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border-2 border-green-200 text-green-800 rounded-lg p-4 flex items-center justify-between">
          <span className="font-medium">{success}</span>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cài đặt doanh nghiệp</h2>
        <p className="text-sm text-gray-500">Cấu hình thông tin và phương thức giao hàng</p>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Thông tin liên hệ</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email liên hệ <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.contactAddress}
              onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Giờ làm việc
            </label>
            <input
              type="text"
              value={settings.businessHours}
              onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
              placeholder="VD: 08:00 - 17:00"
            />
          </div>
        </div>
      </div>

      {/* Shipping Methods */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Phương thức giao hàng</h3>
        </div>
        <div className="space-y-4">
          {shippingMethods.map(method => (
            <div key={method.id} className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={() => toggleShippingMethod(method.id)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <div>
                    <label className="font-semibold text-gray-900 cursor-pointer">
                      {method.name}
                    </label>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
              </div>
              
              {method.enabled && (
                <div className="ml-8">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phí giao hàng (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={method.fee}
                    onChange={(e) => updateShippingFee(method.id, parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    min="0"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Policies */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Chính sách</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Chính sách đổi trả
            </label>
            <textarea
              value={settings.returnPolicy}
              onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
              rows={4}
              placeholder="Nhập chính sách đổi trả..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Chính sách giao hàng
            </label>
            <textarea
              value={settings.shippingPolicy}
              onChange={(e) => setSettings({ ...settings, shippingPolicy: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
              rows={4}
              placeholder="Nhập chính sách giao hàng..."
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Lưu cài đặt</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

