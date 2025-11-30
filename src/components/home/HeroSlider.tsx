"use client"
import { useState, useEffect } from 'react'
import Image from 'next/image'

const slides = [
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
]

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative h-[600px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority={index === 0}
            unoptimized
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className={`absolute inset-0 flex items-center ${
            slide.textPosition === 'right' ? 'justify-end pr-12' : 'justify-start pl-12'
          } p-12`}>
            <div className="text-white max-w-xl">
              <h1 className="text-5xl font-bold mb-2">{slide.title}</h1>
              <h2 className="text-4xl font-semibold mb-6">{slide.subtitle}</h2>
              <button className="bg-green-600 text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-green-700 transition-colors">
                {slide.description}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Slider Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-4 h-4 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default HeroSlider