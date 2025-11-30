"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import ImageUploader from "@/components/upload/ImageUploader"
import { uploadImage } from "@/lib/upload"
import { isValidImageUrl, getImageUrl, getImageAttributes } from "@/lib/imageUtils"

export interface NewsItem {
  id: number
  title: string
  date: string
  description: string
  image: string
}

const STORAGE_KEY = "ocop_news_items"

export default function NewsManagementTab() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [formData, setFormData] = useState<Partial<NewsItem>>({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as NewsItem[]
        setNews(parsed)
      } else {
        // Default news items
        const defaultNews: NewsItem[] = [
          {
            id: 1,
            title: 'Cà phê Gia Lai được công nhận Top 10 sản phẩm OCOP tiêu biểu',
            date: '12/10/2023',
            description: 'Sản phẩm cà phê Gia Lai đạt chứng nhận 4 sao trong chương trình OCOP quốc gia',
            image: '/coffee gia lai.jpg'
          },
          {
            id: 2,
            title: 'Bánh tráng Bình Định - Hương vị truyền thống được bảo tồn',
            date: '11/10/2023',
            description: 'Làng nghề bánh tráng An Thái được công nhận là di sản văn hóa phi vật thể',
            image: '/hero.jpg'
          },
          {
            id: 3,
            title: 'Phát triển bền vững các sản phẩm OCOP tại Tây Nguyên',
            date: '10/10/2023',
            description: 'Chiến lược phát triển và quảng bá sản phẩm OCOP vùng Tây Nguyên',
            image: '/hero.jpg'
          }
        ]
        setNews(defaultNews)
        saveNews(defaultNews)
      }
    } catch (err) {
      console.error("Failed to load news:", err)
      setNews([])
    }
  }

  const saveNews = (newsToSave: NewsItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newsToSave))
      // Also update the NewsSection component by dispatching a custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('newsUpdated', { detail: newsToSave }))
      }
    } catch (err) {
      console.error("Failed to save news:", err)
    }
  }

  const handleCreate = () => {
    setEditingNews(null)
    setFormData({
      title: '',
      date: new Date().toLocaleDateString('vi-VN'),
      description: '',
      image: '/hero.jpg'
    })
    setImagePreview(null)
    setShowModal(true)
  }

  const handleEdit = (newsItem: NewsItem) => {
    setEditingNews(newsItem)
    setFormData({
      title: newsItem.title,
      date: newsItem.date,
      description: newsItem.description,
      image: newsItem.image
    })
    setImagePreview(newsItem.image)
    setShowModal(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa tin tức này?')) {
      const updated = news.filter(item => item.id !== id)
      setNews(updated)
      saveNews(updated)
    }
  }

  const handleImageUpload = async (imageUrl: string) => {
    setUploadingImage(true)
    try {
      setFormData({ ...formData, image: imageUrl })
      setImagePreview(imageUrl)
    } catch (err) {
      console.error("Error setting image:", err)
      alert("Có lỗi xảy ra khi cập nhật ảnh. Vui lòng thử lại.")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = () => {
    if (!formData.title || !formData.description || !formData.date) {
      alert("Vui lòng điền đầy đủ thông tin")
      return
    }

    if (editingNews) {
      // Update existing
      const updated = news.map(item =>
        item.id === editingNews.id
          ? { ...item, ...formData, image: formData.image || item.image } as NewsItem
          : item
      )
      setNews(updated)
      saveNews(updated)
    } else {
      // Create new
      const newId = Math.max(...news.map(n => n.id), 0) + 1
      const newNews: NewsItem = {
        id: newId,
        title: formData.title!,
        date: formData.date!,
        description: formData.description!,
        image: formData.image || '/hero.jpg'
      }
      const updated = [...news, newNews]
      setNews(updated)
      saveNews(updated)
    }

    setShowModal(false)
    setEditingNews(null)
    setFormData({})
    setImagePreview(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Tin tức</h2>
          <p className="text-gray-600 mt-1">Quản lý các tin tức hiển thị trên trang chủ</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm tin tức mới
        </button>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chưa có tin tức nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-200"
            >
              <div className="relative h-48 bg-gray-200">
                {isValidImageUrl(item.image) && (
                  <Image
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    fill
                    className="object-cover"
                    {...getImageAttributes(item.image)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                )}
                {!isValidImageUrl(item.image) && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.date}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingNews ? "Chỉnh sửa tin tức" : "Thêm tin tức mới"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingNews(null)
                  setFormData({})
                  setImagePreview(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nhập tiêu đề tin tức"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Ngày đăng</label>
                <input
                  type="text"
                  value={formData.date || ""}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="VD: 12/10/2023"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Mô tả</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nhập mô tả tin tức"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Ảnh</label>
                
                {/* Image Preview */}
                {imagePreview && isValidImageUrl(imagePreview) && (
                  <div className="mb-3 flex items-center gap-4">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-200">
                      <Image
                        src={getImageUrl(imagePreview)}
                        alt="Preview"
                        fill
                        className="object-cover"
                        {...getImageAttributes(imagePreview)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null)
                        setFormData({ ...formData, image: '' })
                      }}
                      className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                )}

                {/* Image Uploader */}
                <div className="mb-3">
                  <ImageUploader
                    folder="GiaLaiOCOP/Images"
                    onUploaded={handleImageUpload}
                    currentImageUrl={imagePreview || undefined}
                    disabled={uploadingImage}
                    placeholder="Chọn ảnh cho tin tức..."
                    maxPreviewSize={200}
                    showRemoveButton={false}
                  />
                </div>

                {/* Manual URL Input */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hoặc nhập URL ảnh (tùy chọn)</label>
                  <input
                    type="url"
                    value={formData.image || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value })
                      setImagePreview(e.target.value || null)
                    }}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingNews(null)
                  setFormData({})
                  setImagePreview(null)
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all"
              >
                {editingNews ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

