"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getCurrentUser, getReportSummary, getNotifications, markNotificationAsRead, type ReportSummary, type User, type Notification } from "@/lib/api"
import { getAuthToken, getRoleFromToken, logout } from "@/lib/auth"
import { type TabType } from "@/components/admin/AdminHeader"
import EnterpriseApprovalTab from "@/components/admin/EnterpriseApprovalTab"
import EnterpriseManagementTab from "@/components/admin/EnterpriseManagementTab"
import OcopApprovalTab from "@/components/admin/OcopApprovalTab"
import CategoryManagementTab from "@/components/admin/CategoryManagementTab"
import ProvinceReportTab from "@/components/admin/ProvinceReportTab"
import ImageManagementTab from "@/components/admin/ImageManagementTab"
import LocationsTab from "@/components/admin/LocationsTab"
import ProducersTab from "@/components/admin/ProducersTab"
import TransactionsTab from "@/components/admin/TransactionsTab"
import UserManagementTab from "@/components/admin/UserManagementTab"
import NewsManagementTab from "@/components/admin/NewsManagementTab"
import HomeManagementTab from "@/components/admin/HomeManagementTab"
import ProductManagementTab from "@/components/admin/ProductManagementTab"

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)

  // Define constants with useMemo to avoid recreation on each render
  const allTabs = useMemo<Array<{ id: TabType; label: string; icon: string }>>(() => [
    { id: 'dashboard', label: 'Tổng quan', icon: '📊' },
    { id: 'enterprise-approval', label: 'Duyệt đơn đăng ký DN', icon: '📅' },
    { id: 'enterprise-management', label: 'Quản lý doanh nghiệp', icon: '🏢' },
    { id: 'ocop-approval', label: 'Duyệt sản phẩm OCOP', icon: '⭐' },
    { id: 'product-management', label: 'Quản lý sản phẩm', icon: '📦' },
    { id: 'categories', label: 'Quản lý danh mục', icon: '📁' },
    { id: 'images', label: 'Quản lý ảnh', icon: '🖼️' },
    { id: 'news-management', label: 'Quản lý tin tức', icon: '📰' },
    { id: 'home-management', label: 'Quản lý trang chủ', icon: '🏠' },
    { id: 'reports', label: 'Báo cáo toàn tỉnh', icon: '📉' },
    { id: 'locations', label: 'Quản lý địa điểm', icon: '📍' },
    { id: 'producers', label: 'Quản lý nhà sản xuất', icon: '🏭' },
    { id: 'transactions', label: 'Giao dịch', icon: '💳' },
    { id: 'user-management', label: 'Quản lý người dùng', icon: '👥' },
  ], [])

  const roleTabMap = useMemo<Record<string, TabType[]>>(() => ({
    systemadmin: ['dashboard', 'enterprise-approval', 'enterprise-management', 'ocop-approval', 'product-management', 'categories', 'images', 'news-management', 'home-management', 'reports', 'locations', 'producers', 'transactions', 'user-management'],
    enterpriseadmin: ['dashboard', 'ocop-approval'],
    customer: ['dashboard'],
  }), [])

  const roleNormalized = (user?.role || "").toLowerCase()
  
  // For SystemAdmin, show all tabs. For others, filter based on role
  const visibleTabs = useMemo(() => {
    // If user is not loaded yet, show all tabs (will be filtered after user loads)
    if (!user) {
      return allTabs
    }
    const allowed = roleTabMap[roleNormalized] || roleTabMap.systemadmin
    return allTabs.filter(tab => allowed.includes(tab.id))
  }, [allTabs, roleTabMap, roleNormalized, user])

  const userName = user?.name || user?.fullName || user?.username || "Admin"
  const userEmail = user?.email || ""
  const roleLabel = useMemo(() => {
    switch (roleNormalized) {
      case 'systemadmin':
        return 'Quản trị hệ thống'
      case 'enterpriseadmin':
        return 'Quản trị doanh nghiệp'
      case 'customer':
        return 'Khách hàng'
      default:
        return user?.role || 'Không xác định'
    }
  }, [roleNormalized, user?.role])

  // Get current date
  const currentDate = new Date()
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
  const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
  const dayName = days[currentDate.getDay()]
  const dateString = `Hôm nay là ${dayName}, ${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout()
      router.replace('/login')
    }
  }

  // Load notifications
  const loadNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
      const unread = data.filter(n => !n.read).length
      setUnreadCount(unread)
    } catch (err) {
      console.error("Failed to load notifications:", err)
      setNotifications([])
      setUnreadCount(0)
    }
  }

  // Ensure activeTab is valid when visibleTabs change
  useEffect(() => {
    if (visibleTabs.length === 0) return
    const hasActive = visibleTabs.some(tab => tab.id === activeTab)
    if (!hasActive) {
      setActiveTab(visibleTabs[0].id)
    }
  }, [visibleTabs, activeTab])

  // Load notifications when authorized
  useEffect(() => {
    if (authorized) {
      loadNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [authorized])

  useEffect(() => {
    const check = async () => {
      // 1) Prefer role từ JWT để tránh phụ thuộc /me
      const token = getAuthToken()
      if (!token) {
        router.replace("/login")
        return
      }

      const tokenRole = (getRoleFromToken(token) || "").toLowerCase().trim()
      const isAdminFromToken = tokenRole === 'admin' ||
        tokenRole === 'administrator' ||
        tokenRole === 'role_admin' ||
        tokenRole === 'admin_role' ||
        tokenRole === 'sysadmin' ||
        tokenRole.includes('admin')

      if (isAdminFromToken) {
        setAuthorized(true)
        return
      }

      // 2) Fallback: gọi API /me nếu token không chứa role
      try {
        const me = await getCurrentUser()
        setUser(me)
        const role = (me.role || (me as any).roles || (me as any).userRole)?.toString?.() || ""
        const normRole = role.toLowerCase().trim()
        const isAdmin = normRole === 'admin' ||
          normRole === 'administrator' ||
          normRole === 'role_admin' ||
          normRole === 'admin_role' ||
          normRole === 'sysadmin' ||
          normRole.includes('admin')

        if (!isAdmin) {
          router.replace("/login")
          return
        }
        setAuthorized(true)
      } catch (err) {
        console.warn("Admin authorization check failed:", err)
        router.replace("/login")
      }
    }
    check()
  }, [router])

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" suppressHydrationWarning>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:w-64 bg-white shadow-lg transition-transform duration-300 flex-shrink-0 fixed lg:static h-screen z-40 w-64`}>
        <div className="h-full flex flex-col">
          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg">
                <span className="text-3xl text-white">👤</span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{userName}</h3>
              <p className="text-xs text-gray-500 mt-1">{roleLabel}</p>
              <div className="flex gap-2 mt-3">
                <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">CHÍNH</p>
              <div className="space-y-1">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tab.icon}</span>
                      <span className="text-sm">{tab.label}</span>
                    </div>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6">
          {/* Left: Logo and Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <Image
                src="/Logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">OCOP Gia Lai</h1>
                <p className="text-xs text-gray-500">Hệ thống Quản trị</p>
              </div>
            </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown)
                  if (!showNotificationDropdown) {
                    loadNotifications()
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotificationDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Thông báo</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs text-gray-500">{unreadCount} chưa đọc</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <p className="text-sm">Không có thông báo</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                              onClick={async () => {
                                // Mark as read if unread
                                if (!notification.read) {
                                  try {
                                    await markNotificationAsRead(notification.id)
                                    setNotifications(prev => prev.map(n => 
                                      n.id === notification.id ? { ...n, read: true } : n
                                    ))
                                    setUnreadCount(prev => Math.max(0, prev - 1))
                                  } catch (err) {
                                    console.error("Failed to mark notification as read:", err)
                                  }
                                }
                                setShowNotificationDropdown(false)
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-2xl flex-shrink-0">
                                  {notification.type === 'product_approved' && '✅'}
                                  {notification.type === 'product_rejected' && '❌'}
                                  {notification.type === 'new_order' && '📦'}
                                  {notification.type === 'low_stock' && '⚠️'}
                                  {!['product_approved', 'product_rejected', 'new_order', 'low_stock'].includes(notification.type) && '🔔'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {new Date(notification.createdAt).toLocaleString("vi-VN")}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            // Admin page doesn't have notifications tab
                            setShowNotificationDropdown(false)
                            // Could redirect to a notifications page if exists
                          }}
                          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Đóng
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 text-sm">👤</span>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Chào mừng trở lại, {userName}!
            </h2>
            <p className="text-gray-600">{dateString}</p>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'dashboard' && (
              <DashboardTab />
            )}
            {activeTab === 'enterprise-approval' && (
              <EnterpriseApprovalTab />
            )}
            {activeTab === 'enterprise-management' && (
              <EnterpriseManagementTab />
            )}
            {activeTab === 'ocop-approval' && (
              <OcopApprovalTab />
            )}
            {activeTab === 'product-management' && (
              <ProductManagementTab />
            )}
            {activeTab === 'categories' && (
              <CategoryManagementTab />
            )}
            {activeTab === 'images' && (
              <ImageManagementTab />
            )}
            {activeTab === 'news-management' && (
              <NewsManagementTab />
            )}
            {activeTab === 'home-management' && (
              <HomeManagementTab />
            )}
            {activeTab === 'reports' && (
              <ProvinceReportTab />
            )}
            {activeTab === 'locations' && (
              <LocationsTab />
            )}
            {activeTab === 'producers' && (
              <ProducersTab />
            )}
            {activeTab === 'transactions' && (
              <TransactionsTab />
            )}
            {activeTab === 'user-management' && (
              <UserManagementTab />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// Dashboard Tab Component
function DashboardTab() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getReportSummary()
      setSummary(data)
    } catch (err) {
      console.error("Failed to load dashboard:", err)
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu tổng quan")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải dữ liệu tổng quan...</p>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Không thể tải dữ liệu"}</p>
        <button
          onClick={loadDashboard}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    )
  }

  const statsCards = [
    {
      label: "Tổng doanh nghiệp",
      value: summary.totalEnterprises,
      icon: "🏢",
      bgClass: "from-blue-50 to-blue-100",
      borderClass: "border-blue-200",
      textClass: "text-blue-600",
      valueClass: "text-blue-900",
      description: "Doanh nghiệp đã đăng ký"
    },
    {
      label: "Tổng sản phẩm OCOP",
      value: summary.totalProducts,
      icon: "⭐",
      bgClass: "from-green-50 to-green-100",
      borderClass: "border-green-200",
      textClass: "text-green-600",
      valueClass: "text-green-900",
      description: `${summary.approvedProducts} đã duyệt, ${summary.pendingProducts} chờ duyệt`
    },
    {
      label: "Sản phẩm chờ duyệt",
      value: summary.pendingProducts,
      icon: "⏳",
      bgClass: "from-yellow-50 to-yellow-100",
      borderClass: "border-yellow-200",
      textClass: "text-yellow-600",
      valueClass: "text-yellow-900",
      description: "Cần xử lý"
    },
    {
      label: "Tổng danh mục",
      value: summary.totalCategories,
      icon: "📁",
      bgClass: "from-purple-50 to-purple-100",
      borderClass: "border-purple-200",
      textClass: "text-purple-600",
      valueClass: "text-purple-900",
      description: "Danh mục sản phẩm"
    },
    {
      label: "Tổng đơn hàng",
      value: summary.totalOrders,
      icon: "🧾",
      bgClass: "from-orange-50 to-orange-100",
      borderClass: "border-orange-200",
      textClass: "text-orange-600",
      valueClass: "text-orange-900",
      description: "Đơn hàng trong hệ thống"
    },
    {
      label: "Tổng khách hàng",
      value: summary.totalCustomers,
      icon: "👥",
      bgClass: "from-cyan-50 to-cyan-100",
      borderClass: "border-cyan-200",
      textClass: "text-cyan-600",
      valueClass: "text-cyan-900",
      description: "Người dùng Customer"
    },
    {
      label: "Quản trị doanh nghiệp",
      value: summary.totalEnterpriseAdmins,
      icon: "👔",
      bgClass: "from-indigo-50 to-indigo-100",
      borderClass: "border-indigo-200",
      textClass: "text-indigo-600",
      valueClass: "text-indigo-900",
      description: "EnterpriseAdmin"
    },
    {
      label: "Đơn đăng ký OCOP",
      value: summary.totalApplications,
      icon: "📋",
      bgClass: "from-pink-50 to-pink-100",
      borderClass: "border-pink-200",
      textClass: "text-pink-600",
      valueClass: "text-pink-900",
      description: `${summary.pendingApplications} đang chờ duyệt`
    },
    {
      label: "Đã thanh toán",
      value: formatCurrency(summary.paidPaymentsAmount),
      icon: "💰",
      bgClass: "from-emerald-50 to-emerald-100",
      borderClass: "border-emerald-200",
      textClass: "text-emerald-600",
      valueClass: "text-emerald-900",
      description: "Tổng tiền đã thanh toán"
    },
    {
      label: "Chờ chuyển khoản",
      value: formatCurrency(summary.awaitingTransferAmount),
      icon: "💳",
      bgClass: "from-teal-50 to-teal-100",
      borderClass: "border-teal-200",
      textClass: "text-teal-600",
      valueClass: "text-teal-900",
      description: "Đang chờ xác nhận"
    },
    {
      label: "Sản phẩm đã duyệt",
      value: summary.approvedProducts,
      icon: "✅",
      bgClass: "from-lime-50 to-lime-100",
      borderClass: "border-lime-200",
      textClass: "text-lime-600",
      valueClass: "text-lime-900",
      description: "Sản phẩm OCOP"
    },
    {
      label: "Sản phẩm bị từ chối",
      value: summary.rejectedProducts,
      icon: "❌",
      bgClass: "from-red-50 to-red-100",
      borderClass: "border-red-200",
      textClass: "text-red-600",
      valueClass: "text-red-900",
      description: "Không đạt tiêu chuẩn"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📊 Tổng quan hệ thống</h2>
            <p className="text-white/90 text-lg">Thống kê và phân tích toàn diện hệ thống OCOP Gia Lai</p>
          </div>
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-2xl p-6 border-2 ${card.borderClass} shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group`}
            style={{
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
            }}
          >
            {/* Background gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgClass} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${card.bgClass} shadow-md`}>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <div className={`px-3 py-1 rounded-full ${card.bgClass} border ${card.borderClass} shadow-sm`}>
                  <span className={`text-xs font-bold ${card.textClass}`}>#{index + 1}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className={`text-sm font-semibold ${card.textClass} uppercase tracking-wide`}>
                  {card.label}
                </p>
                <p className={`text-4xl font-bold ${card.valueClass} leading-tight`}>
                  {card.value}
                </p>
                {card.description && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className={`text-xs ${card.textClass} font-medium`}>
                      {card.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Statistics */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-blue-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Thống kê sản phẩm</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Tổng sản phẩm</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{summary.totalProducts}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm hover:shadow-md transition-all border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Đã duyệt</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{summary.approvedProducts}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl shadow-sm hover:shadow-md transition-all border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Chờ duyệt</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{summary.pendingProducts}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl shadow-sm hover:shadow-md transition-all border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Bị từ chối</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{summary.rejectedProducts}</span>
            </div>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-purple-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Thống kê thanh toán</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Tổng giao dịch</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{summary.totalPayments}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm hover:shadow-md transition-all border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Đã thanh toán</span>
              </div>
              <span className="text-xl font-bold text-green-600">{formatCurrency(summary.paidPaymentsAmount)}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl shadow-sm hover:shadow-md transition-all border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Chờ chuyển khoản</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{formatCurrency(summary.awaitingTransferAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-2">💡 Hướng dẫn nhanh</h4>
              <p className="text-white/90 text-sm leading-relaxed">
                Chọn một tab ở trên để bắt đầu quản lý hệ thống. Dữ liệu được cập nhật tự động khi bạn làm mới trang. 
                Sử dụng nút <strong>"Làm mới dữ liệu"</strong> để cập nhật thông tin mới nhất.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Trạng thái hệ thống</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Kết nối API</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✓ Hoạt động</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cơ sở dữ liệu</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✓ Hoạt động</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cập nhật lần cuối</span>
              <span className="text-xs text-gray-500">{new Date().toLocaleTimeString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
