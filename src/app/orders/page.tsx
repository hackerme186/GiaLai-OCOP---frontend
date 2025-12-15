"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { useRouter } from "next/navigation"
import { isLoggedIn } from "@/lib/auth"
import { getOrders, updateOrderStatus, getProduct, createPayment, deleteOrder, getOrder, type Order, type Product } from "@/lib/api"
import { useCart } from "@/lib/cart-context"

export default function OrdersPage() {
    const router = useRouter()
    const { addToCart } = useCart()
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [filter, setFilter] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const init = async () => {
            const loggedIn = await isLoggedIn()
            if (!loggedIn) {
                router.replace("/login")
                return
            }
            try {
                const data = await getOrders()
                const list = Array.isArray(data)
                    ? data
                    : (data as any)?.items || (data as any)?.data || []
                setOrders(list as Order[])
            } catch (err) {
                console.error("Failed to load orders:", err)
                const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng"
                setError(errorMessage)
                
                // If authentication error, redirect to login
                if (err instanceof Error && (err as any).isAuthError) {
                    setTimeout(() => {
                        router.replace("/login?redirect=/orders")
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
                "pending": ["Pending"],
                "shipping": ["Shipped"],
                "awaiting": ["Processing"],
                "completed": ["Completed"],
                "cancelled": ["Cancelled"],
                "return": [] // Return/Refund - có thể không có trong backend
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
                // Search by order ID
                if (order.id.toString().includes(query)) return true
                
                // Search by product names
                if (order.orderItems?.some(item => 
                    item.productName?.toLowerCase().includes(query) ||
                    item.enterpriseName?.toLowerCase().includes(query)
                )) return true
                
                return false
            })
        }

        return filtered
    }, [orders, filter, searchQuery])

    const hasOrders = filteredOrders.length > 0

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Đơn hàng của tôi</h1>
                    <p className="text-sm text-gray-500">Quản lý và theo dõi đơn hàng của bạn</p>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow-sm border-b border-gray-200 mb-6 overflow-x-auto">
                    <div className="flex space-x-1 min-w-max">
                        {[
                            { id: "all", label: "Tất cả" },
                            { id: "pending", label: "Chờ xác nhận" },
                            { id: "shipping", label: "Vận chuyển" },
                            { id: "awaiting", label: "Chờ giao hàng" },
                            { id: "completed", label: "Hoàn thành" },
                            { id: "cancelled", label: "Đã hủy" },
                            { id: "return", label: "Trả hàng/Hoàn tiền" },
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
                            placeholder="Bạn có thể tìm kiếm theo tên Shop, ID đơn hàng hoặc Tên Sản phẩm"
                            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                    </div>
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
                        <p className="text-gray-500 mb-6">Bạn chưa có đơn hàng nào. Hãy khám phá sản phẩm OCOP để mua sắm.</p>
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Khám phá sản phẩm
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onCancelled={(message) => {
                                    setSuccessMessage(message)
                                    // Remove order from list immediately after cancellation/deletion
                                    setOrders((prev) => prev.filter((o) => o.id !== order.id))
                                }}
                            />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}

interface OrderCardProps {
    order: Order
    onCancelled: (message: string) => void
}

function OrderCard({ order, onCancelled }: OrderCardProps) {
    const router = useRouter()
    const { addToCart } = useCart()
    const [products, setProducts] = useState<Map<number, Product>>(new Map())
    const [loadingProducts, setLoadingProducts] = useState(false)

    // Get first order item for shop info
    const firstItem = order.orderItems?.[0]
    const shopName = firstItem?.enterpriseName || "OCOP Shop"
    const shopId = firstItem?.enterpriseId

    // Load product details for images
    useEffect(() => {
        const loadProducts = async () => {
            if (!order.orderItems || order.orderItems.length === 0) return
            setLoadingProducts(true)
            try {
                // Load products with silent error handling to avoid UI crash when backend is unavailable
                const productPromises = order.orderItems.map(item => 
                    getProduct(item.productId, { silent: true }).catch((err) => {
                        // Silently handle errors - backend might be unavailable
                        console.debug(`Could not load product ${item.productId}:`, err)
                        return null
                    })
                )
                const productResults = await Promise.all(productPromises)
                const productMap = new Map<number, Product>()
                productResults.forEach((product, index) => {
                    if (product && order.orderItems?.[index]) {
                        productMap.set(order.orderItems[index].productId, product)
                    }
                })
                setProducts(productMap)
            } catch (err) {
                // Silently handle errors - don't crash the UI
                console.debug("Failed to load products (backend might be unavailable):", err)
            } finally {
                setLoadingProducts(false)
            }
        }
        loadProducts()
    }, [order.orderItems])

    const getStatusInfo = (status: string) => {
        const normalized = status?.toLowerCase() || ""
        if (normalized.includes("completed")) {
            return {
                text: "HOÀN THÀNH",
                deliveryText: "Giao hàng thành công",
                color: "text-green-600",
                icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                )
            }
        }
        if (normalized.includes("shipped")) {
            return {
                text: "ĐANG GIAO",
                deliveryText: "Đang vận chuyển",
                color: "text-blue-600",
                icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                )
            }
        }
        if (normalized.includes("processing")) {
            return {
                text: "CHỜ GIAO HÀNG",
                deliveryText: "Đang xử lý",
                color: "text-yellow-600",
                icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            }
        }
        if (normalized.includes("pending")) {
            return {
                text: "CHỜ XÁC NHẬN",
                deliveryText: "Chờ xác nhận",
                color: "text-orange-600",
                icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            }
        }
        if (normalized.includes("cancelled")) {
            return {
                text: "ĐÃ HỦY",
                deliveryText: "Đã hủy",
                color: "text-gray-600",
                icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )
            }
        }
        return {
            text: status?.toUpperCase() || "CHƯA XÁC ĐỊNH",
            deliveryText: "Đang xử lý",
            color: "text-gray-600",
            icon: null
        }
    }

    const statusInfo = getStatusInfo(order.status || "")

    const handleBuyAgain = async (item: typeof firstItem) => {
        if (!item) return
        try {
            const product = products.get(item.productId) || await getProduct(item.productId)
            if (product) {
                addToCart(product, item.quantity)
                router.push("/cart")
            }
        } catch (err) {
            console.error("Failed to add product to cart:", err)
            alert("Không thể thêm sản phẩm vào giỏ hàng")
        }
    }

    if (!firstItem) return null

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Shop Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <span className="font-semibold text-gray-900">{shopName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium text-green-600 bg-white border border-green-300 rounded hover:bg-green-50 transition-colors">
                        Chat
                    </button>
                    {shopId && (
                        <Link
                            href={`/enterprises/${shopId}`}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                            Xem Shop
                        </Link>
                    )}
                </div>
            </div>

            {/* Order Status */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 text-gray-700">
                    {statusInfo.icon}
                    <span className="text-sm font-medium">{statusInfo.deliveryText}</span>
                </div>
                <span className={`text-sm font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
            </div>

            {/* Product Items */}
            {order.orderItems && order.orderItems.length > 0 && (
                <div className="p-4 space-y-4">
                    {order.orderItems.map((item) => {
                        const product = products.get(item.productId)
                        const itemTotal = (item.price || 0) * (item.quantity || 0)
                        const originalPrice = item.price || 0
                        const currentPrice = item.price || 0
                        const hasDiscount = false // Có thể tính từ product nếu có

                        return (
                            <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                {/* Product Image */}
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                    {loadingProducts ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
                                        </div>
                                    ) : (
                                        <Image
                                            src={item.productImageUrl || product?.imageUrl || "/hero.jpg"}
                                            alt={item.productName || `Sản phẩm #${item.productId}`}
                                            fill
                                            className="object-cover"
                                            sizes="96px"
                                        />
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2">
                                        {item.productName || `Sản phẩm #${item.productId}`}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Phân loại hàng: <span className="text-gray-700">Mặc định</span>
                                    </p>
                                    <div className="flex items-center gap-3 mb-2">
                                        {hasDiscount && (
                                            <span className="text-xs text-gray-400 line-through">
                                                {originalPrice.toLocaleString("vi-VN")}₫
                                            </span>
                                        )}
                                        <span className="text-base font-bold text-green-600">
                                            {currentPrice.toLocaleString("vi-VN")}₫
                                        </span>
                                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-xs text-gray-500">Thành tiền: </span>
                                        <span className="text-base font-bold text-green-600">
                                            {itemTotal.toLocaleString("vi-VN")}₫
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Action Buttons */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2">
                {order.status === "Completed" && firstItem && (
                    <button
                        onClick={() => handleBuyAgain(firstItem)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                    >
                        Mua Lại
                    </button>
                )}
                <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    Liên Hệ Người Bán
                </button>
                {/* Only show payment and cancel buttons when order is Pending (not yet confirmed by enterprise) */}
                {(() => {
                    // Logic: Customer can cancel order ONLY when enterprise has NOT confirmed yet
                    // When enterprise confirms, status changes from "Pending" to "Processing", "Shipped", etc.
                    const normalizedStatus = (order.status || "").toLowerCase().trim()
                    
                    // Order can be cancelled if status is still "Pending" (enterprise hasn't confirmed yet)
                    // Once status becomes "Processing", "Shipped", "Completed" → cannot cancel
                    const canCancel = normalizedStatus === "pending"
                    
                    return canCancel ? (
                        <>
                            <PaymentMethodModal order={order} onPaymentCreated={() => {
                                // Reload orders after payment
                                window.location.reload()
                            }} />
                            <CancelOrderButton order={order} onCancelled={onCancelled} />
                        </>
                    ) : null
                })()}
            </div>
        </div>
    )
}

interface StatusBadgeProps {
    label?: string | null
    type: "order" | "payment"
}

function StatusBadge({ label, type }: StatusBadgeProps) {
    if (!label) {
        return (
            <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                Chưa rõ
            </span>
        )
    }

    const normalized = label.toLowerCase()
    const colorMap: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-700",
        processing: "bg-blue-100 text-blue-700",
        shipped: "bg-indigo-100 text-indigo-700",
        completed: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",
        awaitingtransfer: "bg-yellow-100 text-yellow-700",
        paid: "bg-green-100 text-green-700",
    }

    const key = normalized.replace(/\s+/g, "")
    const color = colorMap[key] || "bg-gray-100 text-gray-700"
    const labelPrefix = type === "payment" ? "Thanh toán" : "Đơn hàng"

    return (
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${color}`}>
            {labelPrefix}: {label}
        </span>
    )
}

interface InfoTileProps {
    label: string
    value?: string | number | null
}

function InfoTile({ label, value }: InfoTileProps) {
    return (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
                {value || "(chưa cập nhật)"}
            </p>
        </div>
    )
}

interface FilterChipProps {
    label: string
    active?: boolean
    onClick?: () => void
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${active ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
        >
            {label}
        </button>
    )
}

interface CancelOrderButtonProps {
    order: Order
    onCancelled: (message: string) => void
}

function CancelOrderButton({ order, onCancelled }: CancelOrderButtonProps) {
    const [pending, setPending] = useState(false)

    const handleCancel = async () => {
        // Logic: Customer can cancel order ONLY when enterprise has NOT confirmed yet
        // First, refresh order status from backend to ensure we have the latest status
        let currentOrder = order
        try {
            const freshOrder = await getOrder(order.id)
            currentOrder = freshOrder
        } catch (refreshErr) {
            console.warn("Could not refresh order status, using cached status:", refreshErr)
        }
        
        // Check if order is still in Pending status (not yet confirmed by enterprise)
        const normalizedStatus = (currentOrder.status || "").toLowerCase().trim()
        
        // If status is not "Pending", it means enterprise has already confirmed/processed the order
        if (normalizedStatus !== "pending") {
            alert(`Không thể hủy đơn hàng này. Đơn hàng đã được doanh nghiệp xác nhận và đang được xử lý (Trạng thái: ${currentOrder.status}).`)
            return
        }

        // Confirm with user that order will be permanently deleted
        if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này?\n\nĐơn hàng sẽ bị xóa vĩnh viễn khỏi hệ thống và không thể khôi phục.")) {
            return
        }
        
        setPending(true)
        try {
            // Backend requires order to be in "Pending" status before deletion
            // Delete the order directly (backend will handle the deletion)
            // No need to update status to "Cancelled" first - just delete directly
            await deleteOrder(order.id)
            
            // Notify parent component that order was cancelled and deleted
            onCancelled(`Đơn hàng #${order.id} đã được hủy và xóa vĩnh viễn khỏi hệ thống.`)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Không thể hủy đơn hàng"
            
            // Check if error is about status
            if (errorMessage.includes("400") || errorMessage.includes("Pending")) {
                // Order status might have changed - refresh and check again
                try {
                    const freshOrder = await getOrder(order.id)
                    const freshStatus = (freshOrder.status || "").toLowerCase().trim()
                    if (freshStatus !== "pending") {
                        alert(`Không thể hủy đơn hàng. Đơn hàng đã được doanh nghiệp xác nhận (Trạng thái hiện tại: ${freshOrder.status}).`)
                    } else {
                        alert(`Không thể xóa đơn hàng. Vui lòng thử lại sau.`)
                    }
                } catch (refreshErr) {
                    alert(`Không thể xóa đơn hàng: ${errorMessage}`)
                }
            } else {
                alert(`Không thể xóa đơn hàng: ${errorMessage}`)
            }
        } finally {
            setPending(false)
        }
    }

    return (
        <button
            onClick={handleCancel}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 transition-colors"
        >
            {pending ? "Đang hủy..." : "Hủy đơn hàng"}
        </button>
    )
}

