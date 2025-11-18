"use client"
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { getUserProfile, isLoggedIn, logout } from '@/lib/auth'
import { getCurrentUser } from '@/lib/api'
import { useCart } from '@/lib/cart-context'
import { FormEvent, useEffect, useState, useRef } from 'react'
import UserDropdown from '@/components/UserDropdown'

const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { cart } = useCart()
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [profile, setProfile] = useState(getUserProfile() || {})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEnterpriseAdmin, setIsEnterpriseAdmin] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Helper function to check if a link is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/home'
    }
    return pathname.startsWith(href)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userDropdownOpen])

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
          const role = (me.role || (me as any).roles)?.toString?.().toLowerCase() || ''
          setIsAdmin(role === 'admin' || role === 'systemadmin' || role === 'sysadmin')
          setIsEnterpriseAdmin(role === 'enterpriseadmin')
        } catch (error) {
          // Backend might be offline - skip admin check
          console.log('⚠️ Cannot check admin role - backend may be offline')
          setIsAdmin(false)
          setIsEnterpriseAdmin(false)
        }
      }
    }
    
    checkAuthStatus()
  }, [])

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    // Điều hướng đến trang products với search query
    router.push(`/products?search=${encodeURIComponent(q)}`)
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left section: Logo + Navigation Links */}
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href={mounted && loggedIn ? '/home' : '/'}
                className="flex items-center space-x-2 group"
              >
                <div className="relative">
                <Image
                  src="/Logo.png"
                  alt="OCOP Logo"
                    width={48}
                    height={48}
                    className="cursor-pointer transition-transform duration-300 group-hover:scale-110"
                />
                </div>
                <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-indigo-600 to-green-600 bg-clip-text text-transparent">
                  OCOP Gia Lai
                </span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden lg:ml-8 lg:flex lg:items-center lg:space-x-1">
              <Link 
                href={mounted && loggedIn ? '/home' : '/'}
                className={`inline-flex items-center px-3 py-2 text-sm whitespace-nowrap rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 ${
                  isActive(mounted && loggedIn ? '/home' : '/') 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-600 font-medium'
                }`}
              >
                Trang chủ
              </Link>
              <Link 
                href="/products"
                className={`inline-flex items-center px-3 py-2 text-sm whitespace-nowrap rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 ${
                  isActive('/products') 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-600 font-medium'
                }`}
              >
                Sản phẩm
              </Link>
              <Link
                href="/map"
                className={`inline-flex items-center px-3 py-2 text-sm whitespace-nowrap rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 ${
                  isActive('/map') 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-600 font-medium'
                }`}
              >
                Bản đồ
              </Link>
              <Link 
                href="/news"
                className={`inline-flex items-center px-3 py-2 text-sm whitespace-nowrap rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 ${
                  isActive('/news') 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-600 font-medium'
                }`}
              >
                Tin tức
              </Link>
              <Link 
                href="/contact"
                className={`inline-flex items-center px-3 py-2 text-sm whitespace-nowrap rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 ${
                  isActive('/contact') 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-600 font-medium'
                }`}
              >
                Liên hệ
              </Link>
            </div>
          </div>

          {/* Middle section: Search */}
          <div className="hidden md:flex md:items-center md:justify-center md:flex-1 md:max-w-md lg:max-w-lg xl:max-w-xl md:mx-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center border-2 border-gray-200 rounded-full px-3 py-1.5 bg-gray-50 focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-md transition-all duration-200 w-full">
              <svg className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="outline-none text-sm placeholder-gray-400 w-full bg-transparent text-gray-700"
              />
              <button 
                type="submit" 
                aria-label="Search" 
                className="ml-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full p-1 transition-colors flex-shrink-0"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Right section: Cart + Auth buttons */}
          <div className="flex items-center space-x-4">
            {/* Mobile search button */}
            <div className="md:hidden">
              <button className="text-gray-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Cart - only show on larger screens when space allows */}
            <div className="hidden lg:block">
              <Link 
                href="/cart" 
                className="relative text-gray-600 hover:text-indigo-600 p-3 rounded-lg hover:bg-indigo-50 transition-all duration-200 group"
              >
                <svg className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8" />
                </svg>
                {cart.totalItems > 0 && (
                  <span className="absolute top-2 right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                    {cart.totalItems > 99 ? '99+' : cart.totalItems}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                )}
              </button>
            </div>

            {/* Desktop Auth Area */}
            <div className="hidden sm:flex sm:items-center sm:space-x-3">
              {/* Account Area */}
              {loggedIn ? (
                <>
                  {/* User Dropdown - includes OCOP register, profile, admin, logout */}
                  <UserDropdown profile={profile} isAdmin={isAdmin} isEnterpriseAdmin={isEnterpriseAdmin} />
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-gray-600 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold flex items-center whitespace-nowrap hover:bg-indigo-50 transition-all duration-200"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 flex items-center whitespace-nowrap shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
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
          <div className="sm:hidden border-t border-gray-200 bg-gray-50">
            <div className="pt-4 pb-4 space-y-1">
              <Link
                href={mounted && loggedIn ? '/home' : '/'}
                className={`block px-4 py-3 text-base rounded-lg mx-2 transition-colors hover:text-indigo-600 hover:bg-indigo-50 ${
                  isActive(mounted && loggedIn ? '/home' : '/') 
                    ? 'font-semibold text-gray-900' 
                    : 'font-medium text-gray-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                href="/products"
                className={`block px-4 py-3 text-base rounded-lg mx-2 transition-colors hover:text-indigo-600 hover:bg-indigo-50 ${
                  isActive('/products') 
                    ? 'font-semibold text-gray-900' 
                    : 'font-medium text-gray-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sản phẩm OCOP
              </Link>
              <Link
                href="/map"
                className={`block px-4 py-3 text-base rounded-lg mx-2 transition-colors hover:text-indigo-600 hover:bg-indigo-50 ${
                  isActive('/map') 
                    ? 'font-semibold text-gray-900' 
                    : 'font-medium text-gray-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Bản đồ
              </Link>
              <Link
                href="/news"
                className={`block px-4 py-3 text-base rounded-lg mx-2 transition-colors hover:text-indigo-600 hover:bg-indigo-50 ${
                  isActive('/news') 
                    ? 'font-semibold text-gray-900' 
                    : 'font-medium text-gray-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Tin tức
              </Link>
              <Link
                href="/contact"
                className={`block px-4 py-3 text-base rounded-lg mx-2 transition-colors hover:text-indigo-600 hover:bg-indigo-50 ${
                  isActive('/contact') 
                    ? 'font-semibold text-gray-900' 
                    : 'font-medium text-gray-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Liên hệ
              </Link>
              
              {/* Cart for mobile */}
              <Link
                href="/cart"
                className="flex items-center px-4 py-3 text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg mx-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="relative mr-3">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8" />
                </svg>
                {cart.totalItems > 0 && (
                    <span className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
                    {cart.totalItems > 99 ? '99+' : cart.totalItems}
                  </span>
                )}
                </div>
                Giỏ hàng
              </Link>
              
              {/* Đăng ký OCOP cho mobile sẽ hiển thị ở phần auth phía dưới như một nút nổi bật */}

              {/* Mobile auth section */}
              <div className="pt-4 border-t border-gray-200 mx-2">
                {loggedIn ? (
                  <div className="space-y-3">
                    <Link
                      href="/ocop-register"
                      className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg text-center font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md transition-all duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Đăng ký OCOP
                    </Link>
                    <Link
                      href="/account"
                      className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mr-3 ring-2 ring-indigo-200">
                        {profile.avatarUrl ? (
                          <Image src={profile.avatarUrl} alt={profile.name || 'avatar'} width={32} height={32} className="object-cover" />
                        ) : (
                          <span className="text-white text-sm font-bold">{profile.name?.[0]?.toUpperCase() || '👤'}</span>
                        )}
                      </div>
                      <span className="font-semibold">{profile.name || 'Account'}</span>
                    </Link>
                    <button
                      onClick={() => { logout(); router.replace('/'); setMobileMenuOpen(false); }}
                      className="block w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => { router.push('/login'); setMobileMenuOpen(false); }}
                      className="block w-full text-left px-4 py-3 text-base font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Đăng nhập
                    </button>
                    <button
                      onClick={() => { router.push('/register'); setMobileMenuOpen(false); }}
                      className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg text-center font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md transition-all duration-200"
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

