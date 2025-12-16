"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import ImageUploader from "@/components/upload/ImageUploader"
import { isValidImageUrl, getImageUrl, getImageAttributes } from "@/lib/imageUtils"

interface HeroSlide {
  id: number
  title: string
  subtitle: string
  description: string
  image: string
  textPosition: 'left' | 'right'
}

interface HomeContent {
  heroSlides: HeroSlide[]
  featuredProductsTitle: string
  featuredProductsDescription: string
  mapSectionTitle: string
  mapSectionDescription?: string
}

const STORAGE_KEY = "ocop_home_content"

const defaultContent: HomeContent = {
  heroSlides: [
    {
      id: 1,
      title: 'Cà Phê Gia Lai',
      subtitle: 'Tinh hoa đất Tây Nguyên',
      description: 'Khám phá ngay',
      image: '/coffee-gia-lai.jpg',
      textPosition: 'left'
    },
    {
      id: 2,
      title: 'Đặc sản Bình Định',
      subtitle: 'Nem chợ Huyện - Bánh tráng An Thái',
      description: 'Xem thêm',
      image: '/nem-chua-cho-huyen.png',
      textPosition: 'right'
    },
    {
      id: 3,
      title: 'Hạt điều - Tiêu Gia Lai',
      subtitle: 'Vị ngon đậm đà',
      description: 'Mua ngay',
      image: '/hat-dieu-tieu.png',
      textPosition: 'left'
    }
  ],
  featuredProductsTitle: 'Sản phẩm OCOP nổi bật',
  featuredProductsDescription: 'Các sản phẩm đặc trưng từ Gia Lai và Bình Định',
  mapSectionTitle: 'Sản phẩm OCOP theo vùng miền',
  mapSectionDescription: ''
}

