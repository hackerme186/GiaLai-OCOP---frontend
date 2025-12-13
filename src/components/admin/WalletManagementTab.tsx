"use client"

import React, { useEffect, useState } from "react"
import {
  getSystemWalletSummary,
  getAllUserWallets,
  getUserWallet,
  updateUserBalance,
  getPendingWalletRequestsCount,
  getWalletRequests,
  type SystemWalletSummary,
  type UserWalletInfo,
  type Wallet,
  type UpdateUserBalanceDto,
  type WalletRequest
} from "@/lib/api"

export default function WalletManagementTab() {
  const [summary, setSummary] = useState<SystemWalletSummary | null>(null)
  const [userWallets, setUserWallets] = useState<UserWalletInfo[]>([])
  const [pendingRequests, setPendingRequests] = useState<WalletRequest[]>([])
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  
  // Selected user wallet details
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showUpdateBalanceModal, setShowUpdateBalanceModal] = useState(false)
  
  // Update balance form
  const [updateAmount, setUpdateAmount] = useState("")
  const [updateDescription, setUpdateDescription] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadData()
    // Auto refresh pending requests count every 30 seconds
    const interval = setInterval(() => {
      loadPendingRequestsCount()
      loadPendingRequests()
    }, 30000)
    return () => clearInterval(interval)
  }, [page])

  const loadPendingRequestsCount = async () => {
    try {
      console.log("WalletManagementTab - Loading pending requests count...")
      const result = await getPendingWalletRequestsCount()
      console.log("WalletManagementTab - Pending requests count result:", result)
      const count = result?.count || 0
      console.log("WalletManagementTab - Setting count to:", count)
      setPendingRequestsCount(count)
    } catch (err: any) {
      console.error("WalletManagementTab - Failed to load pending requests count:", err)
      console.error("WalletManagementTab - Error details:", {
        message: err.message,
        status: err.status,
        response: err.response
      })
      setPendingRequestsCount(0)
    }
  }

  const loadPendingRequests = async () => {
    try {
      const requests = await getWalletRequests({ status: "pending", pageSize: 100 })
      // Ensure requests are properly mapped by userId
      const validatedRequests = requests.map(req => ({
        ...req,
        userId: req.userId // Ensure userId exists
      }))
      setPendingRequests(validatedRequests)
      console.log("Loaded pending requests:", validatedRequests.length, "requests for", new Set(validatedRequests.map(r => r.userId)).size, "users")
    } catch (err) {
      console.error("Failed to load pending requests:", err)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [summaryData, walletsData] = await Promise.all([
        getSystemWalletSummary(),
        getAllUserWallets({ page, pageSize })
      ])
      
      setSummary(summaryData)
      setUserWallets(walletsData)
      await Promise.all([
        loadPendingRequestsCount(),
        loadPendingRequests()
      ])
    } catch (err) {
      console.error("Failed to load wallet data:", err)
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu ví")
    } finally {
      setLoading(false)
    }
  }

  // Get user IDs that have pending requests
  const getUserIdsWithPendingRequests = () => {
    return new Set(pendingRequests.map(req => req.userId))
  }

  // Get pending requests for a specific user
  const getUserPendingRequests = (userId: number) => {
    return pendingRequests.filter(req => req.userId === userId)
  }

  // Get user info for a request (from request or from wallets list)
  // Priority: userWallets > WalletRequest > fallback
  const getUserInfoForRequest = (userId: number) => {
    // First try to get from userWallets list (most accurate source)
    const wallet = userWallets.find(w => w.userId === userId)
    if (wallet) {
      return {
        userName: wallet.userName,
        userEmail: wallet.userEmail,
        userRole: wallet.userRole
      }
    }
    
    // Fallback: try to get from first request with this userId
    // This ensures we show user info even if they don't have a wallet yet
    const request = pendingRequests.find(r => r.userId === userId)
    if (request && (request.userName || request.userEmail)) {
      return {
        userName: request.userName || `User #${userId}`,
        userEmail: request.userEmail || "",
        userRole: request.userRole || ""
      }
    }
    
    // Last resort: use userId only
    return {
      userName: `User #${userId}`,
      userEmail: "",
      userRole: ""
    }
  }

  const loadUserWalletDetails = async (userId: number) => {
    try {
      setSelectedUserId(userId)
      const walletData = await getUserWallet(userId)
      setSelectedWallet(walletData)
      setShowUserDetails(true)
    } catch (err) {
      console.error("Failed to load user wallet details:", err)
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết ví")
    }
  }

  const handleUpdateBalance = async () => {
    if (!selectedUserId || !updateAmount || !updateDescription) {
      setError("Vui lòng điền đầy đủ thông tin")
      return
    }

    const amount = parseFloat(updateAmount)
    if (isNaN(amount) || amount === 0) {
      setError("Số tiền không hợp lệ")
      return
    }

    try {
      setUpdating(true)
      setError(null)

      const payload: UpdateUserBalanceDto = {
        amount: amount,
        description: updateDescription.trim()
      }

      await updateUserBalance(selectedUserId, payload)
      setSuccess("Cập nhật số dư thành công!")
      setShowUpdateBalanceModal(false)
      setUpdateAmount("")
      setUpdateDescription("")
      
      // Reload data
      await Promise.all([
        loadData(),
        loadPendingRequests()
      ])
      if (selectedUserId) {
        await loadUserWalletDetails(selectedUserId)
      }
    } catch (err: any) {
      console.error("Failed to update balance:", err)
      setError(err.bodyMessage || err.message || "Không thể cập nhật số dư")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý ví hệ thống</h1>
            <p className="text-gray-600 mt-2">Quản lý và theo dõi ví của tất cả người dùng trong hệ thống</p>
          </div>
          {pendingRequestsCount > 0 && (
            <a
              href="/admin/wallet-requests"
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="font-semibold">
                {pendingRequestsCount} yêu cầu đang chờ
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <p>{success}</p>
            <button onClick={() => setSuccess(null)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <p>{error}</p>
            <button onClick={() => setError(null)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* System Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm mb-2">Tổng số dư hệ thống</p>
            <p className="text-3xl font-bold">
              {summary.totalSystemBalance.toLocaleString("vi-VN")} ₫
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-green-100 text-sm mb-2">Số dư SystemAdmin</p>
            <p className="text-3xl font-bold">
              {summary.systemAdminBalance.toLocaleString("vi-VN")} ₫
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-purple-100 text-sm mb-2">Tổng số dư User</p>
            <p className="text-3xl font-bold">
              {summary.allUsersBalance.toLocaleString("vi-VN")} ₫
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-orange-100 text-sm mb-2">Tổng số User</p>
            <p className="text-3xl font-bold">{summary.totalUsers}</p>
            <p className="text-orange-100 text-xs mt-2">
              {summary.totalCustomers} Customer, {summary.totalEnterpriseAdmins} EnterpriseAdmin
            </p>
          </div>
        </div>
      )}

      {/* Users with Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-bold text-yellow-900">
                Người dùng có yêu cầu đang chờ ({pendingRequests.length})
              </h2>
            </div>
            <a
              href="/admin/wallet-requests"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Xem tất cả →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(pendingRequests.map(r => r.userId)))
              .filter(userId => userId > 0) // Ensure valid userId
              .map(userId => {
              const userRequests = getUserPendingRequests(userId)
              // Double check: ensure all requests belong to this userId
              const validatedRequests = userRequests.filter(req => req.userId === userId)
              
              // Skip if no valid requests
              if (validatedRequests.length === 0) {
                return null
              }
              
              const userInfo = getUserInfoForRequest(userId)
              const totalAmount = validatedRequests.reduce((sum, r) => sum + r.amount, 0)
              
              return (
                <div
                  key={userId}
                  className="bg-white rounded-lg p-4 border-2 border-yellow-300 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{userInfo.userName}</p>
                      {userInfo.userEmail && (
                        <p className="text-sm text-gray-600">{userInfo.userEmail}</p>
                      )}
                      {userInfo.userRole && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className={`px-1.5 py-0.5 rounded ${
                            userInfo.userRole === "SystemAdmin" ? "bg-purple-100 text-purple-800" :
                            userInfo.userRole === "EnterpriseAdmin" ? "bg-blue-100 text-blue-800" :
                            "bg-green-100 text-green-800"
                          }`}>
                            {userInfo.userRole}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">ID: {userId}</p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-bold">
                      {userRequests.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {validatedRequests.map(req => {
                      // Double check: ensure request belongs to this user
                      if (req.userId !== userId) {
                        console.warn(`Request ${req.id} userId mismatch: expected ${userId}, got ${req.userId}`)
                        return null
                      }
                      return (
                        <div key={req.id} className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${
                            req.type === "deposit" ? "text-green-600" : "text-red-600"
                          }`}>
                            {req.type === "deposit" ? "Nạp" : "Rút"}: {req.amount.toLocaleString("vi-VN")} ₫
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      Tổng: <span className="font-semibold text-gray-900">{totalAmount.toLocaleString("vi-VN")} ₫</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {validatedRequests.length} yêu cầu
                    </p>
                  </div>
                </div>
              )
            }).filter((item): item is React.ReactElement => item !== null)}
          </div>
        </div>
      )}

      {/* User Wallets List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Danh sách ví người dùng</h2>
          <div className="text-sm text-gray-600">
            Trang {page} - {userWallets.length} kết quả
          </div>
        </div>

        {userWallets.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-gray-500 text-lg">Chưa có ví nào trong hệ thống</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tên</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vai trò</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Số dư</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Giao dịch</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Yêu cầu</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {userWallets.map((wallet) => {
                  // Ensure wallet has valid userId
                  if (!wallet.userId) {
                    return null
                  }
                  
                  const hasPendingRequests = getUserIdsWithPendingRequests().has(wallet.userId)
                  const userPendingRequests = getUserPendingRequests(wallet.userId)
                  
                  // Validate: ensure all requests belong to this wallet's userId
                  const validatedPendingRequests = userPendingRequests.filter(req => req.userId === wallet.userId)
                  
                  return (
                    <tr 
                      key={wallet.userId} 
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        hasPendingRequests ? "bg-yellow-50 border-l-4 border-l-yellow-500" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {wallet.userId}
                          {hasPendingRequests && (
                            <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-xs font-bold">
                              {userPendingRequests.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {wallet.userName}
                          {hasPendingRequests && (
                            <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{wallet.userEmail}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          wallet.userRole === "SystemAdmin" ? "bg-purple-100 text-purple-800" :
                          wallet.userRole === "EnterpriseAdmin" ? "bg-blue-100 text-blue-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {wallet.userRole}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {wallet.balance.toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {wallet.totalTransactions}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasPendingRequests && validatedPendingRequests.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {validatedPendingRequests.length}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {hasPendingRequests && validatedPendingRequests.length > 0 && (
                            <a
                              href="/admin/wallet-requests"
                              className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs font-medium"
                              title={`${validatedPendingRequests.length} yêu cầu đang chờ`}
                            >
                              Yêu cầu ({validatedPendingRequests.length})
                            </a>
                          )}
                          <button
                            onClick={() => loadUserWalletDetails(wallet.userId)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserId(wallet.userId)
                              setUpdateAmount("")
                              setUpdateDescription("")
                              setShowUpdateBalanceModal(true)
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                          >
                            Cập nhật
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {userWallets.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">Trang {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={userWallets.length < pageSize}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* User Wallet Details Modal */}
      {showUserDetails && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết ví người dùng</h2>
              <button
                onClick={() => {
                  setShowUserDetails(false)
                  setSelectedUserId(null)
                  setSelectedWallet(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Wallet Info */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                <p className="text-indigo-100 text-sm mb-2">Số dư hiện tại</p>
                <p className="text-4xl font-bold mb-2">
                  {selectedWallet.balance.toLocaleString("vi-VN")} ₫
                </p>
                <p className="text-indigo-100 text-sm">Đơn vị: {selectedWallet.currency}</p>
              </div>

              {/* Wallet Info Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Wallet ID</p>
                  <p className="font-semibold text-gray-900">{selectedWallet.id}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedWallet.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Để xem lịch sử giao dịch chi tiết, vui lòng yêu cầu user đăng nhập và xem trong trang "Ví của tôi" của họ.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Balance Modal */}
      {showUpdateBalanceModal && selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Cập nhật số dư</h2>
              <button
                onClick={() => {
                  setShowUpdateBalanceModal(false)
                  setUpdateAmount("")
                  setUpdateDescription("")
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)}
                  placeholder="Nhập số tiền (dương = cộng, âm = trừ)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Số dương để cộng tiền, số âm để trừ tiền
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={updateDescription}
                  onChange={(e) => setUpdateDescription(e.target.value)}
                  placeholder="Nhập mô tả cho giao dịch"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUpdateBalanceModal(false)
                  setUpdateAmount("")
                  setUpdateDescription("")
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateBalance}
                disabled={updating}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {updating ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

