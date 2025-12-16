"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { createPayment, getOrder, getPaymentsByOrder, getProduct, type Payment, type Order, type OrderItem } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import { getImageAttributes, isValidImageUrl, getImageUrl } from "@/lib/imageUtils"
import { useOrderProducts } from "@/lib/hooks/useOrderProducts"
import { QRCodeSVG } from "qrcode.react"

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
    const [orderItemsWithEnterprise, setOrderItemsWithEnterprise] = useState<OrderItem[]>([])
    // Use hook to load product details
    const { getProductName, getProductImageUrl, loadingProducts } = useOrderProducts(order?.orderItems)
    // Thông tin tài khoản SystemAdmin (dùng chung cho toàn bộ đơn hàng)
    // Thông tin mặc định của tài khoản SystemAdmin (MB Bank - NGUYEN BA QUYET)
    const ADMIN_BANK_ACCOUNT = process.env.NEXT_PUBLIC_ADMIN_BANK_ACCOUNT || "0858153779"
    const ADMIN_BANK_CODE = process.env.NEXT_PUBLIC_ADMIN_BANK_CODE || "970422" // MB Bank BIN
    const ADMIN_ACCOUNT_NAME = process.env.NEXT_PUBLIC_ADMIN_ACCOUNT_NAME || "NGUYEN BA QUYET"
    const ADMIN_QR_URL = process.env.NEXT_PUBLIC_ADMIN_QR_URL || ""

    // Chỉ lấy các payment BankTransfer của đơn hàng này (để lấy reference / trạng thái)
    const bankTransferPayments = useMemo(() => {
        return payments.filter((p) => p.method === "BankTransfer" && p.orderId === orderId)
    }, [payments, orderId])

    // Payment hiển thị cho người dùng: luôn là 1 tài khoản SystemAdmin
    const adminBankPayment: Payment | null = useMemo(() => {
        if (!order) return null
        const primaryPayment = bankTransferPayments[0]
        const amount = order.totalAmount || primaryPayment?.amount || 0
        const reference = primaryPayment?.reference || order.paymentReference || `ORDER-${order.id}`

        return {
            id: primaryPayment?.id || order.id,
            orderId: order.id,
            enterpriseId: 0,
            enterpriseName: "SystemAdmin",
            amount,
            method: "BankTransfer",
            status: primaryPayment?.status || "Pending",
            reference,
            bankCode: ADMIN_BANK_CODE,
            bankAccount: ADMIN_BANK_ACCOUNT,
            accountName: ADMIN_ACCOUNT_NAME,
            qrCodeUrl: ADMIN_QR_URL,
            notes: "Thanh toán về tài khoản SystemAdmin (duy nhất)",
            createdAt: primaryPayment?.createdAt || new Date().toISOString(),
            paidAt: primaryPayment?.paidAt,
        }
    }, [order, bankTransferPayments, ADMIN_BANK_ACCOUNT, ADMIN_BANK_CODE, ADMIN_ACCOUNT_NAME, ADMIN_QR_URL])

    // Sử dụng VietQR API để generate QR code đúng chuẩn cho các app ngân hàng Việt Nam
    const vietQRUrl = useMemo(() => {
        if (!adminBankPayment) return null
        
        const bankCode = adminBankPayment.bankCode || "970422" // MB Bank
        const accountNumber = adminBankPayment.bankAccount || ""
        const accountName = encodeURIComponent(adminBankPayment.accountName || "")
        const amount = adminBankPayment.amount || 0
        const content = encodeURIComponent(adminBankPayment.reference || "")
        
        // Sử dụng VietQR API để generate QR code đúng chuẩn EMV QR Code
        // Format: https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png?amount={amount}&addInfo={content}&accountName={accountName}
        if (bankCode && accountNumber) {
            return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${content}&accountName=${accountName}`
        }
        return null
    }, [adminBankPayment])
    
    // Fallback: Generate QR code từ thông tin chuyển khoản (nếu VietQR API không khả dụng)
    const qrCodeData = useMemo(() => {
        if (!adminBankPayment) return ""
        // Format thông tin chuyển khoản để tạo QR code fallback
        return `Chuyển khoản đến ${adminBankPayment.accountName}\nSố tài khoản: ${adminBankPayment.bankAccount}\nNgân hàng: ${adminBankPayment.bankCode}\nSố tiền: ${adminBankPayment.amount.toLocaleString("vi-VN")} ₫\nNội dung: ${adminBankPayment.reference}`
    }, [adminBankPayment])

    // Tính tổng tiền cần chuyển
    // Phải đặt trước useEffect để tuân thủ Rules of Hooks
    const totalPaymentAmount = useMemo(() => {
        if (adminBankPayment) return adminBankPayment.amount
        return 0
    }, [adminBankPayment])

    useEffect(() => {
        // QUAN TRỌNG: Reset tất cả state trước khi load dữ liệu mới
        // Đảm bảo không hiển thị dữ liệu của đơn hàng trước đó
        setOrder(null)
        setPayments([])
        setOrderItemsWithEnterprise([])
        setError(null)
        setLoading(true)
        setCreatingPayment(false)
        
        // Track orderId hiện tại để tránh race condition
        // Sử dụng ref-like pattern với object để có thể update từ cleanup
        const controller = { cancelled: false, currentOrderId: orderId }
        
        const init = async () => {
            const loggedIn = await isLoggedIn()
            if (!loggedIn) {
                router.replace("/login")
                return
            }

            try {
                // Load order mới - đảm bảo mỗi orderId có dữ liệu riêng
                const orderData = await getOrder(orderId)
                
                // Kiểm tra nếu orderId đã thay đổi (race condition)
                if (controller.currentOrderId !== orderId || controller.cancelled) {
                    console.log(`OrderId changed during load: ${controller.currentOrderId} -> ${orderId}, skipping update`)
                    return
                }
                
                // Kiểm tra orderId có khớp không (tránh race condition)
                if (orderData.id !== orderId) {
                    console.warn(`Order ID mismatch: expected ${orderId}, got ${orderData.id}`)
                    return
                }
                
                setOrder(orderData)

                // Load enterpriseId từ product nếu orderItems không có enterpriseId
                let itemsWithEnterprise = orderData.orderItems || []
                const itemsWithoutEnterprise = itemsWithEnterprise.filter(item => !item.enterpriseId)
                
                if (itemsWithoutEnterprise.length > 0) {
                    console.log("Some orderItems missing enterpriseId, loading from products...")
                    // Load products để lấy enterpriseId
                    const productPromises = itemsWithoutEnterprise.map(item => 
                        getProduct(item.productId, { silent: true }).catch(err => {
                            console.debug(`Could not load product ${item.productId}:`, err)
                            return null
                        })
                    )
                    const products = await Promise.all(productPromises)
                    
                    // Cập nhật orderItems với enterpriseId từ products
                    itemsWithEnterprise = itemsWithEnterprise.map(item => {
                        if (item.enterpriseId) return item
                        const product = products.find(p => p && p.id === item.productId)
                        if (product && product.enterpriseId) {
                            return { ...item, enterpriseId: product.enterpriseId }
                        }
                        return item
                    })
                    console.log("Updated orderItems with enterpriseId from products:", itemsWithEnterprise)
                }
                
                // Kiểm tra lại orderId trước khi set state
                if (controller.currentOrderId !== orderId || controller.cancelled) {
                    console.log(`OrderId changed during processing, skipping state update`)
                    return
                }
                
                setOrderItemsWithEnterprise(itemsWithEnterprise)

                // Load existing payments - CHỈ load payments của orderId hiện tại
                const paymentsData = await getPaymentsByOrder(orderId)
                
                // Kiểm tra lại orderId sau khi load payments
                if (controller.currentOrderId !== orderId || controller.cancelled) {
                    console.log(`OrderId changed after loading payments, skipping state update`)
                    return
                }
                
                // Đảm bảo chỉ lấy payments của orderId này (double check)
                const filteredPayments = paymentsData.filter(p => p.orderId === orderId)
                
                console.log(`Loaded payments for order ${orderId}:`, filteredPayments.length, "payments")
                console.log("Order items:", orderData.orderItems)
                
                // QUAN TRỌNG: Mỗi lần chọn thanh toán ngân hàng, tạo payment MỚI
                // Không sử dụng payments cũ - luôn tạo payment mới khi method=BankTransfer
                if (paymentMethod === "BankTransfer") {
                    // Kiểm tra lại orderId trước khi tạo payment
                    if (controller.currentOrderId !== orderId || controller.cancelled) {
                        console.log(`OrderId changed before creating payment, skipping`)
                        return
                    }
                    
                    setCreatingPayment(true)
                    try {
                        console.log(`Creating NEW payment for order ${orderId} - replacing any existing payments`)
                        
                        // Tạo payment MỚI cho orderId này
                        // Backend sẽ tạo payment mới, không merge với payments cũ
                        const newPayments = await createPayment({
                            orderId,
                            method: "BankTransfer",
                        })
                        
                        // Kiểm tra lại orderId sau khi tạo payment
                        if (controller.currentOrderId !== orderId || controller.cancelled) {
                            console.log(`OrderId changed after creating payment, skipping state update`)
                            return
                        }
                        
                        // Đảm bảo payments được tạo có orderId đúng
                        const validPayments = newPayments.filter(p => p.orderId === orderId)
                        
                        console.log(`Created ${validPayments.length} NEW payments for order ${orderId}`)
                        console.log(`Payments details:`, validPayments.map(p => ({
                            id: p.id,
                            enterpriseId: p.enterpriseId,
                            enterpriseName: p.enterpriseName,
                            amount: p.amount,
                            createdAt: p.createdAt
                        })))
                        // Sắp xếp payments theo createdAt giảm dần
                        const sortedPayments = validPayments.sort((a, b) => {
                            const dateA = new Date(a.createdAt).getTime()
                            const dateB = new Date(b.createdAt).getTime()
                            return dateB - dateA // Mới nhất trước
                        })
                        
                        // Lấy payments mới nhất
                        // Nếu có nhiều payments được tạo cùng lúc (trong vòng 1 giây), lấy tất cả
                        // Nếu không, chỉ lấy payments có createdAt mới nhất
                        const latestCreatedAt = sortedPayments[0]?.createdAt
                        if (!latestCreatedAt) {
                            console.warn("No payments with createdAt")
                            setPayments([])
                            return
                        }
                        
                        const latestTime = new Date(latestCreatedAt).getTime()
                        // Lấy tất cả payments được tạo trong vòng 2 giây (để bao gồm tất cả payments trong cùng một batch)
                        const latestPayments = sortedPayments.filter(p => {
                            const paymentTime = new Date(p.createdAt).getTime()
                            return Math.abs(paymentTime - latestTime) <= 2000 // 2 giây
                        })
                        
                        console.log(`Showing ${latestPayments.length} latest payments (created within 2 seconds of ${latestCreatedAt})`)
                        console.log(`Latest payments enterpriseIds:`, latestPayments.map(p => p.enterpriseId))
                        console.log(`Latest payments details:`, latestPayments.map(p => ({
                            id: p.id,
                            enterpriseId: p.enterpriseId,
                            enterpriseName: p.enterpriseName,
                            createdAt: p.createdAt
                        })))
                        
                        // Set payments MỚI - thay thế hoàn toàn payments cũ
                        setPayments(latestPayments)
                    } catch (err) {
                        console.error("Failed to create payment:", err)
                        if (!controller.cancelled) {
                            setError("Không thể tạo thông tin thanh toán. Vui lòng thử lại.")
                        }
                    } finally {
                        if (!controller.cancelled) {
                            setCreatingPayment(false)
                        }
                    }
                } else {
                    // Nếu không phải BankTransfer, chỉ hiển thị payments hiện có
                    // Nếu có nhiều payments, chỉ lấy payments mới nhất
                    if (filteredPayments.length > 0) {
                        const sortedPayments = filteredPayments.sort((a, b) => {
                            const dateA = new Date(a.createdAt).getTime()
                            const dateB = new Date(b.createdAt).getTime()
                            return dateB - dateA // Mới nhất trước
                        })
                        
                        // Lấy payments mới nhất (có cùng createdAt mới nhất)
                        const latestCreatedAt = sortedPayments[0]?.createdAt
                        const latestPayments = sortedPayments.filter(p => p.createdAt === latestCreatedAt)
                        
                        console.log(`Showing latest ${latestPayments.length} payments out of ${filteredPayments.length} total payments`)
                        setPayments(latestPayments)
                    } else {
                        setPayments(filteredPayments)
                    }
                }
            } catch (err) {
                if (!controller.cancelled) {
                    console.error("Failed to load payment info:", err)
                    setError(err instanceof Error ? err.message : "Không thể tải thông tin thanh toán")
                }
            } finally {
                if (!controller.cancelled) {
                    setLoading(false)
                }
            }
        }

        if (orderId) {
            init()
        }
        
        // Cleanup function: Reset state khi orderId thay đổi hoặc component unmount
        return () => {
            // Đánh dấu là đã cancel để tránh update state sau khi unmount
            controller.cancelled = true
            
            // Reset state ngay lập tức khi orderId thay đổi
            setOrder(null)
            setPayments([])
            setOrderItemsWithEnterprise([])
            setError(null)
            setLoading(true)
            setCreatingPayment(false)
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

    console.log("Final bankTransferPayments count:", bankTransferPayments.length, "amount:", totalPaymentAmount)

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

                        {/* Order Items Summary */}
                        {(() => {
                            const itemsToDisplay = orderItemsWithEnterprise.length > 0 ? orderItemsWithEnterprise : (order.orderItems || [])
                            return itemsToDisplay
                        })().length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm trong đơn hàng</h3>
                                <div className="space-y-3">
                                    {(orderItemsWithEnterprise.length > 0 ? orderItemsWithEnterprise : (order.orderItems || [])).map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                                {loadingProducts ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                                                    </div>
                                                ) : (
                                                    <Image
                                                        src={getProductImageUrl(item)}
                                                        alt={getProductName(item)}
                                                        fill
                                                        className="object-cover"
                                                        sizes="64px"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            if (!target.src.includes('hero.jpg')) {
                                                                target.src = '/hero.jpg'
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                                                    {getProductName(item)}
                                                </h4>
                                                {item.enterpriseName && (
                                                    <p className="text-xs text-gray-500 mb-1">Doanh nghiệp: {item.enterpriseName}</p>
                                                )}
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-semibold text-green-600">
                                                        {item.price.toLocaleString("vi-VN")}₫
                                                    </span>
                                                    <span className="text-gray-500"> x {item.quantity}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-green-600">
                                                    {((item.price || 0) * (item.quantity || 0)).toLocaleString("vi-VN")}₫
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                    ) : adminBankPayment ? (
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Thanh toán qua chuyển khoản</h2>
                            {/* Thông báo dùng tài khoản SystemAdmin */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-blue-800 font-semibold">
                                    Tất cả đơn hàng chuyển khoản sẽ thanh toán về <strong>tài khoản SystemAdmin (duy nhất)</strong>. Không sử dụng tài khoản của doanh nghiệp.
                                </p>
                            </div>

                            {/* Thông tin thanh toán duy nhất */}
                            <div className="border-2 border-gray-200 rounded-lg p-6">
                                <div className="mb-4 pb-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Tài khoản nhận tiền (SystemAdmin)
                                    </h3>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Thông tin chuyển khoản</h3>
                                    <div className="space-y-3 text-sm">
                                        {adminBankPayment.accountName && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Chủ tài khoản:</span>
                                                <span className="font-semibold text-gray-900">{adminBankPayment.accountName}</span>
                                            </div>
                                        )}
                                        {adminBankPayment.bankCode && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Ngân hàng:</span>
                                                <span className="font-semibold text-gray-900">{adminBankPayment.bankCode}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between mt-3">
                                        <span className="text-gray-600">Số tài khoản:</span>
                                        <span className="font-semibold text-gray-900 font-mono">{adminBankPayment.bankAccount || "Chưa cấu hình"}</span>
                                    </div>
                                    <div className="flex justify-between mt-3">
                                        <span className="text-gray-600">Số tiền:</span>
                                        <span className="font-bold text-lg text-indigo-600">
                                            {adminBankPayment.amount.toLocaleString("vi-VN")} ₫
                                        </span>
                                    </div>
                                    {adminBankPayment.reference && (
                                        <div className="flex justify-between items-start mt-3">
                                            <span className="text-gray-600">Nội dung chuyển khoản:</span>
                                            <span className="font-semibold text-gray-900 font-mono text-right break-all">{adminBankPayment.reference}</span>
                                        </div>
                                    )}
                                </div>

                                {/* QR Code */}
                                <div className="text-center mb-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Quét mã QR để thanh toán</h3>
                                    <div className="inline-block bg-white p-4 rounded-lg border-2 border-gray-200">
                                        {adminBankPayment.qrCodeUrl ? (
                                            // Ưu tiên 1: Nếu có URL QR code từ env, sử dụng image
                                            <Image
                                                src={adminBankPayment.qrCodeUrl}
                                                alt={`QR Code thanh toán - SystemAdmin`}
                                                width={300}
                                                height={300}
                                                className="w-64 h-64 object-contain"
                                                {...getImageAttributes(adminBankPayment.qrCodeUrl)}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                }}
                                            />
                                        ) : vietQRUrl ? (
                                            // Ưu tiên 2: Sử dụng VietQR API để generate QR code đúng chuẩn EMV
                                            <Image
                                                src={vietQRUrl}
                                                alt={`QR Code thanh toán - SystemAdmin`}
                                                width={300}
                                                height={300}
                                                className="w-64 h-64 object-contain"
                                                unoptimized
                                                onError={(e) => {
                                                    console.error("VietQR API error, falling back to generated QR")
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            // Fallback: Generate QR code từ thông tin chuyển khoản
                                            <div className="flex items-center justify-center">
                                                <QRCodeSVG
                                                    value={qrCodeData || `Chuyển khoản đến ${adminBankPayment.accountName}\nSố tài khoản: ${adminBankPayment.bankAccount}\nNgân hàng: ${adminBankPayment.bankCode}\nSố tiền: ${adminBankPayment.amount.toLocaleString("vi-VN")} ₫\nNội dung: ${adminBankPayment.reference}`}
                                                    size={256}
                                                    level="H"
                                                    includeMargin={true}
                                                    fgColor="#000000"
                                                    bgColor="#FFFFFF"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">
                                        Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán
                                    </p>
                                    {vietQRUrl && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            Mã QR theo chuẩn VietQR: {adminBankPayment.accountName} - {adminBankPayment.bankAccount}
                                        </p>
                                    )}
                                    {!adminBankPayment.qrCodeUrl && !vietQRUrl && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            Mã QR chứa thông tin: {adminBankPayment.accountName} - {adminBankPayment.bankAccount}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mt-6">
                                <h4 className="text-sm font-semibold text-blue-900 mb-2">Hướng dẫn thanh toán:</h4>
                                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                    <li>Quét mã QR hoặc chuyển khoản theo thông tin tài khoản SystemAdmin bên trên</li>
                                    <li>Nhập đúng nội dung chuyển khoản: <strong>{adminBankPayment.reference}</strong></li>
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

