"use client"
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getProducts, Product } from '@/lib/api'

const STORAGE_KEY = "ocop_home_content"

const defaultTitle = 'Sản phẩm OCOP nổi bật'
const defaultDescription = 'Các sản phẩm đặc trưng từ Gia Lai và Bình Định'

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState(defaultDescription)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 Fetching products from API...')
        
        // ✅ FIX: Request only Approved products from backend
        const data = await getProducts({
          pageSize: 100, // Get all products
          status: "Approved", // ✅ Only get approved products from backend
        })
        
        console.log('📦 Raw API response:', data)
        console.log('📦 Is array?', Array.isArray(data))
        console.log('📦 Data length:', data?.length)
        
        // Backend should return array of products
        const productList = Array.isArray(data) ? data : (data as any)?.items || []
        
        console.log('📋 Product list:', productList)
        console.log('📋 Product list length:', productList.length)
        
        // ✅ Double-check: Filter again on client-side as safety measure
        const approvedProducts = productList.filter((p: Product) => {
          const isApproved = p.status === "Approved"
          if (!isApproved) {
            console.warn(`⚠️ Product ${p.id} (${p.name}) has status "${p.status}", not Approved. Filtered out.`)
          }
          return isApproved
        })
        
        console.log(`✅ Fetched ${approvedProducts.length} approved products from API`)
        console.log('✅ Approved products:', approvedProducts)
        
        // Display approved products (currently 2: ID 12 and 19)
        setProducts(approvedProducts.slice(0, 8))
        setLoading(false)
      } catch (err) {
        console.error('❌ Failed to fetch products from API:', err)
        console.error('❌ Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          raw: err
        })
        setError('Không thể tải sản phẩm từ server')
        setProducts([]) // Don't fallback to mock - show empty
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    // Load title and description from localStorage
    const loadContent = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as { featuredProductsTitle?: string; featuredProductsDescription?: string }
          if (parsed.featuredProductsTitle) setTitle(parsed.featuredProductsTitle)
          if (parsed.featuredProductsDescription) setDescription(parsed.featuredProductsDescription)
        }
      } catch (err) {
        console.error("Failed to load content from storage:", err)
      }
    }

    loadContent()

    // Listen for home content updates from admin
    const handleContentUpdate = (event: CustomEvent) => {
      if (event.detail) {
        if (event.detail.featuredProductsTitle) setTitle(event.detail.featuredProductsTitle)
        if (event.detail.featuredProductsDescription) setDescription(event.detail.featuredProductsDescription)
      }
    }

    window.addEventListener('homeContentUpdated' as any, handleContentUpdate as EventListener)
    return () => {
      window.removeEventListener('homeContentUpdated' as any, handleContentUpdate as EventListener)
    }
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 mb-8">{description}</p>
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Đang tải sản phẩm...</div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sản phẩm OCOP nổi bật
          </h2>
          <p className="text-gray-600 mb-8">Các sản phẩm đặc trưng từ Gia Lai và Bình Định</p>
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">Lỗi: {error}</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        <p className="text-gray-600 mb-8">{description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative h-64">
                {product.categoryName && (
                  <div className="absolute top-2 left-2 z-10 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {product.categoryName}
                  </div>
                )}
                {product.ocopRating && (
                  <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
                    ⭐ {product.ocopRating}
                  </div>
                )}
                <Image
                  src={product.imageUrl || '/hero.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-1 text-sm text-gray-600">
                    {product.averageRating?.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-bold text-lg">
                    {product.price?.toLocaleString('vi-VN')} ₫
                  </span>
                  <a 
                    href={`/products/${product.id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Xem chi tiết
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedProducts