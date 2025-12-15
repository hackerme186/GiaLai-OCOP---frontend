"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import {
  getWalletRequests,
  getPendingWalletRequestsCount,
  processWalletRequest,
  type WalletRequest,
} from "@/lib/api"
import { isLoggedIn, getRoleFromToken } from "@/lib/auth"
import Image from "next/image"

export default function WalletRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<WalletRequest[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<"pending" | "approved" | "rejected" | "completed" | "all">("pending")
  const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(null)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)

  // Thông tin tài khoản SystemAdmin (MB Bank)
  const ADMIN_BANK_ACCOUNT = process.env.NEXT_PUBLIC_ADMIN_BANK_ACCOUNT || "0858153779"
  const ADMIN_BANK_CODE = process.env.NEXT_PUBLIC_ADMIN_BANK_CODE || "970422" // MB Bank BIN
  const ADMIN_ACCOUNT_NAME = process.env.NEXT_PUBLIC_ADMIN_ACCOUNT_NAME || "NGUYEN BA QUYET"

  // Hàm tạo QR code URL cho yêu cầu nạp tiền (từ SystemAdmin)
  const generateDepositQRCode = (request: WalletRequest): string => {
    const amount = request.amount
    const content = `NAP-${request.id}` // Nội dung chuyển khoản: NAP-{requestId}
    // Format VietQR: https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png?amount={amount}&addInfo={content}
    return `https://img.vietqr.io/image/${ADMIN_BANK_CODE}-${ADMIN_BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`
  }

  // Hàm tạo QR code URL cho tài khoản ngân hàng của user (để SystemAdmin chuyển tiền)
  const generateUserBankQRCode = (bankAccount: WalletRequest['bankAccount'], amount: number): string => {
    if (!bankAccount) return ""
    const content = `RUT-${bankAccount.userId}` // Nội dung chuyển khoản: RUT-{userId}
    // Format VietQR: https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png?amount={amount}&addInfo={content}
    return `https://img.vietqr.io/image/${bankAccount.bankCode}-${bankAccount.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`
  }

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isLoggedIn()
      if (!loggedIn) {
        router.replace("/login")
        return
      }

      const role = getRoleFromToken()
      if (role !== "SystemAdmin" && role !== "admin" && role !== "sysadmin") {
        router.replace("/home")
        return
      }

      loadData()
    }
    checkAuth()
  }, [router, filterStatus])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [requestsData, countData] = await Promise.all([
        getWalletRequests({
          status: filterStatus === "all" ? undefined : filterStatus,
          page: 1,
          pageSize: 100,
        }),
        getPendingWalletRequestsCount(),
      ])

      setRequests(requestsData)
      setPendingCount(countData.count)
    } catch (err) {
      console.error("Failed to load wallet requests:", err)
      setError(err instanceof Error ? err.message : "Không thể tải danh sách yêu cầu")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: number) => {
    try {
      setProcessing(true)
      setError(null)

      await processWalletRequest(requestId, {
        action: "approve",
      })

      alert("Yêu cầu đã được phê duyệt thành công!")
      setShowProcessModal(false)
      setSelectedRequest(null)
      await loadData()
    } catch (err) {
      console.error("Failed to approve request:", err)
      setError(err instanceof Error ? err.message : "Không thể phê duyệt yêu cầu")
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (requestId: number) => {
    if (!rejectionReason.trim()) {
      setError("Vui lòng nhập lý do từ chối")
      return
    }

    try {
      setProcessing(true)
      setError(null)

      await processWalletRequest(requestId, {
        action: "reject",
        rejectionReason: rejectionReason,
      })

      alert("Yêu cầu đã bị từ chối.")
      setShowProcessModal(false)
      setSelectedRequest(null)
      setRejectionReason("")
      await loadData()
    } catch (err) {
      console.error("Failed to reject request:", err)
      setError(err instanceof Error ? err.message : "Không thể từ chối yêu cầu")
    } finally {
      setProcessing(false)
    }
  }

  const openProcessModal = (request: WalletRequest) => {
    setSelectedRequest(request)
    setShowProcessModal(true)
    setRejectionReason("")
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải danh sách yêu cầu...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý yêu cầu ví</h1>
            {pendingCount > 0 && (
              <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                {pendingCount} yêu cầu đang chờ
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="flex border-b border-gray-200">
              {[
                { value: "pending", label: "Đang chờ", count: pendingCount },
                { value: "approved", label: "Đã phê duyệt" },
                { value: "rejected", label: "Đã từ chối" },
                { value: "completed", label: "Hoàn thành" },
                { value: "all", label: "Tất cả" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value as any)}
                  className={`px-6 py-3 font-medium transition-colors ${
                    filterStatus === tab.value
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          {requests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <p className="text-gray-500 text-lg">Không có yêu cầu nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* User Info */}
                      <div className="flex items-center gap-4 mb-4">
                        {request.userName && (
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-bold text-lg">
                              {request.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{request.userName || "N/A"}</p>
                          <p className="text-sm text-gray-600">{request.userEmail}</p>
                          <p className="text-xs text-gray-500">{request.userRole}</p>
                        </div>
                      </div>

                      {/* Request Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Loại yêu cầu</p>
                          <p className="font-semibold text-gray-900">
                            {request.type === "deposit" ? "Nạp tiền" : "Rút tiền"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Số tiền</p>
                          <p className="font-semibold text-gray-900">
                            {request.amount.toLocaleString("vi-VN")} ₫
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Số dư hiện tại</p>
                          <p className="font-semibold text-gray-900">
                            {request.currentBalance.toLocaleString("vi-VN")} ₫
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Trạng thái</p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "approved" || request.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {request.status === "pending"
                              ? "Đang chờ"
                              : request.status === "approved"
                              ? "Đã phê duyệt"
                              : request.status === "completed"
                              ? "Hoàn thành"
                              : "Đã từ chối"}
                          </span>
                        </div>
                      </div>

                      {request.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Mô tả</p>
                          <p className="text-gray-900">{request.description}</p>
                        </div>
                      )}

                      {request.rejectionReason && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-red-900">Lý do từ chối:</p>
                          <p className="text-sm text-red-700">{request.rejectionReason}</p>
                        </div>
                      )}

                      {/* QR Code for Deposit Requests */}
                      {request.type === "deposit" && request.status === "pending" && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 mb-4 border-2 border-indigo-200">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-lg font-bold text-gray-900 mb-1">
                                QR Code để chuyển tiền nạp
                              </p>
                              <p className="text-sm text-gray-600">
                                Quét mã QR để chuyển tiền vào tài khoản SystemAdmin
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row gap-6">
                            {/* QR Code */}
                            <div className="flex-shrink-0">
                              <div className="bg-white p-4 rounded-xl border-2 border-indigo-300 inline-block shadow-lg">
                                <Image
                                  src={generateDepositQRCode(request)}
                                  alt="QR Code chuyển tiền"
                                  width={250}
                                  height={250}
                                  className="rounded-lg"
                                />
                              </div>
                            </div>
                            {/* Bank Account Info */}
                            <div className="flex-1 space-y-3">
                              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                                <p className="text-sm font-semibold text-gray-900 mb-3">
                                  Thông tin tài khoản nhận tiền:
                                </p>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 w-24">Ngân hàng:</span>
                                    <span className="font-semibold text-gray-900">
                                      Ngân hàng TMCP Quân Đội (MB Bank)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 w-24">Số tài khoản:</span>
                                    <span className="font-semibold font-mono text-gray-900">
                                      {ADMIN_BANK_ACCOUNT}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 w-24">Chủ tài khoản:</span>
                                    <span className="font-semibold text-gray-900">
                                      {ADMIN_ACCOUNT_NAME}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 w-24">Số tiền:</span>
                                    <span className="font-bold text-indigo-600 text-lg">
                                      {request.amount.toLocaleString("vi-VN")} ₫
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 w-24">Nội dung:</span>
                                    <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                      NAP-{request.id}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-800 font-medium mb-1">
                                  📌 Hướng dẫn:
                                </p>
                                <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
                                  <li>Quét mã QR bằng ứng dụng ngân hàng của bạn</li>
                                  <li>Kiểm tra số tiền và thông tin tài khoản</li>
                                  <li>Xác nhận chuyển khoản</li>
                                  <li>Sau khi chuyển khoản thành công, nhấn "Phê duyệt" để cộng tiền vào ví của người dùng</li>
                                </ol>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bank Account Info with QR Code (for withdraw requests) */}
                      {request.type === "withdraw" && request.bankAccount && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 mb-4 border-2 border-green-200">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-lg font-bold text-gray-900 mb-1">
                                QR Code để chuyển tiền rút
                              </p>
                              <p className="text-sm text-gray-600">
                                Quét mã QR để chuyển tiền vào tài khoản người dùng
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row gap-6">
                            {/* QR Code */}
                            <div className="flex-shrink-0">
                              <div className="bg-white p-4 rounded-xl border-2 border-green-300 inline-block shadow-lg">
                                <Image
                                  src={generateUserBankQRCode(request.bankAccount, request.amount)}
                                  alt="QR Code chuyển tiền"
                                  width={250}
                                  height={250}
                                  className="rounded-lg"
                                />
                              </div>
                            </div>
                            {/* Bank Account Info */}
                            <div className="flex-1 space-y-3">
                              <div className="bg-white rounded-lg p-4 border border-green-200">
                                <p className="text-sm font-semibold text-gray-900 mb-3">
                                  Thông tin tài khoản ngân hàng thụ hưởng:
                                </p>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 w-24">Ngân hàng:</span>
                                    <span className="font-semibold text-gray-900">
                                      {request.bankAccount.bankName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 w-24">Số tài khoản:</span>
                                    <span className="font-semibold font-mono text-gray-900">
                                      {request.bankAccount.accountNumber}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 w-24">Chủ tài khoản:</span>
                                    <span className="font-semibold text-gray-900">
                                      {request.bankAccount.accountName}
                                    </span>
                                  </div>
                                  {request.bankAccount.branch && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-600 w-24">Chi nhánh:</span>
                                      <span className="font-semibold text-gray-900">
                                        {request.bankAccount.branch}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 w-24">Số tiền:</span>
                                    <span className="font-bold text-green-600 text-lg">
                                      {request.amount.toLocaleString("vi-VN")} ₫
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 w-24">Nội dung:</span>
                                    <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                      RUT-{request.userId}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-800 font-medium mb-1">
                                  📌 Hướng dẫn:
                                </p>
                                <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
                                  <li>Quét mã QR bằng ứng dụng ngân hàng của bạn</li>
                                  <li>Kiểm tra số tiền và thông tin tài khoản</li>
                                  <li>Xác nhận chuyển khoản</li>
                                  <li>Sau khi chuyển khoản thành công, nhấn "Phê duyệt" để trừ tiền từ ví của người dùng</li>
                                </ol>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Tạo lúc: {new Date(request.createdAt).toLocaleString("vi-VN")}
                        {request.processedAt && (
                          <> | Xử lý lúc: {new Date(request.processedAt).toLocaleString("vi-VN")}</>
                        )}
                        {request.processedByName && (
                          <> | Bởi: {request.processedByName}</>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    {request.status === "pending" && (
                      <div className="ml-4 flex flex-col gap-2">
                        <button
                          onClick={() => openProcessModal(request)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                          Xử lý
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Process Modal */}
      {showProcessModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Xử lý yêu cầu {selectedRequest.type === "deposit" ? "nạp tiền" : "rút tiền"}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Người dùng</p>
                <p className="font-semibold">{selectedRequest.userName}</p>
                <p className="text-sm text-gray-600">{selectedRequest.userEmail}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Loại yêu cầu</p>
                  <p className="font-semibold">
                    {selectedRequest.type === "deposit" ? "Nạp tiền" : "Rút tiền"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Số tiền</p>
                  <p className="font-semibold text-lg">
                    {selectedRequest.amount.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Số dư hiện tại</p>
                  <p className="font-semibold">
                    {selectedRequest.currentBalance.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Số dư sau khi xử lý</p>
                  <p className="font-semibold text-lg text-indigo-600">
                    {(
                      selectedRequest.currentBalance +
                      (selectedRequest.type === "deposit" ? selectedRequest.amount : -selectedRequest.amount)
                    ).toLocaleString("vi-VN")}{" "}
                    ₫
                  </p>
                </div>
              </div>

              {selectedRequest.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mô tả</p>
                  <p className="text-gray-900">{selectedRequest.description}</p>
                </div>
              )}

              {selectedRequest.type === "withdraw" && selectedRequest.bankAccount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Thông tin tài khoản ngân hàng thụ hưởng:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-700">Ngân hàng:</span>{" "}
                      <span className="font-semibold">{selectedRequest.bankAccount.bankName}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Số tài khoản:</span>{" "}
                      <span className="font-semibold font-mono">
                        {selectedRequest.bankAccount.accountNumber}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-700">Chủ tài khoản:</span>{" "}
                      <span className="font-semibold">{selectedRequest.bankAccount.accountName}</span>
                    </div>
                    {selectedRequest.bankAccount.qrCodeUrl && (
                      <div className="col-span-2 mt-2">
                        <Image
                          src={selectedRequest.bankAccount.qrCodeUrl}
                          alt="QR Code"
                          width={200}
                          height={200}
                          className="border border-blue-300 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProcessModal(false)
                    setSelectedRequest(null)
                    setRejectionReason("")
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Đang xử lý..." : "Từ chối"}
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Đang xử lý..." : "Phê duyệt"}
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối (bắt buộc khi từ chối)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối (nếu từ chối yêu cầu)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

