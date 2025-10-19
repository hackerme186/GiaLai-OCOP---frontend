"use client"
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUserProfile, isLoggedIn, logout } from '@/lib/auth'
import { FormEvent, useEffect, useState } from 'react'

const Navbar = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [profile, setProfile] = useState(getUserProfile() || {})

  useEffect(() => {
    setMounted(true)
    setLoggedIn(isLoggedIn())
    setProfile(getUserProfile() || {})
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
        <div className="flex justify-between h-16">
          <div className="flex">
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
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href={mounted && loggedIn ? '/home' : '/'}
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Trang chủ
              </Link>
              <Link 
                href="/products"
                className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Sản phẩm OCOP
              </Link>
              <Link 
                href="/news"
                className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Tin tức
              </Link>
              <Link 
                href="/contact"
                className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Liên hệ
              </Link>
            </div>
          </div>

          {/* Right side: Search + Cart + Auth buttons */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center border border-gray-300 rounded-full px-3 py-1 bg-white focus-within:ring-2 focus-within:ring-indigo-500">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in site"
                className="outline-none text-sm placeholder-gray-400 w-48"
              />
              <button type="submit" aria-label="Search" className="ml-2 text-gray-600 hover:text-gray-900">
                {/* simple magnifier */}
                <span>🔍</span>
              </button>
            </form>

            {/* Cart */}
            <Link href="/cart" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Cart
            </Link>

            {/* Account Area */}
            {loggedIn ? (
              <div className="flex items-center gap-3">
                <Link href="/account" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {profile.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt={profile.name || 'avatar'} width={28} height={28} />
                    ) : (
                      <span className="text-sm">👤</span>
                    )}
                  </div>
                  <span className="text-sm font-medium max-w-[160px] truncate">{profile.name || 'Account'}</span>
                </Link>
                <button
                  onClick={() => { logout(); router.replace('/'); }}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

