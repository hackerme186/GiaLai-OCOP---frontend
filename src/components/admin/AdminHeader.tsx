"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { logout } from "@/lib/auth"
import { getCurrentUser, getPendingWalletRequestsCount } from "@/lib/api"

export type TabType = 'dashboard' | 'enterprise-approval' | 'enterprise-management' | 'ocop-approval' | 'product-management' | 'categories' | 'images' | 'news-management' | 'home-management' | 'reports' | 'revenue-statistics' | 'locations' | 'producers' | 'transactions' | 'user-management' | 'wallet-management' | 'order-management'

interface AdminHeaderProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function AdminHeader({ activeTab, onTabChange }: AdminHeaderProps) {
  const router = useRouter()
  const [userName, setUserName] = useState<string>("Quản trị viên")
  const [userEmail, setUserEmail] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")
  const [pendingWalletRequestsCount, setPendingWalletRequestsCount] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    const loadUserInfo = async () => {
      try {
        const me = await getCurrentUser()
        const role = (me.role || "").toLowerCase()
        setUserName((me.name || me.fullName || me.username || "Quản trị viên").toString())
        setUserEmail((me.email || "").toString())
        setUserRole((me.role || "").toString())

        console.log("AdminHeader - User role:", role)

        // Load pending wallet requests count if SystemAdmin
        if (role === "systemadmin" || role === "admin" || role === "sysadmin") {
          console.log("AdminHeader - Loading pending requests count...")
          await loadPendingRequestsCount()
          // Auto refresh every 30 seconds
          interval = setInterval(() => {
            console.log("AdminHeader - Auto-refreshing pending requests count...")
            loadPendingRequestsCount()
          }, 30000)
        } else {
          console.log("AdminHeader - Not SystemAdmin, skipping pending requests count")
        }
      } catch (err) {
        console.error("Failed to load user info:", err)
      }
    }

    loadUserInfo()

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [])

  const loadPendingRequestsCount = async () => {
    try {
      console.log("AdminHeader - Calling getPendingWalletRequestsCount...")
      const result = await getPendingWalletRequestsCount()
      console.log("AdminHeader - Pending wallet requests count result:", result)
      const count = result?.count || 0
      console.log("AdminHeader - Setting pending count to:", count)
      setPendingWalletRequestsCount(count)
    } catch (err: any) {
      console.error("AdminHeader - Failed to load pending wallet requests count:", err)
      console.error("AdminHeader - Error details:", {
        message: err.message,
        status: err.status,
        response: err.response
      })
      // Set to 0 on error to avoid showing stale data
      setPendingWalletRequestsCount(0)
    }
  }

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout()
      router.replace('/login')
    }
  }

  const allTabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Trang tổng quan', icon: '📊' },
    { id: 'enterprise-approval', label: 'Duyệt đơn đăng ký DN', icon: '👥' },
    { id: 'enterprise-management', label: 'Quản lý doanh nghiệp', icon: '🏢' },
    { id: 'ocop-approval', label: 'Duyệt sản phẩm OCOP', icon: '⭐' },
    { id: 'product-management', label: 'Quản lý sản phẩm', icon: '📦' },
    { id: 'categories', label: 'Quản lý danh mục', icon: '📁' },
    { id: 'images', label: 'Quản lý ảnh', icon: '🖼️' },
    { id: 'news-management', label: 'Quản lý tin tức', icon: '📰' },
    { id: 'home-management', label: 'Quản lý trang chủ', icon: '🏠' },
    { id: 'reports', label: 'Báo cáo toàn tỉnh', icon: '📉' },
    { id: 'revenue-statistics', label: 'Phân tích doanh thu', icon: '💰' },
    { id: 'locations', label: 'Quản lý địa điểm', icon: '📍' },
    { id: 'producers', label: 'Quản lý nhà sản xuất', icon: '🏭' },
    { id: 'transactions', label: 'Giao dịch', icon: '💳' },
    { id: 'user-management', label: 'Quản lý người dùng', icon: '👥' },
    { id: 'wallet-management', label: 'Quản lý ví', icon: '💰' },
    { id: 'order-management', label: 'Quản lý đơn hàng', icon: '📋' },
  ]

  const roleNormalized = (userRole || "").toLowerCase()

  const roleTabMap: Record<string, TabType[]> = {
    systemadmin: ['dashboard', 'enterprise-approval', 'enterprise-management', 'ocop-approval', 'product-management', 'categories', 'images', 'news-management', 'home-management', 'reports', 'revenue-statistics', 'locations', 'producers', 'transactions', 'user-management', 'wallet-management', 'order-management'],
    enterpriseadmin: ['dashboard', 'ocop-approval'],
    customer: ['dashboard'],
  }

  const visibleTabs = useMemo(() => {
    const allowed = roleTabMap[roleNormalized] || roleTabMap.customer
    return allTabs.filter(tab => allowed.includes(tab.id))
  }, [allTabs, roleNormalized])

  useEffect(() => {
    if (visibleTabs.length === 0) return
    const hasActive = visibleTabs.some(tab => tab.id === activeTab)
    if (!hasActive) {
      onTabChange(visibleTabs[0].id)
    }
  }, [visibleTabs, activeTab, onTabChange])

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-100 flex flex-col shadow-lg" style={{ zIndex: 1000 }}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image
            src="/Logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="rounded"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900">OCOP Gia Lai</h1>
            <p className="text-xs text-gray-500">Hệ thống Quản trị</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{userName}</p>
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-2">
          <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">CHÍNH</p>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 mb-1 rounded-lg transition-all relative ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {tab.id === 'wallet-management' && pendingWalletRequestsCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                      ? 'bg-white text-red-600'
                      : 'bg-red-600 text-white'
                    }`}>
                    {pendingWalletRequestsCount}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 flex justify-center gap-4">
        <button
          className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
          title="Cài đặt"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button
          className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
          title="Hồ sơ"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
          title="Đăng xuất"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  )
}

