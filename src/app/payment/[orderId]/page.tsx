"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { createPayment, getOrder, getPaymentsByOrder, getProduct, type Payment, type Order, type OrderItem } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import { getImageAttributes, isValidImageUrl, getImageUrl } from "@/lib/imageUtils"

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

    // Nhóm orderItems theo enterpriseId để hiển thị với payment tương ứng
    // Sử dụng orderItemsWithEnterprise (đã load enterpriseId từ product nếu cần)
    // Phải đặt trước useEffect để tuân thủ Rules of Hooks
    const orderItemsByEnterprise = useMemo(() => {
        const itemsToUse = orderItemsWithEnterprise.length > 0 ? orderItemsWithEnterprise : (order?.orderItems || [])
        if (itemsToUse.length === 0) return new Map<number, OrderItem[]>()
        
        const grouped = new Map<number, OrderItem[]>()
        itemsToUse.forEach((item) => {
            if (item.enterpriseId) {
                const existing = grouped.get(item.enterpriseId) || []
                grouped.set(item.enterpriseId, [...existing, item])
            }
        })
        return grouped
    }, [orderItemsWithEnterprise, order?.orderItems])

    // Lấy danh sách enterpriseId từ orderItems để filter payments
    // Sử dụng orderItemsWithEnterprise (đã load enterpriseId từ product nếu cần)
    // Phải đặt trước useEffect để tuân thủ Rules of Hooks
    const enterpriseIdsInOrder = useMemo(() => {
        const itemsToUse = orderItemsWithEnterprise.length > 0 ? orderItemsWithEnterprise : (order?.orderItems || [])
        if (itemsToUse.length === 0) return new Set<number>()
        const ids = new Set<number>()
        itemsToUse.forEach((item) => {
            if (item.enterpriseId) {
                ids.add(item.enterpriseId)
            }
        })
        return ids
    }, [orderItemsWithEnterprise, order?.orderItems])

    // Chỉ lấy payments có enterpriseId trong danh sách sản phẩm của đơn hàng
    // KHÔNG hiển thị tất cả payments - chỉ hiển thị payments của doanh nghiệp có sản phẩm trong đơn hàng
    // Phải đặt trước useEffect để tuân thủ Rules of Hooks
    const bankTransferPayments = useMemo(() => {
        console.log("=== FILTERING PAYMENTS ===")
        console.log("enterpriseIdsInOrder:", Array.from(enterpriseIdsInOrder))
        console.log("total payments:", payments.length)
        console.log("payments details:", payments.map(p => ({
            id: p.id,
            orderId: p.orderId,
            enterpriseId: p.enterpriseId,
            enterpriseName: p.enterpriseName,
            method: p.method
        })))
        
        const filtered = payments.filter((p) => {
            // Chỉ lấy BankTransfer payments của đơn hàng này
            if (p.method !== "BankTransfer" || p.orderId !== orderId) {
                return false
            }
            
            // Nếu payment không có enterpriseId, không hiển thị
            if (!p.enterpriseId) {
                console.log(`❌ Payment ${p.id} has no enterpriseId - skipping`)
                return false
            }
            
            // Nếu không có enterpriseIds trong orderItems, không hiển thị payment nào
            if (enterpriseIdsInOrder.size === 0) {
                console.log("❌ No enterpriseIds in orderItems - no payments to show")
                return false
            }
            
            // Chỉ hiển thị payments có enterpriseId trong danh sách sản phẩm
            const hasMatch = enterpriseIdsInOrder.has(p.enterpriseId)
            if (!hasMatch) {
                console.log(`❌ Payment ${p.id} enterpriseId ${p.enterpriseId} NOT in orderItems. OrderItems enterpriseIds:`, Array.from(enterpriseIdsInOrder))
            } else {
                console.log(`✅ Payment ${p.id} enterpriseId ${p.enterpriseId} MATCHES - including`)
            }
            return hasMatch
        })
        
        console.log(`=== FILTERED RESULT: ${filtered.length} payments out of ${payments.length} ===`)
        console.log("Filtered payments:", filtered.map(p => ({
            id: p.id,
            enterpriseId: p.enterpriseId,
            enterpriseName: p.enterpriseName,
            amount: p.amount
        })))
        
        // Kiểm tra xem có đủ payments cho tất cả doanh nghiệp không
        const filteredEnterpriseIds = new Set(filtered.map(p => p.enterpriseId).filter(Boolean))
        const missingEnterpriseIds = Array.from(enterpriseIdsInOrder).filter(id => !filteredEnterpriseIds.has(id))
        
        if (missingEnterpriseIds.length > 0) {
            console.warn(`⚠️ WARNING: Missing payments for ${missingEnterpriseIds.length} enterprise(s):`, missingEnterpriseIds)
            console.warn(`⚠️ Expected ${enterpriseIdsInOrder.size} payments but only got ${filtered.length}`)
        } else {
            console.log(`✅ All enterprises have payments: ${filtered.length} payments for ${enterpriseIdsInOrder.size} enterprises`)
        }
        
        return filtered
    }, [payments, enterpriseIdsInOrder, orderId])

    // Tính tổng tiền cần chuyển
    // Phải đặt trước useEffect để tuân thủ Rules of Hooks
    const totalPaymentAmount = useMemo(() => {
        return bankTransferPayments.reduce((sum, p) => sum + p.amount, 0)
    }, [bankTransferPayments])

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
                        console.log(`Expected enterpriseIds from orderItems:`, Array.from(enterpriseIdsInOrder))
                        
                        // Kiểm tra xem có đủ payments cho tất cả doanh nghiệp không
                        const paymentEnterpriseIds = new Set(validPayments.map(p => p.enterpriseId).filter(Boolean))
                        const missingEnterpriseIds = Array.from(enterpriseIdsInOrder).filter(id => !paymentEnterpriseIds.has(id))
                        
                        if (missingEnterpriseIds.length > 0) {
                            console.warn(`⚠️ Missing payments for enterpriseIds:`, missingEnterpriseIds)
                            console.warn(`⚠️ Backend may not have created payments for all enterprises`)
                        }
                        
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
                        // Hiển thị TẤT CẢ payments mới nhất được tạo (cho tất cả doanh nghiệp)
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

    console.log("Final bankTransferPayments count:", bankTransferPayments.length, "enterpriseIdsInOrder:", Array.from(enterpriseIdsInOrder))

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
                        {order.orderItems && order.orderItems.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm trong đơn hàng</h3>
                                <div className="space-y-3">
                                    {order.orderItems.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                                <Image
                                                    src={isValidImageUrl(item.productImageUrl) ? getImageUrl(item.productImageUrl, "/hero.jpg") : "/hero.jpg"}
                                                    alt={item.productName || `Sản phẩm #${item.productId}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="64px"
                                                    {...getImageAttributes(item.productImageUrl)}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        if (!target.src.includes('hero.jpg')) {
                                                            target.src = '/hero.jpg'
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                                                    {item.productName || `Sản phẩm #${item.productId}`}
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
                                {bankTransferPayments.map((payment, index) => {
                                    // Lấy sản phẩm của enterprise này
                                    const enterpriseItems = payment.enterpriseId 
                                        ? (orderItemsByEnterprise.get(payment.enterpriseId) || [])
                                        : []
                                    
                                    return (
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

                                        {/* Products for this enterprise */}
                                        {enterpriseItems.length > 0 && (
                                            <div className="mb-6 pb-6 border-b border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Sản phẩm cần thanh toán:</h4>
                                                <div className="space-y-2">
                                                    {enterpriseItems.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                                            <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                                                                <Image
                                                                    src={isValidImageUrl(item.productImageUrl) ? getImageUrl(item.productImageUrl, "/hero.jpg") : "/hero.jpg"}
                                                                    alt={item.productName || `Sản phẩm #${item.productId}`}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="48px"
                                                                    {...getImageAttributes(item.productImageUrl)}
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement
                                                                        if (!target.src.includes('hero.jpg')) {
                                                                            target.src = '/hero.jpg'
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {item.productName || `Sản phẩm #${item.productId}`}
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    {item.price.toLocaleString("vi-VN")}₫ x {item.quantity}
                                                                </p>
                                                            </div>
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {((item.price || 0) * (item.quantity || 0)).toLocaleString("vi-VN")}₫
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                                                        <span className="text-sm font-semibold text-gray-700">Tổng tiền doanh nghiệp này:</span>
                                                        <span className="text-base font-bold text-indigo-600">
                                                            {payment.amount.toLocaleString("vi-VN")} ₫
                                                        </span>
                                                    </div>
                                                </div>
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
                                )})}
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

