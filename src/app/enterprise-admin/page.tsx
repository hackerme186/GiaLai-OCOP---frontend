"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  isLoggedIn,
  logout,
} from "@/lib/auth"
import {
  getCurrentUser,
  getNotifications,
  type User,
  type Notification,
} from "@/lib/api"

import ProductManagementTab from "@/components/enterprise/ProductManagementTab"
import OrderManagementTab from "@/components/enterprise/OrderManagementTab"
import OcopStatusTab from "@/components/enterprise/OcopStatusTab"
import ReportsTab from "@/components/enterprise/ReportsTab"
import EnterpriseProfileTab from "@/components/enterprise/EnterpriseProfileTab"
import InventoryTab from "@/components/enterprise/InventoryTab"
import SettingsTab from "@/components/enterprise/SettingsTab"
import NotificationsTab from "@/components/enterprise/NotificationsTab"
import WalletTab from "@/components/enterprise/WalletTab"

function EnterpriseAdminPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Đọc tab từ query parameter hoặc mặc định là "products"
  const tabFromQuery = searchParams?.get("tab") as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>("products")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Tải thông báo
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

  // Callback để NotificationsTab có thể update unreadCount
  const handleNotificationUpdate = () => {
    loadNotifications()
  }

  // Kiểm tra quyền đăng nhập
  useEffect(() => {
    const check = async () => {
      const logged = await isLoggedIn()
      if (!logged) {
        router.replace("/login?redirect=/enterprise-admin")
        return
      }

      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        // Load avatar
        if (currentUser.avatarUrl) {
          setAvatarUrl(currentUser.avatarUrl)
        } else if (typeof window !== "undefined" && currentUser.id) {
          const savedAvatar = localStorage.getItem(`user_avatar_${currentUser.id}`)
          if (savedAvatar) {
            setAvatarUrl(savedAvatar)
          }
        }

        const role = currentUser.role?.toLowerCase().trim()

        if (role !== "enterpriseadmin") {
          alert("Bạn không có quyền truy cập trang này.")
          router.replace("/home")
          return
        }

        if (!currentUser.enterpriseId) {
          alert("Tài khoản chưa liên kết doanh nghiệp.")
          router.replace("/home")
          return
        }

        setAuthorized(true)
      } catch {
        router.replace("/login?redirect=/enterprise-admin")
      }
    }

    check()
  }, [router])

  // Cập nhật tab khi query parameter thay đổi (chỉ khi URL thay đổi từ bên ngoài)
  useEffect(() => {
    const tabFromQuery = searchParams?.get("tab") as TabType | null
    if (tabFromQuery) {
      // Validate tab exists in tabs array
      const validTabs: TabType[] = ["products", "orders", "inventory", "profile", "ocop-status", "reports", "wallet", "notifications", "settings"]
      if (validTabs.includes(tabFromQuery) && tabFromQuery !== activeTab) {
        setActiveTab(tabFromQuery)
      }
    } else {
      // Set default tab if no query param
      setActiveTab("products")
    }
  }, [searchParams, activeTab])

  // Load thông báo tự động
  useEffect(() => {
    if (authorized) {
      loadNotifications()
      const interval = setInterval(() => {
        loadNotifications()
      }, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [authorized])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showNotificationDropdown && !target.closest('.notification-dropdown')) {
        setShowNotificationDropdown(false)
      }
    }

    if (showNotificationDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotificationDropdown])

  const handleLogout = () => {
    if (confirm("Bạn chắc chắn muốn đăng xuất?")) {
      logout()
      router.replace("/login")
    }
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-green-600 mx-auto" />
          <p className="mt-3 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "products", label: "Quản lý sản phẩm", icon: "📦" },
    { id: "orders", label: "Quản lý đơn hàng", icon: "🧾" },
    { id: "inventory", label: "Quản lý kho", icon: "📚" },
    { id: "profile", label: "Hồ sơ doanh nghiệp", icon: "🏢" },
    { id: "ocop-status", label: "Trạng thái OCOP", icon: "⭐" },
    { id: "reports", label: "Báo cáo", icon: "📊" },
    { id: "wallet", label: "Ví của tôi", icon: "💰" },
    { id: "notifications", label: "Thông báo", icon: "🔔" },
    { id: "settings", label: "Cài đặt", icon: "⚙️" },
  ]

  const userName =
    user?.name || user?.fullName || user?.username || "Quản trị doanh nghiệp"

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside
        className={`fixed z-30 inset-y-0 left-0 w-64 bg-white shadow transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-20 flex items-center px-6 shadow-md border-b">
          <span className="text-2xl font-bold text-green-700">
            OCOP Manager
          </span>
        </div>

        <nav className="p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition ${
                activeTab === tab.id
                  ? "bg-green-600 text-white shadow"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-3 text-xl">{tab.icon}</span>
              {tab.label}

              {tab.id === "notifications" && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* HEADER */}
        <header className="h-20 bg-white shadow px-6 flex items-center justify-between">
          {/* Nút mở sidebar */}
          <button
            className="lg:hidden text-3xl"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <h1 className="text-xl font-semibold">
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>

          {/* Avatar + Dropdown */}
          <div className="relative notification-dropdown">
            <button
              className="flex items-center relative"
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-green-600 object-cover"
                  onError={() => setAvatarUrl(null)}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-600">
                  <span className="text-green-600 text-lg font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Badge thông báo */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotificationDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border z-50 max-h-[600px] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-green-500 to-green-600">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Thông báo</h3>
                    {unreadCount > 0 && (
                      <span className="bg-white text-green-600 text-xs font-bold px-2 py-1 rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                </div>

                {/* Danh sách thông báo */}
                <div className="overflow-y-auto max-h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <p>Không có thông báo</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.slice(0, 5).map((notification) => {
                        // Xác định tab cần chuyển đến dựa trên notification type và link
                        const getTargetTab = (): TabType => {
                          // Nếu là wallet-related notification và link là /enterprise-admin, chuyển đến tab wallet
                          if ((notification.type?.startsWith("wallet_") || notification.link === "/enterprise-admin") && 
                              (notification.type?.includes("wallet") || notification.link === "/enterprise-admin")) {
                            return "wallet"
                          }
                          // Mặc định chuyển đến tab notifications
                          return "notifications"
                        }

                        return (
                          <button
                            key={notification.id}
                            onClick={async () => {
                              // Đánh dấu đã đọc nếu chưa đọc
                              if (!notification.read) {
                                try {
                                  const { markNotificationAsRead } = await import("@/lib/api")
                                  await markNotificationAsRead(notification.id)
                                  loadNotifications()
                                } catch (err) {
                                  console.error("Failed to mark notification as read:", err)
                                }
                              }
                              
                              const targetTab = getTargetTab()
                              setActiveTab(targetTab)
                              setShowNotificationDropdown(false)
                              
                              // Nếu có link và không phải là /enterprise-admin, điều hướng
                              if (notification.link && notification.link !== "/enterprise-admin") {
                                router.push(notification.link)
                              }
                            }}
                            className={`w-full text-left p-3 hover:bg-gray-50 transition ${
                              !notification.read ? "bg-green-50" : ""
                            }`}
                          >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">
                              {notification.type === "product_approved" ? "✅" :
                               notification.type === "product_rejected" ? "❌" :
                               notification.type === "new_order" ? "📦" :
                               notification.type === "low_stock" ? "⚠️" :
                               notification.type?.startsWith("wallet_") ? "💰" : "🔔"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                !notification.read ? "text-gray-900" : "text-gray-600"
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                        </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t bg-gray-50">
                  <button
                    onClick={() => {
                      setActiveTab("notifications")
                      setShowNotificationDropdown(false)
                    }}
                    className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium py-2"
                  >
                    Xem tất cả thông báo
                  </button>
                </div>

                {/* User info và logout */}
                <div className="p-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {userName}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-sm text-red-600 hover:text-red-700 font-medium py-2"
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* TAB CONTENT */}
        <main className="p-6 flex-1">
          {activeTab === "products" && <ProductManagementTab user={user} />}
          {activeTab === "orders" && <OrderManagementTab user={user} />}
          {activeTab === "inventory" && <InventoryTab user={user} />}
          {activeTab === "profile" && <EnterpriseProfileTab user={user} />}
          {activeTab === "ocop-status" && <OcopStatusTab user={user} />}
          {activeTab === "reports" && <ReportsTab user={user} />}
          {activeTab === "wallet" && <WalletTab user={user} />}
          {activeTab === "notifications" && (
            <NotificationsTab 
              user={user} 
              onNotificationUpdate={handleNotificationUpdate}
              unreadCount={unreadCount}
              onNavigate={(tab, params) => {
                // Switch tab ngay lập tức
                const targetTab = tab as TabType
                
                // Set activeTab trước
                setActiveTab(targetTab)
                
                // Cập nhật URL để reflect tab change
                // Sử dụng router.push với shallow routing để không reload trang
                router.push(`/enterprise-admin?tab=${targetTab}`, { scroll: false })
                
                // Có thể scroll đến order/product cụ thể sau khi tab được switch
                if (params?.orderId || params?.productId) {
                  setTimeout(() => {
                    // Scroll đến element có id tương ứng nếu có
                    const elementId = params.orderId ? `order-${params.orderId}` : `product-${params.productId}`
                    const element = document.getElementById(elementId)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      // Highlight element
                      element.classList.add('ring-2', 'ring-green-500')
                      setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-green-500')
                      }, 3000)
                    }
                  }, 500)
                }
              }}
            />
          )}
          {activeTab === "settings" && <SettingsTab user={user} />}
        </main>
      </div>
    </div>
  )
}

type TabType =
  | "products"
  | "orders"
  | "inventory"
  | "profile"
  | "ocop-status"
  | "reports"
  | "wallet"
  | "notifications"
  | "settings"

export default function EnterpriseAdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-green-600 mx-auto" />
          <p className="mt-3 text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <EnterpriseAdminPageContent />
    </Suspense>
  )
}
