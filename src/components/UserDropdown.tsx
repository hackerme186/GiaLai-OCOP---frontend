"use client"
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logout, UserProfile } from '@/lib/auth'

interface UserDropdownProps {
  profile: UserProfile
  isAdmin?: boolean
  isEnterpriseAdmin?: boolean
}

const UserDropdown = ({ profile, isAdmin, isEnterpriseAdmin }: UserDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load avatar từ profile.avatarUrl hoặc localStorage
  useEffect(() => {
    const loadAvatar = () => {
      if (typeof window !== "undefined" && profile.id) {
        // Ưu tiên avatarUrl từ profile
        if (profile.avatarUrl) {
          setAvatarUrl(profile.avatarUrl)
          // Cache vào localStorage
          localStorage.setItem(`user_avatar_${profile.id}`, profile.avatarUrl)
        } else {
          // Nếu không có từ profile, thử load từ localStorage
          const savedAvatar = localStorage.getItem(`user_avatar_${profile.id}`)
          if (savedAvatar) {
            setAvatarUrl(savedAvatar)
          } else {
            setAvatarUrl(null)
          }
        }
      }
    }
    
    loadAvatar()
    
    // Listen for profile updates
    if (typeof window !== "undefined") {
      window.addEventListener("profileUpdated", loadAvatar)
      return () => {
        window.removeEventListener("profileUpdated", loadAvatar)
      }
    }
  }, [profile.avatarUrl, profile.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    router.replace('/')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User button/trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg px-2 py-1.5 hover:bg-orange-50"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center ring-2 ring-orange-200 shadow-md hover:ring-orange-300 hover:shadow-lg transition-all duration-200">
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt={profile.name || 'avatar'} 
              width={36} 
              height={36}
              className="object-cover w-full h-full"
              onError={() => {
                // Fallback to initial if image fails to load
                setAvatarUrl(null)
              }}
            />
          ) : (
            <span className="text-white text-base font-bold">
              {profile.name?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <span className="text-sm font-medium max-w-[120px] md:max-w-[160px] truncate">
          {profile.name || 'Tài khoản'}
        </span>
        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fadeIn">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile.name || 'Người dùng'}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {profile.email || ''}
              </p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {/* Đăng ký OCOP */}
              <Link
                href="/ocop-register"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Đăng ký OCOP
              </Link>

              {/* Đơn hàng của tôi */}
              <Link
                href="/orders"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Đơn hàng của tôi
              </Link>

              {/* Enterprise Admin Dashboard (nếu có) */}
              {isEnterpriseAdmin && (
                <Link
                  href="/enterprise-admin"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Quản lý doanh nghiệp
                </Link>
              )}

              {/* Admin (nếu có) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Bảng điều khiển Admin
                </Link>
              )}

              {/* Hồ sơ người dùng */}
              <Link
                href="/account"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Hồ sơ người dùng
              </Link>
            </div>

            {/* Logout - separated */}
            <div className="py-1 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                role="menuitem"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDropdown

