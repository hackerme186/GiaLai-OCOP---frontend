"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { createPayment, getOrder, getPaymentsByOrder, type Payment, type Order } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import { getImageAttributes } from "@/lib/imageUtils"

// Component con sử dụng useSearchParams (phải wrap trong Suspense)
function PaymentContent() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const orderId = Number(params.orderId)
    const paymentMethod = searchParams.get("method") as "COD" | "BankTransfer" | null

    const [order, setOrder] = useState<Order | null>(null)
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [creatingPayment, setCreatingPayment] = useState(false)

    useEffect(() => {
        const init = async () => {
            const loggedIn = await isLoggedIn()
            if (!loggedIn) {
                router.replace("/login")
                return
            }

            try {
                // Load order
                const orderData = await getOrder(orderId)
                setOrder(orderData)

                // Load existing payments
                const paymentsData = await getPaymentsByOrder(orderId)
                setPayments(paymentsData)

                // If BankTransfer and no payment exists, create one
                if (paymentMethod === "BankTransfer" && paymentsData.length === 0) {
                    setCreatingPayment(true)
                    try {
                        const newPayments = await createPayment({
                            orderId,
                            method: "BankTransfer",
                        })
                        setPayments(newPayments)
                    } catch (err) {
                        console.error("Failed to create payment:", err)
                        setError("Không thể tạo thông tin thanh toán. Vui lòng thử lại.")
                    } finally {
                        setCreatingPayment(false)
                    }
                }
            } catch (err) {
                console.error("Failed to load payment info:", err)
                setError(err instanceof Error ? err.message : "Không thể tải thông tin thanh toán")
            } finally {
                setLoading(false)
            }
        }

        if (orderId) {
            init()
        }
    }, [orderId, paymentMethod, router])

    if (loading || creatingPayment) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải thông tin thanh toán...</p>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    if (error || !order) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-2xl mx-auto px-4">
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
                            {error || "Không tìm thấy đơn hàng"}
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    const bankTransferPayments = payments.filter((p) => p.method === "BankTransfer")
    const totalPaymentAmount = bankTransferPayments.reduce((sum, p) => sum + p.amount, 0)

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-3xl mx-auto px-4">
                    {/* Order Info */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Thông tin thanh toán</h1>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Mã đơn hàng:</span>
                                <span className="font-semibold text-gray-900">#{order.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tổng tiền đơn hàng:</span>
                                <span className="font-bold text-lg text-indigo-600">
                                    {order.totalAmount.toLocaleString("vi-VN")} ₫
                                </span>
                            </div>
                            {bankTransferPayments.length > 1 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tổng số tiền cần chuyển:</span>
                                    <span className="font-bold text-lg text-green-600">
                                        {totalPaymentAmount.toLocaleString("vi-VN")} ₫
                                    </span>
                                </div>
                            )}
                            {order.shippingAddress && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Địa chỉ giao hàng:</span>
                                    <span className="text-gray-900 text-right max-w-md">{order.shippingAddress}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Method */}
                    {paymentMethod === "COD" ? (
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Đơn hàng đã được tạo thành công!</h2>
                                <p className="text-gray-600 mb-6">
                                    Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => router.push("/orders")}
                                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                                    >
                                        Xem đơn hàng của tôi
                                    </button>
                                    <button
                                        onClick={() => router.push("/products")}
                                        className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition"
                                    >
                                        Tiếp tục mua sắm
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : bankTransferPayments.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Thanh toán qua chuyển khoản</h2>

                            {/* Info if multiple payments */}
                            {bankTransferPayments.length > 1 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="text-sm text-yellow-800">
                                            <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                                            <p>Đơn hàng của bạn có sản phẩm từ <strong>{bankTransferPayments.length} doanh nghiệp</strong>.</p>
                                            <p>Vui lòng chuyển khoản cho <strong>TẤT CẢ {bankTransferPayments.length} doanh nghiệp</strong> theo thông tin bên dưới.</p>
                                            <p className="mt-2 font-semibold">Tổng số tiền cần chuyển: <span className="text-lg">{totalPaymentAmount.toLocaleString("vi-VN")} ₫</span></p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* List all payments */}
                            <div className="space-y-6">
                                {bankTransferPayments.map((payment, index) => (
                                    <div key={payment.id} className="border-2 border-gray-200 rounded-lg p-6">
                                        {/* Enterprise name if available */}
                                        {payment.enterpriseName && (
                                            <div className="mb-4 pb-4 border-b border-gray-200">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Doanh nghiệp: {payment.enterpriseName}
                                                </h3>
                                                {bankTransferPayments.length > 1 && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Thanh toán {index + 1} / {bankTransferPayments.length}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Bank Info */}
                                        {payment.bankAccount && (
                                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Thông tin tài khoản ngân hàng</h3>
                                                <div className="space-y-3 text-sm">
                                                    {payment.accountName && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Chủ tài khoản:</span>
                                                            <span className="font-semibold text-gray-900">{payment.accountName}</span>
                                                        </div>
                                                    )}
                                                    {payment.bankCode && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Ngân hàng:</span>
                                                            <span className="font-semibold text-gray-900">{payment.bankCode}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Số tài khoản:</span>
                                                        <span className="font-semibold text-gray-900 font-mono">{payment.bankAccount}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Số tiền:</span>
                                                        <span className="font-bold text-lg text-indigo-600">
                                                            {payment.amount.toLocaleString("vi-VN")} ₫
                                                        </span>
                                                    </div>
                                                    {payment.reference && (
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-gray-600">Nội dung chuyển khoản:</span>
                                                            <span className="font-semibold text-gray-900 font-mono text-right break-all">{payment.reference}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* QR Code */}
                                        {payment.qrCodeUrl && (
                                            <div className="text-center mb-6">
                                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Quét mã QR để thanh toán</h3>
                                                <div className="inline-block bg-white p-4 rounded-lg border-2 border-gray-200">
                                                    <Image
                                                        src={payment.qrCodeUrl}
                                                        alt={`QR Code thanh toán - ${payment.enterpriseName || `Doanh nghiệp ${index + 1}`}`}
                                                        width={300}
                                                        height={300}
                                                        className="w-64 h-64 object-contain"
                                                        {...getImageAttributes(payment.qrCodeUrl)}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            target.style.display = 'none'
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-3">
                                                    Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mt-6">
                                <h4 className="text-sm font-semibold text-blue-900 mb-2">Hướng dẫn thanh toán:</h4>
                                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                    {bankTransferPayments.length > 1 ? (
                                        <>
                                            <li>Đơn hàng có sản phẩm từ {bankTransferPayments.length} doanh nghiệp, bạn cần chuyển khoản cho TẤT CẢ các doanh nghiệp</li>
                                            <li>Quét mã QR hoặc chuyển khoản theo thông tin tài khoản của từng doanh nghiệp bên trên</li>
                                            <li>Nhập đúng nội dung chuyển khoản cho từng doanh nghiệp (ghi rõ trong thông tin tài khoản)</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>Quét mã QR hoặc chuyển khoản theo thông tin tài khoản bên trên</li>
                                            <li>Nhập đúng nội dung chuyển khoản: <strong>{bankTransferPayments[0].reference}</strong></li>
                                        </>
                                    )}
                                    <li>Sau khi chuyển khoản thành công, đơn hàng sẽ được xử lý</li>
                                    <li>Bạn có thể theo dõi trạng thái đơn hàng tại trang "Đơn hàng của tôi"</li>
                                </ol>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => router.push("/orders")}
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                                >
                                    Xem đơn hàng của tôi
                                </button>
                                <button
                                    onClick={() => router.push("/products")}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition"
                                >
                                    Tiếp tục mua sắm
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                            <p className="text-gray-600">Đang tạo thông tin thanh toán...</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    )
}

// Component chính - wrap PaymentContent trong Suspense
export default function PaymentPage() {
    return (
        <Suspense fallback={
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải thông tin thanh toán...</p>
                    </div>
                </div>
                <Footer />
            </>
        }>
            <PaymentContent />
        </Suspense>
    )
}

