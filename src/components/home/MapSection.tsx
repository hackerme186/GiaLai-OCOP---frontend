"use client"
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getProducts, Product } from '@/lib/api'

const MapSection = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get ALL products from database
        const data = await getProducts({ 
          pageSize: 100, // Get all products
        })
        
        // Backend returns array of products
        const productList = Array.isArray(data) ? data : []
        
        // FILTER: Only show products with status = "Approved"
        const approvedProducts = productList.filter((p: Product) => 
          p.status === "Approved"
        )
        
        console.log(`✅ Map section: ${approvedProducts.length} approved products`)
        
        // Display first 4 approved products
        setProducts(approvedProducts.slice(0, 4))
        setLoading(false)
      } catch (err) {
        console.error('❌ Failed to fetch products for map:', err)
        setError('Không thể tải sản phẩm')
        setProducts([]) // Don't fallback to mock - show empty
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])
  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Sản phẩm OCOP theo vùng miền
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
            Sản phẩm OCOP theo vùng miền
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
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Sản phẩm OCOP theo vùng miền
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Map */}
          <div className="relative h-[600px] bg-green-50 rounded-lg overflow-hidden">
            <Image
              src="/vietnam-map.png"
              alt="Vietnam Map"
              fill
              className="object-contain p-8"
            />
            {/* Highlight regions */}
            <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-green-500/20 rounded-full animate-pulse" />
            <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-green-500/20 rounded-full animate-pulse" />
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