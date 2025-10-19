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
        const data = await getProducts({ limit: 4 }) // Limit to 4 products for map section
        // Handle different response formats from API
        const productList = Array.isArray(data) ? data : (data as any)?.products || []
        setProducts(productList)
      } catch (err) {
        console.error('Failed to fetch products:', err)
        setError(err instanceof Error ? err.message : 'Không thể tải sản phẩm')
        setProducts([])
      } finally {
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
                      src={product.image || '/placeholder-product.jpg'}
                      alt={product.name || 'Sản phẩm'}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-2">{product.description}</p>
                    <p className="text-sm text-gray-500">
                      {product.category && `Danh mục: ${product.category}`}
                    </p>
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