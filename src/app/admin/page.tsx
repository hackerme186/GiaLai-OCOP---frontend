"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Footer from "@/components/layout/Footer"
import { getCurrentUser } from "@/lib/api"
import { getAuthToken, getRoleFromToken } from "@/lib/auth"
import AdminHeader, { type TabType } from "@/components/admin/AdminHeader"
import EnterpriseApprovalTab from "@/components/admin/EnterpriseApprovalTab"
import OcopApprovalTab from "@/components/admin/OcopApprovalTab"
import CategoryManagementTab from "@/components/admin/CategoryManagementTab"
import ProvinceReportTab from "@/components/admin/ProvinceReportTab"

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

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
                              tokenRole === 'systemadmin' ||
                              tokenRole.includes('admin')
      
      if (isAdminFromToken) {
        setAuthorized(true)
        return
      }
      
      // 2) Fallback: gọi API /me nếu token không chứa role
      try {
        const me = await getCurrentUser()
        const role = (me.role || (me as any).roles || (me as any).userRole)?.toString?.() || ""
        const normRole = role.toLowerCase().trim()
        const isAdmin = normRole === 'admin' || 
                       normRole === 'administrator' || 
                       normRole === 'role_admin' || 
                       normRole === 'admin_role' || 
                       normRole === 'sysadmin' ||
                       normRole === 'systemadmin' ||
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
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            {activeTab === 'dashboard' && (
              <DashboardTab />
            )}
            {activeTab === 'enterprise-approval' && (
              <EnterpriseApprovalTab />
            )}
            {activeTab === 'ocop-approval' && (
              <OcopApprovalTab />
            )}
            {activeTab === 'categories' && (
              <CategoryManagementTab />
            )}
            {activeTab === 'reports' && (
              <ProvinceReportTab />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Dashboard Tab Component
function DashboardTab() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tổng quan hệ thống</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Tổng doanh nghiệp</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">-</p>
            </div>
            <div className="text-4xl">🏢</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Sản phẩm OCOP</p>
              <p className="text-3xl font-bold text-green-900 mt-2">-</p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Chờ duyệt</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">-</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Danh mục</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">-</p>
            </div>
            <div className="text-4xl">📁</div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <p className="text-gray-600">Chọn một tab ở trên để bắt đầu quản lý hệ thống.</p>
      </div>
    </div>
  )
}
