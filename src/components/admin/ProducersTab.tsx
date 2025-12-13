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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">🏭 Quản lý Nhà sản xuất</h2>
            <p className="text-white/90 text-lg">Quản lý các nhà sản xuất trong hệ thống OCOP Gia Lai</p>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm nhà sản xuất mới
          </button>
        </div>
      </div>

      {/* Error Message (outside form) */}
      {error && !showForm && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">Lỗi</h3>
              <p className="text-red-700 font-semibold">{error}</p>
              <button
                onClick={loadProducers}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Thử lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600 mb-4" />
            <p className="text-gray-600 font-medium">Đang tải danh sách nhà sản xuất...</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-md">
              <span className="text-2xl">🏭</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {editingProducer ? "Sửa nhà sản xuất" : "Thêm nhà sản xuất mới"}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border-2 border-slate-200">
              <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                Tên nhà sản xuất *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Công ty TNHH ABC"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all font-semibold"
              />
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-zinc-50 rounded-xl p-6 border-2 border-gray-200">
              <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                Địa chỉ *
              </label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={4}
                placeholder="Nhập địa chỉ chi tiết"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all resize-y"
              />
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-600 to-gray-600 text-white rounded-xl hover:from-slate-700 hover:to-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {saving ? "Đang lưu..." : editingProducer ? "💾 Cập nhật" : "➕ Tạo mới"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Producers List */}
      {!loading && (
        <>
          {producers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
              <div className="text-center">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-500 font-medium text-lg mb-2">Chưa có nhà sản xuất nào</p>
                <p className="text-gray-400 text-sm">Hãy thêm nhà sản xuất đầu tiên!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {producers.map((producer, index) => (
                <div
                  key={producer.id}
                  className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-md">
                          <span className="text-xl">🏭</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{producer.name}</h3>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{producer.address}</p>
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleOpenForm(producer)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold"
                      title="Sửa"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(producer.id)}
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
        </>
      )}
    </div>
  )
}

