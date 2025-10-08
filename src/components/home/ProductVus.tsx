"use client"
import { useState } from 'react'
import Image from 'next/image'

const products = [
  {
    id: 1,
    title: 'Cà phê Gia Lai Premium',
    description: 'Hương vị đậm đà, độc đáo',
    image: '/products/coffee-premium.jpg'
  },
  {
    id: 2,
    title: 'Tiêu Gia Lai Organic',
    description: 'Hạt tiêu hữu cơ chất lượng cao',
    image: '/products/pepper-organic.jpg'
  },
  {
    id: 3,
    title: 'Mắc khén Gia Lai',
    description: 'Gia vị đặc trưng Tây Nguyên',
    image: '/products/mackhen.jpg'
  },
  {
    id: 4,
    title: 'Nem chợ Huyện Bình Định',
    description: 'Đặc sản truyền thống',
    image: '/products/nem-binhdinh.jpg'
  },
  {
    id: 5,
    title: 'Bánh tráng nướng Bình Định',
    description: 'Món ăn vặt được yêu thích',
    image: '/products/banhtrang-nuong.jpg'
  },
  {
    id: 6,
    title: 'Rượu Bàu Đá',
    description: 'Đặc sản nổi tiếng Bình Định',
    image: '/products/ruou-bauda.jpg'
  }
]

const ProductVus = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(products.length / 4))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? Math.ceil(products.length / 4) - 1 : prev - 1
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Sản phẩm nổi bật</h2>
        
        <div className="relative">
          <div className="flex overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 flex-shrink-0 px-4"
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative h-56">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {product.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {product.description}
                      </p>
                      <button className="text-green-600 font-medium hover:text-green-700">
                        Xem chi tiết →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-lg hover:bg-white"
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-lg hover:bg-white"
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProductVus