"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { logout } from "@/lib/auth"
import { getCurrentUser } from "@/lib/api"

export type TabType = 'dashboard' | 'enterprise-approval' | 'enterprise-management' | 'ocop-approval' | 'categories' | 'images' | 'reports' | 'locations' | 'producers' | 'transactions'

interface AdminHeaderProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function AdminHeader({ activeTab, onTabChange }: AdminHeaderProps) {
  const router = useRouter()
  const [userName, setUserName] = useState<string>("Admin")
  const [userEmail, setUserEmail] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const me = await getCurrentUser()
        setUserName((me.name || me.fullName || me.username || "Admin").toString())
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
    { id: 'enterprise-approval', label: 'Duyệt đơn đăng ký DN', icon: '📅' },
    { id: 'enterprise-management', label: 'Quản lý doanh nghiệp', icon: '🏢' },
    { id: 'ocop-approval', label: 'Duyệt sản phẩm OCOP', icon: '⭐' },
    { id: 'categories', label: 'Quản lý danh mục', icon: '📁' },
    { id: 'images', label: 'Quản lý ảnh', icon: '🖼️' },
    { id: 'reports', label: 'Báo cáo toàn tỉnh', icon: '📉' },
    { id: 'locations', label: 'Quản lý địa điểm', icon: '📍' },
    { id: 'producers', label: 'Quản lý nhà sản xuất', icon: '🏭' },
    { id: 'transactions', label: 'Giao dịch', icon: '💳' },
  ]

  const roleNormalized = (userRole || "").toLowerCase()

  const roleTabMap: Record<string, TabType[]> = {
    systemadmin: ['dashboard', 'enterprise-approval', 'enterprise-management', 'ocop-approval', 'categories', 'images', 'reports', 'locations', 'producers', 'transactions'],
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

  const roleLabel = useMemo(() => {
    switch (roleNormalized) {
      case 'systemadmin':
        return 'Quản trị hệ thống'
      case 'enterpriseadmin':
        return 'Quản trị doanh nghiệp'
      case 'customer':
        return 'Khách hàng'
      default:
        return userRole || 'Không xác định'
    }
  }, [roleNormalized, userRole])

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
              <h1 className="text-lg font-bold text-gray-900">Hệ thống Quản trị</h1>
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
              {roleLabel && (
                <p className="text-xs text-indigo-600 font-semibold">{roleLabel}</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 text-lg">👤</span>
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
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
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

