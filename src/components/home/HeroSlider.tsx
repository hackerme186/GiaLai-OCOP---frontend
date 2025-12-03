"use client"
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { isValidImageUrl, getImageUrl, getImageAttributes } from '@/lib/imageUtils'

interface HeroSlide {
  id: number
  title: string
  subtitle: string
  description: string
  image: string
  textPosition: 'left' | 'right'
}

const STORAGE_KEY = "ocop_home_content"

const defaultSlides: HeroSlide[] = [
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
  const [slides, setSlides] = useState<HeroSlide[]>(defaultSlides)

  useEffect(() => {
    // Load slides from localStorage
    const loadSlides = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as { heroSlides?: HeroSlide[] }
          if (parsed.heroSlides && Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0) {
            setSlides(parsed.heroSlides)
          }
        }
      } catch (err) {
        console.error("Failed to load slides from storage:", err)
      }
    }

    loadSlides()

    // Listen for home content updates from admin
    const handleContentUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.heroSlides && Array.isArray(event.detail.heroSlides)) {
        setSlides(event.detail.heroSlides)
      }
    }

    window.addEventListener('homeContentUpdated' as any, handleContentUpdate as EventListener)
    return () => {
      window.removeEventListener('homeContentUpdated' as any, handleContentUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    if (slides.length === 0) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

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
            src={isValidImageUrl(slide.image) ? getImageUrl(slide.image) : '/hero.jpg'}
            alt={slide.title}
            fill
            className="object-cover"
            priority={index === 0}
            {...getImageAttributes(slide.image)}
            unoptimized
            sizes="100vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              if (!target.src.includes('hero.jpg')) {
                target.src = '/hero.jpg'
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className={`absolute inset-0 flex items-center ${
            slide.textPosition === 'right' ? 'justify-end pr-12' : 'justify-start pl-12'
          } p-12`}>
            <div className="text-white max-w-xl">
              <h1 className="text-5xl font-bold mb-2">{slide.title}</h1>
              <h2 className="text-4xl font-semibold mb-6">{slide.subtitle}</h2>
              <Link 
                href="/products"
                className="inline-block bg-green-600 text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-green-700 transition-colors"
              >
                {slide.description}
              </Link>
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