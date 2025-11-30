"use client"

import { useState, useEffect } from "react"
import {
  getProducers,
  createProducer,
  updateProducer,
  deleteProducer,
  type Producer,
  type CreateProducerDto,
} from "@/lib/api"

export default function ProducersTab() {
  const [producers, setProducers] = useState<Producer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProducer, setEditingProducer] = useState<Producer | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProducers()
  }, [])

  const loadProducers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getProducers()
      setProducers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách nhà sản xuất")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setAddress("")
    setEditingProducer(null)
    setShowForm(false)
  }

  const handleOpenForm = (producer?: Producer) => {
    if (producer) {
      setEditingProducer(producer)
      setName(producer.name)
      setAddress(producer.address)
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
      const payload: CreateProducerDto = {
        name: name.trim(),
        address: address.trim(),
      }

      if (editingProducer) {
        await updateProducer(editingProducer.id, payload)
        alert("Cập nhật nhà sản xuất thành công!")
      } else {
        await createProducer(payload)
        alert("Tạo nhà sản xuất thành công!")
      }

      resetForm()
      await loadProducers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu nhà sản xuất")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nhà sản xuất này?")) {
      return
    }

    try {
      await deleteProducer(id)
      alert("Xóa nhà sản xuất thành công!")
      await loadProducers()
    } catch (err) {
      alert("Xóa thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Đang tải danh sách nhà sản xuất...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Nhà sản xuất</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý các nhà sản xuất trong hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Thêm nhà sản xuất
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingProducer ? "Sửa nhà sản xuất" : "Thêm nhà sản xuất mới"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên nhà sản xuất *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Công ty TNHH ABC"
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
                {saving ? "Đang lưu..." : editingProducer ? "Cập nhật" : "Tạo mới"}
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

      {/* Producers List */}
      {producers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Chưa có nhà sản xuất nào. Hãy thêm nhà sản xuất đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {producers.map((producer) => (
            <div
              key={producer.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{producer.name}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenForm(producer)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Sửa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(producer.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">{producer.address}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

