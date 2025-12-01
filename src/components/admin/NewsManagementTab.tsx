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
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📰 Quản lý Tin tức</h2>
            <p className="text-white/90 text-lg">Quản lý các tin tức hiển thị trên trang chủ</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm tin tức mới
          </button>
        </div>
      </div>

      {news.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
          <div className="text-center">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-gray-500 font-medium text-lg mb-2">Chưa có tin tức nào</p>
            <p className="text-gray-400 text-sm">Nhấn "Thêm tin tức mới" để bắt đầu</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-cyan-300 transform hover:-translate-y-1"
              style={{
                animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
              }}
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
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {item.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-full border border-cyan-200">{item.date}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-indigo-600 px-8 py-6 flex items-center justify-between shadow-lg -m-8 mb-0 rounded-t-2xl">
              <h3 className="text-2xl font-bold text-white">
                {editingNews ? "✏️ Chỉnh sửa tin tức" : "➕ Thêm tin tức mới"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingNews(null)
                  setFormData({})
                  setImagePreview(null)
                }}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="pt-8">

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border-2 border-cyan-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all font-semibold"
                  placeholder="Nhập tiêu đề tin tức..."
                />
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Ngày đăng</label>
                <input
                  type="text"
                  value={formData.date || ""}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-semibold"
                  placeholder="VD: 12/10/2023"
                />
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Mô tả</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-y"
                  placeholder="Nhập mô tả tin tức..."
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

              <div className="flex gap-3 mt-8 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingNews(null)
                    setFormData({})
                    setImagePreview(null)
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {editingNews ? "💾 Cập nhật" : "➕ Tạo mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

