"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isLoggedIn } from "@/lib/auth"
import { getCurrentUser, type User } from "@/lib/api"
import Footer from "@/components/layout/Footer"
import EnterpriseHeader, { type TabType } from "@/components/enterprise/EnterpriseHeader"
import DashboardTab from "@/components/enterprise/DashboardTab"
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
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")

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


  if (authorized === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <EnterpriseHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            {activeTab === 'dashboard' && (
              <DashboardTab user={user} />
            )}
            {activeTab === 'products' && (
              <ProductManagementTab user={user} />
            )}
            {activeTab === 'orders' && (
              <OrderManagementTab user={user} />
            )}
            {activeTab === 'inventory' && (
              <InventoryTab user={user} />
            )}
            {activeTab === 'profile' && (
              <EnterpriseProfileTab user={user} />
            )}
            {activeTab === 'ocop-status' && (
              <OcopStatusTab user={user} />
            )}
            {activeTab === 'reports' && (
              <ReportsTab user={user} />
            )}
            {activeTab === 'notifications' && (
              <NotificationsTab user={user} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab user={user} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
