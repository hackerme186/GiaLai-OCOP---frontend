"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSlider from '@/components/home/HeroSlider'
import ProductVus from '@/components/home/ProductVus'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import MapSection from '@/components/home/MapSection'
import NewsSection from '@/components/home/NewsSection'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/home')
    }
  }, [router])

  if (isLoggedIn()) return null

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <Header />
      <main>
        <HeroSlider />
        <ProductVus />
        <FeaturedProducts />
        <MapSection />
        <NewsSection />
      </main>
      <Footer />
    </div>
  )
}