export default function HomeManagementTab() {
  const [content, setContent] = useState<HomeContent>(defaultContent)
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'hero' | 'featured' | 'map'>('hero')
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [showSlideModal, setShowSlideModal] = useState(false)
  const [slideFormData, setSlideFormData] = useState<Partial<HeroSlide>>({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as HomeContent
        setContent(parsed)
      } else {
        setContent(defaultContent)
        saveContent(defaultContent)
      }
    } catch (err) {
      console.error("Failed to load home content:", err)
      setContent(defaultContent)
    }
  }

  const saveContent = (contentToSave: HomeContent) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contentToSave))
      // Dispatch event to update home page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('homeContentUpdated', { detail: contentToSave }))
      }
    } catch (err) {
      console.error("Failed to save home content:", err)
    }
  }

  const handleSaveContent = () => {
    saveContent(content)
    alert("Đã lưu thay đổi thành công!")
  }

  // Hero Slides Management
  const handleCreateSlide = () => {
    setEditingSlide(null)
    setSlideFormData({
      title: '',
      subtitle: '',
      description: '',
      image: '/hero.jpg',
      textPosition: 'left'
    })
    setImagePreview(null)
    setShowSlideModal(true)
  }

  const handleEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setSlideFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      image: slide.image,
      textPosition: slide.textPosition
    })
    setImagePreview(slide.image)
    setShowSlideModal(true)
  }

  const handleDeleteSlide = (id: number) => {
    if (content.heroSlides.length <= 1) {
      alert("Phải có ít nhất 1 slide")
      return
    }
    if (confirm('Bạn có chắc chắn muốn xóa slide này?')) {
      const updated = {
        ...content,
        heroSlides: content.heroSlides.filter(s => s.id !== id)
      }
      setContent(updated)
      saveContent(updated)
    }
  }

  const handleImageUpload = async (imageUrl: string) => {
    setUploadingImage(true)
    try {
      setSlideFormData({ ...slideFormData, image: imageUrl })
      setImagePreview(imageUrl)
    } catch (err) {
      console.error("Error setting image:", err)
      alert("Có lỗi xảy ra khi cập nhật ảnh. Vui lòng thử lại.")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveSlide = () => {
    if (!slideFormData.title || !slideFormData.subtitle || !slideFormData.description) {
      alert("Vui lòng điền đầy đủ thông tin")
      return
    }

    if (editingSlide) {
      // Update existing
      const updated = {
        ...content,
        heroSlides: content.heroSlides.map(slide =>
          slide.id === editingSlide.id
            ? { ...slide, ...slideFormData, image: slideFormData.image || slide.image } as HeroSlide
            : slide
        )
      }
      setContent(updated)
      saveContent(updated)
    } else {
      // Create new
      const newId = Math.max(...content.heroSlides.map(s => s.id), 0) + 1
      const newSlide: HeroSlide = {
        id: newId,
        title: slideFormData.title!,
        subtitle: slideFormData.subtitle!,
        description: slideFormData.description!,
        image: slideFormData.image || '/hero.jpg',
        textPosition: (slideFormData.textPosition || 'left') as 'left' | 'right'
      }
      const updated = {
        ...content,
        heroSlides: [...content.heroSlides, newSlide]
      }
      setContent(updated)
      saveContent(updated)
    }

    setShowSlideModal(false)
    setEditingSlide(null)
    setSlideFormData({})
    setImagePreview(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">🏠 Quản lý Trang chủ</h2>
            <p className="text-white/90 text-lg">Chỉnh sửa toàn bộ nội dung hiển thị trên trang chủ</p>
          </div>
          <button
            onClick={handleSaveContent}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Lưu tất cả thay đổi
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection('hero')}
            className={`flex-1 px-6 py-3 font-semibold transition-all rounded-xl ${
              activeSection === 'hero'
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🎬 Hero Slider
          </button>
          <button
            onClick={() => setActiveSection('featured')}
            className={`flex-1 px-6 py-3 font-semibold transition-all rounded-xl ${
              activeSection === 'featured'
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            ⭐ Sản phẩm nổi bật
          </button>
          <button
            onClick={() => setActiveSection('map')}
            className={`flex-1 px-6 py-3 font-semibold transition-all rounded-xl ${
              activeSection === 'map'
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🗺️ Bản đồ vùng miền
          </button>
        </div>
      </div>

      {/* Hero Slider Section */}
      {activeSection === 'hero' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900">Quản lý Hero Slider</h3>
            <p className="text-sm text-gray-600 mt-2">Chỉnh sửa nội dung text của các slide. Ảnh banner được quản lý bởi developer.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 hover:shadow-xl hover:border-violet-300 transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="relative h-48 bg-gray-200">
                  {isValidImageUrl(slide.image) && (
                    <Image
                      src={getImageUrl(slide.image)}
                      alt={slide.title}
                      fill
                      className="object-cover"
                      {...getImageAttributes(slide.image)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  )}
                  {!isValidImageUrl(slide.image) && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{slide.title}</h4>
                  <p className="text-sm font-semibold text-gray-600 mb-2 line-clamp-1">{slide.subtitle}</p>
                  <p className="text-xs text-gray-500 mb-4">{slide.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-200">
                      Vị trí: {slide.textPosition === 'left' ? '⬅️ Trái' : '➡️ Phải'}
                    </span>
                    <button
                      onClick={() => handleEditSlide(slide)}
                      className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-sm"
                      title="Chỉnh sửa nội dung text (không thể thay đổi ảnh)"
                    >
                      ✏️ Sửa nội dung
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products Section */}
      {activeSection === 'featured' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Sản phẩm nổi bật</h3>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Tiêu đề</label>
                <input
                  type="text"
                  value={content.featuredProductsTitle}
                  onChange={(e) => setContent({ ...content, featuredProductsTitle: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all font-semibold"
                  placeholder="Nhập tiêu đề"
                />
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-6 border-2 border-purple-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Mô tả</label>
                <textarea
                  value={content.featuredProductsDescription}
                  onChange={(e) => setContent({ ...content, featuredProductsDescription: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-y"
                  placeholder="Nhập mô tả"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Section */}
      {activeSection === 'map' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Bản đồ vùng miền</h3>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Tiêu đề</label>
                <input
                  type="text"
                  value={content.mapSectionTitle}
                  onChange={(e) => setContent({ ...content, mapSectionTitle: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all font-semibold"
                  placeholder="Nhập tiêu đề"
                />
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-6 border-2 border-purple-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Mô tả (tùy chọn)</label>
                <textarea
                  value={content.mapSectionDescription || ''}
                  onChange={(e) => setContent({ ...content, mapSectionDescription: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-y"
                  placeholder="Nhập mô tả"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide Create/Edit Modal */}
      {showSlideModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6 flex items-center justify-between shadow-lg -m-8 mb-0 rounded-t-2xl">
              <h3 className="text-2xl font-bold text-white">
                {editingSlide ? "✏️ Chỉnh sửa slide" : "➕ Thêm slide mới"}
              </h3>
              <button
                onClick={() => {
                  setShowSlideModal(false)
                  setEditingSlide(null)
                  setSlideFormData({})
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
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Tiêu đề chính</label>
                <input
                  type="text"
                  value={slideFormData.title || ""}
                  onChange={(e) => setSlideFormData({ ...slideFormData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all font-semibold"
                  placeholder="VD: Cà Phê Gia Lai"
                />
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-6 border-2 border-purple-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Tiêu đề phụ</label>
                <input
                  type="text"
                  value={slideFormData.subtitle || ""}
                  onChange={(e) => setSlideFormData({ ...slideFormData, subtitle: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-semibold"
                  placeholder="VD: Tinh hoa đất Tây Nguyên"
                />
              </div>

              <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-xl p-6 border-2 border-fuchsia-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Nút hành động</label>
                <input
                  type="text"
                  value={slideFormData.description || ""}
                  onChange={(e) => setSlideFormData({ ...slideFormData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 transition-all font-semibold"
                  placeholder="VD: Khám phá ngay"
                />
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Vị trí text</label>
                <select
                  value={slideFormData.textPosition || 'left'}
                  onChange={(e) => setSlideFormData({ ...slideFormData, textPosition: e.target.value as 'left' | 'right' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all bg-white cursor-pointer font-semibold"
                >
                  <option value="left">⬅️ Trái</option>
                  <option value="right">➡️ Phải</option>
                </select>
              </div>

              {/* Image Preview Only - No Upload */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Ảnh Banner</label>
                {slideFormData.image && isValidImageUrl(slideFormData.image) && (
                  <div className="flex items-center gap-4">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-200">
                      <Image
                        src={getImageUrl(slideFormData.image)}
                        alt="Banner Preview"
                        fill
                        className="object-cover"
                        {...getImageAttributes(slideFormData.image)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">Ảnh hiện tại</p>
                      <p className="text-xs text-gray-500 break-all">{slideFormData.image}</p>
                      <p className="text-xs text-amber-600 mt-2">⚠️ Chỉ developer mới có thể thay đổi ảnh banner</p>
                    </div>
                  </div>
                )}
                {!slideFormData.image && (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Chưa có ảnh</p>
                  </div>
                )}
              </div>
            </div>

              <div className="flex gap-3 mt-8 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => {
                    setShowSlideModal(false)
                    setEditingSlide(null)
                    setSlideFormData({})
                    setImagePreview(null)
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveSlide}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {editingSlide ? "💾 Cập nhật" : "➕ Tạo mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
