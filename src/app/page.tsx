"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSlider from '@/components/home/HeroSlider'
import ProductVus from '@/components/home/ProductVus'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import MapSection from '@/components/home/MapSection'
import NewsSection from '@/components/home/NewsSection'

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [userLoggedIn, setUserLoggedIn] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkAuthStatus = async () => {
      const authStatus = await isLoggedIn()
      setUserLoggedIn(authStatus)
      
      // If user is logged in, redirect to /home
      if (authStatus && status !== "loading") {
        router.replace('/home')
      }
    }

    if (status === "authenticated") {
      setUserLoggedIn(true)
      router.replace('/home')
    } else if (status === "unauthenticated") {
      checkAuthStatus()
    }
  }, [router, status, session])

  // Show loading while checking authentication
  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  // If user is logged in, don't show this page (they'll be redirected)
  if (userLoggedIn) {
    return null
  }

  // Show homepage for users who are not logged in
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