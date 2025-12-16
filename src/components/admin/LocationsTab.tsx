"use client"

import { useState, useEffect } from "react"
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  type Location,
  type CreateLocationDto,
} from "@/lib/api"

export default function LocationsTab() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getLocations()
      setLocations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách địa điểm")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setAddress("")
    setLatitude("")
    setLongitude("")
    setEditingLocation(null)
    setShowForm(false)
  }

  const handleOpenForm = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setName(location.name)
      setAddress(location.address)
      setLatitude(location.latitude.toString())
      setLongitude(location.longitude.toString())
    } else {
      resetForm()
    }
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Vĩ độ và kinh độ phải là số hợp lệ")
      }

      if (lat < -90 || lat > 90) {
        throw new Error("Vĩ độ phải nằm trong khoảng -90 đến 90")
      }

      if (lng < -180 || lng > 180) {
        throw new Error("Kinh độ phải nằm trong khoảng -180 đến 180")
      }

      const payload: CreateLocationDto = {
        name: name.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lng,
      }

      if (editingLocation) {
        await updateLocation(editingLocation.id, payload)
        alert("Cập nhật địa điểm thành công!")
      } else {
        await createLocation(payload)
        alert("Tạo địa điểm thành công!")
      }

      resetForm()
      await loadLocations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu địa điểm")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa điểm này?")) {
      return
    }

    try {
      await deleteLocation(id)
      alert("Xóa địa điểm thành công!")
      await loadLocations()
    } catch (err) {
      alert("Xóa thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Đang tải danh sách địa điểm...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📍 Quản lý Địa điểm</h2>
            <p className="text-white/90 text-lg">Quản lý các địa điểm trong hệ thống OCOP Gia Lai</p>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm địa điểm mới
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {editingLocation ? "Sửa địa điểm" : "Thêm địa điểm mới"}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border-2 border-rose-200">
              <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                Tên địa điểm *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Trung tâm Gia Lai"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-semibold"
              />
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 border-2 border-pink-200">
              <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                Địa chỉ *
              </label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={4}
                placeholder="Nhập địa chỉ chi tiết"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  Vĩ độ (Latitude) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Ví dụ: 13.9833"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-semibold"
                />
                <p className="text-xs text-gray-500 mt-2 font-medium">Từ -90 đến 90</p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  Kinh độ (Longitude) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Ví dụ: 108.0167"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-semibold"
                />
                <p className="text-xs text-gray-500 mt-2 font-medium">Từ -180 đến 180</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800 font-semibold">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold shadow-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {saving ? "Đang lưu..." : editingLocation ? "💾 Cập nhật" : "➕ Tạo mới"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locations List */}
      {locations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
          <div className="text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500 font-medium text-lg mb-2">Chưa có địa điểm nào</p>
            <p className="text-gray-400 text-sm">Hãy thêm địa điểm đầu tiên!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location, index) => (
            <div
              key={location.id}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl hover:border-rose-300 transition-all duration-300 transform hover:-translate-y-1"
              style={{
                animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-gray-200">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{location.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{location.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4 p-3 bg-rose-50 rounded-xl border border-rose-200">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-semibold text-rose-700">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleOpenForm(location)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold"
                  title="Sửa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold"
                  title="Xóa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

