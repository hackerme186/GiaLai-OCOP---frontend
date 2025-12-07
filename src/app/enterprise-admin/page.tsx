"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  isLoggedIn,
  logout,
} from "@/lib/auth"
import {
  getCurrentUser,
  getNotifications,
  markNotificationAsRead,
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

export default function EnterpriseAdminPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const [activeTab, setActiveTab] = useState<TabType>("products")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)

  // Tải thông báo
  const loadNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    }
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

  // Load thông báo tự động
  useEffect(() => {
    if (authorized) {
      loadNotifications()
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [authorized])

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
    { id: "notifications", label: "Thông báo", icon: "🔔" },
    { id: "settings", label: "Cài đặt", icon: "⚙️" },
  ]

  const userName =
    user?.name || user?.fullName || user?.username || "Enterprise Admin"

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
          <div className="relative">
            <button
              className="flex items-center"
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            >
              <Image
                src="/avatar-placeholder.png"
                alt="Avatar"
                width={40}
                height={40}
                className="rounded-full border"
              />
            </button>

            {showNotificationDropdown && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border p-3 z-50">
                <p className="font-medium text-gray-700 pb-2 border-b">
                  {userName}
                </p>

                {/* Xem thông báo */}
                <button
                  onClick={() => {
                    setActiveTab("notifications")
                    setShowNotificationDropdown(false)
                  }}
                  className="block w-full text-left py-2 hover:bg-gray-100 rounded"
                >
                  🔔 Thông báo ({unreadCount})
                </button>

                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-red-600 hover:bg-gray-100 rounded"
                >
                  🚪 Đăng xuất
                </button>
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
          {activeTab === "notifications" && <NotificationsTab user={user} />}
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
  | "notifications"
  | "settings"
