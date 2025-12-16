"use client"
import { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { getProducts, Product, searchMap, type EnterpriseMapDto } from '@/lib/api'

// Dynamic import để tránh SSR issues với Leaflet
const Minimap = dynamic(() => import('./Minimap'), {
  ssr: false,
  loading: () => (
    <div className="relative h-[600px] bg-green-50 rounded-lg overflow-hidden flex items-center justify-center border-2 border-gray-200">
      <div className="text-gray-500">Đang tải bản đồ...</div>
    </div>
  ),
})

const STORAGE_KEY = "ocop_home_content"
const defaultTitle = 'Sản phẩm OCOP theo vùng miền'

const MapSection = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [enterprises, setEnterprises] = useState<EnterpriseMapDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch products
        try {
          // Use silent mode to reduce console errors when backend is unavailable
          const productData = await getProducts({ 
            pageSize: 100,
            status: "Approved",
            silent: true, // Silent mode - don't spam console with errors
          })
          
          const productList = Array.isArray(productData) ? productData : []
          const approvedProducts = productList.filter((p: Product) => p.status === "Approved")
          
          // Display first 4 approved products
          setProducts(approvedProducts.slice(0, 4))
        } catch (productErr) {
          // Only log error if not in silent mode
          const isSilent = (productErr as any)?.silent
          if (!isSilent) {
            console.warn('Failed to fetch products for map section:', productErr)
          }
          setProducts([])
          // Check if it's a network error
          const isNetworkError = (productErr as any)?.isNetworkError || (productErr as any)?.status === 0
          if (isNetworkError && !isSilent) {
            setError('Backend đang khởi động. Vui lòng đợi vài giây rồi tải lại trang.')
          }
        }
        
        // Fetch enterprises for map (chỉ lấy các doanh nghiệp đã được duyệt)
        try {
          let enterpriseData: EnterpriseMapDto[] = []
          
          // Thử gọi API với pageSize = 100 (giống như map page sử dụng)
          // Use silent mode to reduce console errors when backend is unavailable
          try {
            enterpriseData = await searchMap({
              pageSize: 100,
              silent: true, // Silent mode - don't spam console with errors
            })
          } catch (err) {
            // Nếu lỗi, thử gọi không có tham số
            try {
              enterpriseData = await searchMap({
                silent: true, // Silent mode
              })
            } catch (err2) {
              // Silent mode - don't log or throw, just set empty array
              enterpriseData = []
            }
          }
          
          const enterpriseList = Array.isArray(enterpriseData) ? enterpriseData : []
          
          // Lọc chỉ lấy các enterprises có tọa độ hợp lệ
          // Backend thường chỉ trả về các enterprises đã được approved
          const validEnterprises = enterpriseList.filter(
            (e) => e.latitude && e.longitude && 
            e.latitude >= -90 && e.latitude <= 90 && 
            e.longitude >= -180 && e.longitude <= 180
          )
          
          console.log(`✅ Map section: ${validEnterprises.length} enterprises với tọa độ hợp lệ`)
          setEnterprises(validEnterprises)
        } catch (mapErr) {
          console.warn('Failed to fetch enterprises for map:', mapErr)
          // Don't set error, just show empty map
          setEnterprises([])
        }
        
        setLoading(false)
      } catch (err) {
        // Only log error if not in silent mode
        const isSilent = (err as any)?.silent
        if (!isSilent) {
          console.error('❌ Failed to fetch data:', err)
        }
        
        // Check if it's a network error (backend not available)
        const isNetworkError = (err as any)?.isNetworkError || (err as any)?.status === 0
        const errorMessage = isNetworkError 
          ? 'Backend đang khởi động. Vui lòng đợi vài giây rồi tải lại trang.'
          : 'Không thể tải dữ liệu'
        
        // Only set error if not silent (to avoid showing error message for non-critical requests)
        if (!isSilent) {
          setError(errorMessage)
        }
        setProducts([])
        setEnterprises([])
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Load title and description from localStorage
    const loadContent = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as { mapSectionTitle?: string; mapSectionDescription?: string }
          if (parsed.mapSectionTitle) setTitle(parsed.mapSectionTitle)
          if (parsed.mapSectionDescription !== undefined) setDescription(parsed.mapSectionDescription)
        }
      } catch (err) {
        console.error("Failed to load content from storage:", err)
      }
    }

    loadContent()

    // Listen for home content updates from admin
    const handleContentUpdate = (event: CustomEvent) => {
      if (event.detail) {
        if (event.detail.mapSectionTitle) setTitle(event.detail.mapSectionTitle)
        if (event.detail.mapSectionDescription !== undefined) setDescription(event.detail.mapSectionDescription)
      }
    }

    window.addEventListener('homeContentUpdated' as any, handleContentUpdate as EventListener)
    return () => {
      window.removeEventListener('homeContentUpdated' as any, handleContentUpdate as EventListener)
    }
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {title}
          </h2>
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Đang tải sản phẩm...</div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {title}
          </h2>
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">Lỗi: {error}</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-gray-600 mb-8">{description}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Minimap */}
          <div className="relative">
            <Minimap enterprises={enterprises} height="600px" />
          </div>

          {/* Product List */}
          <div className="space-y-6">
            {products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center space-x-6 bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <Image
                      src={product.imageUrl || '/hero.jpg'}
                      alt={product.name || 'Sản phẩm'}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {product.name}
                      </h3>
                      {product.ocopRating && (
                        <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          ⭐ {product.ocopRating}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-3 text-sm">
                      {product.categoryName && (
                        <span className="text-gray-500">
                          📂 {product.categoryName}
                        </span>
                      )}
                      {product.price && (
                        <span className="text-green-600 font-bold">
                          {product.price.toLocaleString('vi-VN')} ₫
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-8">
                Không có sản phẩm nào
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MapSection