"use client"
import AuthGuard from "@/components/AuthGuard"
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSlider from '@/components/home/HeroSlider'
import ProductVus from '@/components/home/ProductVus'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import MapSection from '@/components/home/MapSection'
import NewsSection from '@/components/home/NewsSection'

export default function HomeLoggedInPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-white" suppressHydrationWarning>
        <Navbar />
        <main>
          <HeroSlider />
          <ProductVus />
          <FeaturedProducts />
          <MapSection />
          <NewsSection />
        </main>
        <Footer />
      </div>
    </AuthGuard>
  )
}
