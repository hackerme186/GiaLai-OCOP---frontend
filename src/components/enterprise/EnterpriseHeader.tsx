"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { logout } from "@/lib/auth"
import { getCurrentUser } from "@/lib/api"

export type TabType = "dashboard" | "products" | "orders" | "inventory" | "profile" | "ocop-status" | "reports" | "notifications" | "settings"

interface EnterpriseHeaderProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function EnterpriseHeader({ activeTab, onTabChange }: EnterpriseHeaderProps) {
  const router = useRouter()
  const [userName, setUserName] = useState<string>("Enterprise Admin")
  const [userEmail, setUserEmail] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const me = await getCurrentUser()
        setUserName((me.name || me.fullName || me.username || "Enterprise Admin").toString())
        setUserEmail((me.email || "").toString())
        setUserRole((me.role || "").toString())
      } catch {
        // Ignore errors
      }
    }
    loadUserInfo()
  }, [])

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout()
      router.replace('/login')
    }
  }

  const allTabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Tổng quan', icon: '📊' },
    { id: 'products', label: 'Quản lý sản phẩm', icon: '📦' },
    { id: 'orders', label: 'Quản lý đơn hàng', icon: '📋' },
    { id: 'inventory', label: 'Quản lý kho', icon: '📦' },
    { id: 'profile', label: 'Hồ sơ doanh nghiệp', icon: '🏢' },
    { id: 'ocop-status', label: 'Trạng thái OCOP', icon: '⭐' },
    { id: 'reports', label: 'Báo cáo', icon: '📊' },
    { id: 'notifications', label: 'Thông báo', icon: '🔔' },
    { id: 'settings', label: 'Cài đặt', icon: '⚙️' },
  ]

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Bar: Logo and User Info */}
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/Logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="mr-3"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Quản lý Doanh nghiệp</h1>
              <p className="text-xs text-gray-500">OCOP Gia Lai</p>
            </div>
          </div>

          {/* User Account Section */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              {userEmail && (
                <p className="text-xs text-gray-500">{userEmail}</p>
              )}
              <p className="text-xs text-green-600 font-semibold">Quản trị doanh nghiệp</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-lg">👤</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap">
          {allTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2 text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