interface PaymentMethodModalProps {
    order: Order
    onPaymentCreated: () => void
}

function PaymentMethodModal({ order, onPaymentCreated }: PaymentMethodModalProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState<"COD" | "BankTransfer" | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handlePayment = async () => {
        if (!selectedMethod) {
            setError("Vui lòng chọn phương thức thanh toán")
            return
        }

        setIsProcessing(true)
        setError(null)

        try {
            // Create payment
            await createPayment({
                orderId: order.id,
                method: selectedMethod,
            })

            // Redirect based on payment method
            if (selectedMethod === "BankTransfer") {
                router.push(`/payment/${order.id}?method=BankTransfer`)
            } else {
                // COD - just show success and reload
                onPaymentCreated()
                setIsOpen(false)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể tạo thanh toán")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
            >
                Thanh toán ngay
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Chọn phương thức thanh toán</h2>
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    setError(null)
                                    setSelectedMethod(null)
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => setSelectedMethod("COD")}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    selectedMethod === "COD"
                                        ? "border-green-600 bg-green-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        selectedMethod === "COD" ? "border-green-600 bg-green-600" : "border-gray-300"
                                    }`}>
                                        {selectedMethod === "COD" && (
                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">Thanh toán khi nhận hàng (COD)</div>
                                        <div className="text-sm text-gray-500 mt-1">Thanh toán bằng tiền mặt khi nhận hàng</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedMethod("BankTransfer")}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    selectedMethod === "BankTransfer"
                                        ? "border-green-600 bg-green-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        selectedMethod === "BankTransfer" ? "border-green-600 bg-green-600" : "border-gray-300"
                                    }`}>
                                        {selectedMethod === "BankTransfer" && (
                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">Chuyển khoản ngân hàng</div>
                                        <div className="text-sm text-gray-500 mt-1">Thanh toán qua QR code hoặc chuyển khoản</div>
                                    </div>
                                </div>
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Tổng tiền:</span>
                                <span className="text-xl font-bold text-green-600">
                                    {order.totalAmount.toLocaleString("vi-VN")}₫
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    setError(null)
                                    setSelectedMethod(null)
                                }}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={!selectedMethod || isProcessing}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? "Đang xử lý..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}



