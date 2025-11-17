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
      setCategories(list)
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
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
        >
          + Thêm danh mục
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
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(category)} 
                      className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium"
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)} 
                      className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium"
                    >
                      Xóa
                    </button>
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
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCategory(null)
                    setFormData({ name: '', description: '' })
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {editingCategory ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

