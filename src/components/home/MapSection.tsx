"use client"
import Image from 'next/image'

const products = [
  {
    id: 1,
    name: 'Cà phê Gia Lai - Vùng đất Tây Nguyên',
    date: '12/10/2023',
    description: 'Vùng trồng: Pleiku, Gia Lai',
    image: '/products/coffee-region.jpg'
  },
  {
    id: 2,
    name: 'Tiêu Gia Lai - Đặc sản Tây Nguyên',
    date: '11/10/2023',
    description: 'Vùng trồng: Chư Sê, Gia Lai',
    image: '/products/pepper-region.jpg'
  },
  {
    id: 3,
    name: 'Nem chợ Huyện - Đặc sản Bình Định',
    date: '10/10/2023',
    description: 'Xuất xứ: An Nhơn, Bình Định',
    image: '/products/nem-region.jpg'
  },
  {
    id: 4,
    name: 'Rượu Bàu Đá - Di sản Bình Định',
    date: '09/10/2023',
    description: 'Làng nghề: Bàu Đá, Bình Định',
    image: '/products/ruou-region.jpg'
  }
]

const MapSection = () => {
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
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center space-x-6 bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{product.description}</p>
                  <p className="text-sm text-gray-500">{product.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MapSection