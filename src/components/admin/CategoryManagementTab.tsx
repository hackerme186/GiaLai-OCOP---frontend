"use client"

import { useEffect, useState } from "react"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api"
import type { Category } from "@/lib/api"

export default function CategoryManagementTab() {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await getCategories()
      const list = Array.isArray(res)
        ? res
        : (res as any)?.items || (res as any)?.data || (res as any)?.categories || []
      // Sắp xếp theo ID tăng dần
      const sortedList = [...list].sort((a, b) => (a.id || 0) - (b.id || 0))
      setCategories(sortedList)
    } catch (err) {
      console.error('Failed to load categories:', err)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
    setShowModal(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({ 
      name: category.name || '', 
      description: category.description || '' 
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục')
      return
    }
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData)
        alert('Cập nhật danh mục thành công!')
      } else {
        await createCategory(formData)
        alert('Tạo danh mục thành công!')
      }
      setShowModal(false)
      loadCategories()
    } catch (err) {
      alert('Thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return
    try {
      await deleteCategory(id)
      alert('Xóa danh mục thành công!')
      loadCategories()
    } catch (err) {
      alert('Xóa thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'))
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Quản lý danh mục</h2>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:from-green-600 hover:to-green-700 text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm danh mục
        </button>
      </div>

      {/* List */}
      <div className="border rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có danh mục nào</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Tên danh mục</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Mô tả</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={category.id ?? `category-${index}`} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{category.id}</td>
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-gray-600">{category.description || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(category)} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCategory(null)
                    setFormData({ name: '', description: '' })
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-indigo-700 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  {editingCategory ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Cập nhật
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tạo mới
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

