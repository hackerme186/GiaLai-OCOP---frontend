"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isLoggedIn, getAuthToken, logout } from "@/lib/auth"
import { getCurrentUser, type User } from "@/lib/api"
import ProductManagementTab from "@/components/enterprise/ProductManagementTab"
import OrderManagementTab from "@/components/enterprise/OrderManagementTab"
import OcopStatusTab from "@/components/enterprise/OcopStatusTab"
import ReportsTab from "@/components/enterprise/ReportsTab"

type TabType = "products" | "orders" | "ocop-status" | "reports"

export default function EnterpriseAdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("products")

  useEffect(() => {
    const check = async () => {
      // Check if logged in
      const loggedIn = await isLoggedIn()
      if (!loggedIn) {
        router.replace("/login?redirect=/enterprise-admin")
        return
      }

      try {
        // Get current user
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        // Check if user is EnterpriseAdmin
        const role = (currentUser.role || "").toLowerCase().trim()
        
        if (role !== "enterpriseadmin") {
          alert("Bạn không có quyền truy cập trang này. Chỉ EnterpriseAdmin mới có thể truy cập.")
          router.replace("/home")
          return
        }

        // Check if user has enterpriseId
        if (!currentUser.enterpriseId) {
          alert("Tài khoản của bạn chưa được liên kết với doanh nghiệp nào. Vui lòng liên hệ quản trị viên.")
          router.replace("/home")
          return
        }

        setAuthorized(true)
      } catch (err) {
        console.error("Authorization check failed:", err)
        router.replace("/login?redirect=/enterprise-admin")
      }
    }
    check()
  }, [router])

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      logout()
      router.replace("/login")
    }
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: "products", label: "Quản lý sản phẩm", icon: "📦" },
    { id: "orders", label: "Quản lý đơn hàng", icon: "📋" },
    { id: "ocop-status", label: "Trạng thái OCOP", icon: "⭐" },
    { id: "reports", label: "Báo cáo", icon: "📊" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý doanh nghiệp</h1>
                <p className="text-sm text-gray-500">
                  Chào mừng, {user?.name || "Enterprise Admin"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/home")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Trang chủ
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "products" && <ProductManagementTab user={user} />}
        {activeTab === "orders" && <OrderManagementTab user={user} />}
        {activeTab === "ocop-status" && <OcopStatusTab user={user} />}
        {activeTab === "reports" && <ReportsTab user={user} />}
      </main>
    </div>
  )
}
