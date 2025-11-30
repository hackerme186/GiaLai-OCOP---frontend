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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Địa điểm</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý các địa điểm trong hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Thêm địa điểm
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingLocation ? "Sửa địa điểm" : "Thêm địa điểm mới"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên địa điểm *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Trung tâm Gia Lai"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ *
              </label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Nhập địa chỉ chi tiết"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vĩ độ (Latitude) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Ví dụ: 13.9833"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Từ -90 đến 90</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kinh độ (Longitude) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Ví dụ: 108.0167"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Từ -180 đến 180</p>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? "Đang lưu..." : editingLocation ? "Cập nhật" : "Tạo mới"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locations List */}
      {locations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Chưa có địa điểm nào. Hãy thêm địa điểm đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{location.name}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenForm(location)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Sửa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{location.address}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

