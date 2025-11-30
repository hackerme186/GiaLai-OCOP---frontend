"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { isLoggedIn } from "@/lib/auth"
import { getCurrentUser, getShipperOrders, shipOrder, deliverOrder, getPaymentsByOrder, updatePaymentStatus, type Order, type User, type Payment } from "@/lib/api"
import Image from "next/image"

export default function ShipperOrdersPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [filter, setFilter] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const init = async () => {
            const loggedIn = await isLoggedIn()
            if (!loggedIn) {
                router.replace("/login?redirect=/shipper/orders")
                return
            }

            try {
                const currentUser = await getCurrentUser()
                setUser(currentUser)
                
                // Allow Shipper, EnterpriseAdmin, or SystemAdmin
                const allowedRoles = ["Shipper", "EnterpriseAdmin", "SystemAdmin"]
                if (!allowedRoles.includes(currentUser.role)) {
                    setError("Bạn không có quyền truy cập trang này. Chỉ Shipper mới có thể quản lý giao hàng.")
                    setLoading(false)
                    return
                }

                // Load orders assigned to this shipper using getShipperOrders API
                const shipperOrders = await getShipperOrders()
                setOrders(shipperOrders)
            } catch (err) {
                console.error("Failed to load orders:", err)
                const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng"
                setError(errorMessage)
                
                if (err instanceof Error && (err as any).isAuthError) {
                    setTimeout(() => {
                        router.replace("/login?redirect=/shipper/orders")
                    }, 2000)
                }
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    // Filter and search orders
    const filteredOrders = useMemo(() => {
        let filtered = orders

        // Filter by status
        if (filter !== "all") {
            const statusMap: Record<string, string[]> = {
                "processing": ["Processing"],
                "shipped": ["Shipped"],
                "completed": ["Completed"],
            }
            const statuses = statusMap[filter] || []
            if (statuses.length > 0) {
                filtered = filtered.filter(order => 
                    statuses.some(s => order.status?.toLowerCase().includes(s.toLowerCase()))
                )
            }
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(order => {
                if (order.id.toString().includes(query)) return true
                if (order.orderItems?.some(item => 
                    item.productName?.toLowerCase().includes(query) ||
                    item.enterpriseName?.toLowerCase().includes(query)
                )) return true
                return false
            })
        }

        return filtered
    }, [orders, filter, searchQuery])

    const handleShipOrder = async (orderId: number) => {
        try {
            await shipOrder(orderId)
            // Reload orders
            const shipperOrders = await getShipperOrders()
            setOrders(shipperOrders)
            setSuccessMessage(`Đã xác nhận bắt đầu giao hàng cho đơn hàng #${orderId}!`)
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không thể xác nhận bắt đầu giao hàng")
        }
    }

    const handleConfirmDelivery = async (orderId: number) => {
        try {
            // Use deliverOrder API which handles COD payment automatically
            await deliverOrder(orderId)
            // Reload orders
            const shipperOrders = await getShipperOrders()
            setOrders(shipperOrders)
            setSuccessMessage(`Đã xác nhận giao hàng thành công cho đơn hàng #${orderId}!`)
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không thể xác nhận giao hàng")
        }
    }

    const handleTransferPayment = async (orderId: number) => {
        try {
            // Get payments for this order
            const payments = await getPaymentsByOrder(orderId)
            
            // Update all payments to "Paid" status
            const updatePromises = payments.map(payment => 
                updatePaymentStatus(payment.id, { status: "Paid" })
            )
            await Promise.all(updatePromises)
            
            setSuccessMessage(`Đã chuyển tiền cho người bán cho đơn hàng #${orderId}!`)
            setTimeout(() => setSuccessMessage(null), 3000)
            
            // Reload orders to refresh payment status
            const shipperOrders = await getShipperOrders()
            setOrders(shipperOrders)
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không thể chuyển tiền")
        }
    }

    const hasOrders = filteredOrders.length > 0

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quản lý giao hàng</h1>
                    <p className="text-sm text-gray-500">Xác nhận giao hàng và chuyển tiền cho người bán</p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-50 border-2 border-green-200 text-green-800 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{successMessage}</span>
                        </div>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow-sm border-b border-gray-200 mb-6 overflow-x-auto">
                    <div className="flex space-x-1 min-w-max">
                        {[
                            { id: "all", label: "Tất cả" },
                            { id: "processing", label: "Chờ giao" },
                            { id: "shipped", label: "Đang giao" },
                            { id: "completed", label: "Đã giao" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`relative px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                    filter === tab.id
                                        ? "text-green-600"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {tab.label}
                                {filter === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-2xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo ID đơn hàng, tên sản phẩm..."
                            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="bg-white shadow-lg rounded-lg p-12 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
                        <p className="mt-4 text-gray-600 font-medium">Đang tải đơn hàng...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-lg px-5 py-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-medium">{error}</p>
                        </div>
                    </div>
                ) : !hasOrders ? (
                    <div className="bg-white shadow-lg rounded-lg p-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đơn hàng</h3>
                        <p className="text-gray-500">Chưa có đơn hàng nào cần giao.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <ShipperOrderCard
                                key={order.id}
                                order={order}
                                onShipOrder={handleShipOrder}
                                onConfirmDelivery={handleConfirmDelivery}
                                onTransferPayment={handleTransferPayment}
                            />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}

interface ShipperOrderCardProps {
    order: Order
    onShipOrder?: (orderId: number) => void
    onConfirmDelivery: (orderId: number) => void
    onTransferPayment: (orderId: number) => void
}

function ShipperOrderCard({ order, onShipOrder, onConfirmDelivery, onTransferPayment }: ShipperOrderCardProps) {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loadingPayments, setLoadingPayments] = useState(false)

    useEffect(() => {
        const loadPayments = async () => {
            setLoadingPayments(true)
            try {
                const paymentData = await getPaymentsByOrder(order.id)
                setPayments(paymentData)
            } catch (err) {
                console.error("Failed to load payments:", err)
            } finally {
                setLoadingPayments(false)
            }
        }
        loadPayments()
    }, [order.id])

    const isProcessing = order.status?.toLowerCase().includes("processing")
    const isShipped = order.status?.toLowerCase().includes("shipped")
    const isCompleted = order.status?.toLowerCase().includes("completed")
    const hasUnpaidPayments = payments.some(p => p.status?.toLowerCase() !== "paid")

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Order Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="text-sm text-gray-500">Mã đơn hàng</div>
                        <div className="font-bold text-gray-900">#{order.id}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Ngày đặt</div>
                        <div className="text-sm font-medium text-gray-900">
                            {order.orderDate ? new Date(order.orderDate).toLocaleDateString("vi-VN") : "N/A"}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Tổng tiền</div>
                        <div className="text-lg font-bold text-green-600">
                            {order.totalAmount.toLocaleString("vi-VN")}₫
                        </div>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                    isCompleted ? "bg-green-100 text-green-600" : 
                    isShipped ? "bg-blue-100 text-blue-600" : 
                    "bg-yellow-100 text-yellow-600"
                }`}>
                    {isCompleted ? "ĐÃ GIAO" : isShipped ? "ĐANG GIAO" : "CHỜ GIAO"}
                </div>
            </div>

            {/* Order Items */}
            {order.orderItems && order.orderItems.length > 0 && (
                <div className="p-4 space-y-3">
                    {order.orderItems.map((item) => (
                        <div key={item.id} className="flex gap-4 pb-3 border-b border-gray-100 last:border-0">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                <Image
                                    src={item.productImageUrl || "/hero.jpg"}
                                    alt={item.productName || `Sản phẩm #${item.productId}`}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                                    {item.productName || `Sản phẩm #${item.productId}`}
                                </h3>
                                <div className="text-sm text-gray-600">
                                    <span className="font-semibold text-green-600">
                                        {item.price.toLocaleString("vi-VN")}₫
                                    </span>
                                    <span className="text-gray-500"> x {item.quantity}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Shipping Address */}
            {order.shippingAddress && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Địa chỉ giao hàng:</div>
                    <div className="text-sm text-gray-900">{order.shippingAddress}</div>
                </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2">
                {isProcessing && onShipOrder && (
                    <button
                        onClick={() => {
                            if (confirm(`Xác nhận bắt đầu giao hàng cho đơn hàng #${order.id}?`)) {
                                onShipOrder(order.id)
                            }
                        }}
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                        Bắt đầu giao hàng
                    </button>
                )}
                {isShipped && (
                    <button
                        onClick={() => {
                            if (confirm(`Xác nhận đã giao hàng thành công cho đơn hàng #${order.id}?`)) {
                                onConfirmDelivery(order.id)
                            }
                        }}
                        className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                    >
                        Xác nhận giao hàng thành công
                    </button>
                )}
                {isCompleted && hasUnpaidPayments && (
                    <button
                        onClick={() => {
                            if (confirm(`Xác nhận chuyển tiền cho người bán cho đơn hàng #${order.id}?`)) {
                                onTransferPayment(order.id)
                            }
                        }}
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                        Chuyển tiền cho người bán
                    </button>
                )}
                {isCompleted && !hasUnpaidPayments && (
                    <div className="px-4 py-2 text-sm font-semibold text-green-600 bg-green-50 rounded">
                        Đã chuyển tiền
                    </div>
                )}
            </div>
        </div>
    )
}

