"use client"
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUserProfile, isLoggedIn, logout } from '@/lib/auth'
import { getCurrentUser } from '@/lib/api'
import { useCart } from '@/lib/cart-context'
import { FormEvent, useEffect, useState } from 'react'
import UserDropdown from '@/components/UserDropdown'

const Navbar = () => {
  const router = useRouter()
  const { cart } = useCart()
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [profile, setProfile] = useState(getUserProfile() || {})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkAuthStatus = async () => {
      const authStatus = await isLoggedIn()
      setLoggedIn(authStatus)
      setProfile(getUserProfile() || {})
      
      // Only check admin role if user is logged in
      if (authStatus) {
        try {
          const me = await getCurrentUser()
          const role = (me.role || (me as any).roles)?.toString?.() || ''
          setIsAdmin(role.toLowerCase() === 'admin')
        } catch (error) {
          // Backend might be offline - skip admin check
          console.log('⚠️ Cannot check admin role - backend may be offline')
          setIsAdmin(false)
        }
      }
    }
    
    checkAuthStatus()
  }, [])

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    router.push(`/search?query=${encodeURIComponent(q)}`)
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo + Navigation Links */}
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href={mounted && loggedIn ? '/home' : '/'}>
                <Image
                  src="/Logo.png"
                  alt="OCOP Logo"
                  width={40}
                  height={40}
                  className="cursor-pointer"
                />
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
              <Link 
                href={mounted && loggedIn ? '/home' : '/'}
                className="text-gray-900 inline-flex items-center px-1 text-sm font-medium whitespace-nowrap"
              >
                Trang chủ
              </Link>
              <Link 
                href="/products"
                className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 text-sm font-medium whitespace-nowrap"
              >
                Sản phẩm OCOP
              </Link>
              <Link
                href="/map"
                className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 text-sm font-medium whitespace-nowrap"
              >
                Bản đồ
              </Link>
              <Link 
                href="/news"
                className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 text-sm font-medium whitespace-nowrap"
              >
                Tin tức
              </Link>
              <Link 
                href="/contact"
                className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 text-sm font-medium whitespace-nowrap"
              >
                Liên hệ
              </Link>
              {/* Đăng ký OCOP sẽ hiển thị ở khu vực bên phải như một nút nổi bật */}
            </div>
          </div>

          {/* Middle section: Search */}
          <div className="hidden md:flex md:items-center md:justify-center md:w-56 lg:w-64 xl:w-72">
            <form onSubmit={handleSearchSubmit} className="flex items-center border border-gray-300 rounded-full px-3 py-1 bg-white focus-within:ring-2 focus-within:ring-indigo-500 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in site"
                className="outline-none text-sm placeholder-gray-400 w-full"
              />
              <button type="submit" aria-label="Search" className="ml-2 text-gray-600 hover:text-gray-900">
                <span>🔍</span>
              </button>
            </form>
          </div>

          {/* Right section: Cart + Auth buttons */}
          <div className="flex items-center space-x-4">
            {/* Mobile search button */}
            <div className="md:hidden">
              <button className="text-gray-500 hover:text-gray-900 p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Cart - only show on larger screens when space allows */}
            <div className="hidden lg:block">
              <Link href="/cart" className="relative text-gray-500 hover:text-gray-900 p-2">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8" />
                </svg>
                {cart.totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cart.totalItems > 99 ? '99+' : cart.totalItems}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-500 hover:text-gray-900 p-2"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Desktop Auth Area */}
            <div className="hidden sm:flex sm:items-center sm:space-x-3">
              {/* Account Area */}
              {loggedIn ? (
                <>
                  {/* User Dropdown - includes OCOP register, profile, admin, logout */}
                  <UserDropdown profile={profile} isAdmin={isAdmin} />
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center whitespace-nowrap"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center whitespace-nowrap"
                  >
                    Đăng ký
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href={mounted && loggedIn ? '/home' : '/'}
                className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                href="/products"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sản phẩm OCOP
              </Link>
              <Link
                href="/map"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bản đồ
              </Link>
              <Link
                href="/news"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tin tức
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Liên hệ
              </Link>
              
              {/* Cart for mobile */}
              <Link
                href="/cart"
                className="flex items-center px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8" />
                </svg>
                Giỏ hàng
                {cart.totalItems > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cart.totalItems > 99 ? '99+' : cart.totalItems}
                  </span>
                )}
              </Link>
              
              {/* Đăng ký OCOP cho mobile sẽ hiển thị ở phần auth phía dưới như một nút nổi bật */}

              {/* Mobile auth section */}
              <div className="pt-4 border-t border-gray-200">
                {loggedIn ? (
                  <div className="space-y-2">
                    <Link
                      href="/ocop-register"
                      className="block w-full bg-green-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-green-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Đăng ký OCOP
                    </Link>
                    <Link
                      href="/account"
                      className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mr-3">
                        {profile.avatarUrl ? (
                          <Image src={profile.avatarUrl} alt={profile.name || 'avatar'} width={24} height={24} />
                        ) : (
                          <span className="text-xs">👤</span>
                        )}
                      </div>
                      {profile.name || 'Account'}
                    </Link>
                    <button
                      onClick={() => { logout(); router.replace('/'); setMobileMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => { router.push('/login'); setMobileMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
                    >
                      Đăng nhập
                    </button>
                    <button
                      onClick={() => { router.push('/register'); setMobileMenuOpen(false); }}
                      className="block w-full bg-green-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-green-700"
                    >
                      Đăng ký
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

