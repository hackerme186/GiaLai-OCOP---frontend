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
      image: '/coffee gia lai.jpg',
      textPosition: 'left'
    },
    {
      id: 2,
      title: 'Đặc sản Bình Định',
      subtitle: 'Nem chợ Huyện - Bánh tráng An Thái',
      description: 'Xem thêm',
      image: '/nem chua cho huyen.png',
      textPosition: 'right'
    },
    {
      id: 3,
      title: 'Hạt điều - Tiêu Gia Lai',
      subtitle: 'Vị ngon đậm đà',
      description: 'Mua ngay',
      image: '/hat dieu - tieu.png',
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Trang chủ</h2>
          <p className="text-gray-600 mt-1">Chỉnh sửa toàn bộ nội dung hiển thị trên trang chủ</p>
        </div>
        <button
          onClick={handleSaveContent}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Lưu tất cả thay đổi
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('hero')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeSection === 'hero'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🎬 Hero Slider
        </button>
        <button
          onClick={() => setActiveSection('featured')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeSection === 'featured'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          ⭐ Sản phẩm nổi bật
        </button>
        <button
          onClick={() => setActiveSection('map')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeSection === 'map'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🗺️ Bản đồ vùng miền
        </button>
      </div>

      {/* Hero Slider Section */}
      {activeSection === 'hero' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Quản lý Hero Slider</h3>
            <button
              onClick={handleCreateSlide}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm slide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.heroSlides.map((slide) => (
              <div
                key={slide.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
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
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{slide.title}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{slide.subtitle}</p>
                  <p className="text-xs text-gray-500 mb-3">{slide.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Vị trí: {slide.textPosition === 'left' ? 'Trái' : 'Phải'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSlide(slide)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products Section */}
      {activeSection === 'featured' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Sản phẩm nổi bật</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Tiêu đề</label>
              <input
                type="text"
                value={content.featuredProductsTitle}
                onChange={(e) => setContent({ ...content, featuredProductsTitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nhập tiêu đề"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Mô tả</label>
              <textarea
                value={content.featuredProductsDescription}
                onChange={(e) => setContent({ ...content, featuredProductsDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nhập mô tả"
              />
            </div>
          </div>
        </div>
      )}

      {/* Map Section */}
      {activeSection === 'map' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Bản đồ vùng miền</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Tiêu đề</label>
              <input
                type="text"
                value={content.mapSectionTitle}
                onChange={(e) => setContent({ ...content, mapSectionTitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nhập tiêu đề"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Mô tả (tùy chọn)</label>
              <textarea
                value={content.mapSectionDescription || ''}
                onChange={(e) => setContent({ ...content, mapSectionDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nhập mô tả"
              />
            </div>
          </div>
        </div>
      )}

      {/* Slide Create/Edit Modal */}
      {showSlideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingSlide ? "Chỉnh sửa slide" : "Thêm slide mới"}
              </h3>
              <button
                onClick={() => {
                  setShowSlideModal(false)
                  setEditingSlide(null)
                  setSlideFormData({})
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tiêu đề chính</label>
                <input
                  type="text"
                  value={slideFormData.title || ""}
                  onChange={(e) => setSlideFormData({ ...slideFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="VD: Cà Phê Gia Lai"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tiêu đề phụ</label>
                <input
                  type="text"
                  value={slideFormData.subtitle || ""}
                  onChange={(e) => setSlideFormData({ ...slideFormData, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="VD: Tinh hoa đất Tây Nguyên"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nút hành động</label>
                <input
                  type="text"
                  value={slideFormData.description || ""}
                  onChange={(e) => setSlideFormData({ ...slideFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="VD: Khám phá ngay"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Vị trí text</label>
                <select
                  value={slideFormData.textPosition || 'left'}
                  onChange={(e) => setSlideFormData({ ...slideFormData, textPosition: e.target.value as 'left' | 'right' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="left">Trái</option>
                  <option value="right">Phải</option>
                </select>
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
                        setSlideFormData({ ...slideFormData, image: '' })
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
                    placeholder="Chọn ảnh cho slide..."
                    maxPreviewSize={200}
                    showRemoveButton={false}
                  />
                </div>

                {/* Manual URL Input */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hoặc nhập URL ảnh (tùy chọn)</label>
                  <input
                    type="url"
                    value={slideFormData.image || ""}
                    onChange={(e) => {
                      setSlideFormData({ ...slideFormData, image: e.target.value })
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
                  setShowSlideModal(false)
                  setEditingSlide(null)
                  setSlideFormData({})
                  setImagePreview(null)
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSlide}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all"
              >
                {editingSlide ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
