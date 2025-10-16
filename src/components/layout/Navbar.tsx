"use client"
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'

const Navbar = () => {
  const router = useRouter()

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href={isLoggedIn() ? '/home' : '/'}>
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
                href={isLoggedIn() ? '/home' : '/'}
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

          {/* Login/Register Buttons */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
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
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

