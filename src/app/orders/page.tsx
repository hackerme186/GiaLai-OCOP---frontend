"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { useRouter } from "next/navigation"
import { isLoggedIn } from "@/lib/auth"
import { getOrders, updateOrderStatus, type Order } from "@/lib/api"

export default function OrdersPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [filter, setFilter] = useState<string>("all")

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
                setOrders(list)
            } catch (err) {
                console.error("Failed to load orders:", err)
                setError(err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng")
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    const hasOrders = orders.length > 0

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-5xl mx-auto px-4 py-10">
                <div className="flex flex-col gap-4 mb-8">
                    <div>
                        <p className="text-sm text-gray-500">Lịch sử mua hàng</p>
                        <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { id: "all", label: "Tất cả" },
                            { id: "processing", label: "Đang xử lý" },
                            { id: "shipped", label: "Đang giao" },
                            { id: "completed", label: "Hoàn tất" },
                            { id: "cancelled", label: "Đã hủy" },
                        ].map((chip) => (
                            <FilterChip
                                key={chip.id}
                                label={chip.label}
                                active={filter === chip.id}
                                onClick={() => setFilter(chip.id)}
                            />
                        ))}
                    </div>
                </div>

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
                        <span>{successMessage}</span>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                            Đóng
                        </button>
                    </div>
                )}
                {loading ? (
                    <div className="bg-white shadow rounded-lg p-10 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
                        <p className="mt-4 text-gray-600">Đang tải đơn hàng...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
                        {error}
                    </div>
                ) : !hasOrders ? (
                    <div className="bg-white shadow rounded-lg p-10 text-center text-gray-500">
                        Bạn chưa có đơn hàng nào. Hãy khám phá <a href="/products" className="text-indigo-600 hover:underline">sản phẩm OCOP</a> để mua sắm.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders
                            .filter((order) => {
                                if (filter === "all") return true
                                return order.status?.toLowerCase() === filter
                            })
                            .map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onCancelled={(message) => {
                                        setSuccessMessage(message)
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
    const createdAt = useMemo(() => {
        if (!order.orderDate) return null
        try {
            return new Intl.DateTimeFormat("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }).format(new Date(order.orderDate))
        } catch {
            return order.orderDate
        }
    }, [order.orderDate])

    const totalItems = order.orderItems?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0

    return (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="flex flex-col gap-4 px-6 py-5 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Mã đơn</p>
                        <p className="text-2xl font-semibold text-gray-900">#{order.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <StatusBadge label={order.status} type="order" />
                        <StatusBadge label={order.paymentStatus} type="payment" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <InfoTile label="Ngày tạo" value={createdAt || "(chưa xác định)"} />
                    <InfoTile label="Tổng tiền" value={`${order.totalAmount?.toLocaleString("vi-VN")} ₫`} />
                    <InfoTile label="Số sản phẩm" value={totalItems} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoTile label="Phương thức thanh toán" value={order.paymentMethod || "Chưa cập nhật"} />
                    <InfoTile label="Địa chỉ giao hàng" value={order.shippingAddress || "(chưa cập nhật)"} />
                </div>
            </div>
            {order.orderItems && order.orderItems.length > 0 && (
                <div className="border-t border-gray-100 px-6 py-5">
                    <p className="text-sm font-semibold text-gray-900 mb-4">Sản phẩm trong đơn</p>
                    <div className="space-y-4">
                        {order.orderItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-gray-100 p-4 bg-gray-50"
                            >
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-100">
                                    <Image
                                        src="/hero.jpg"
                                        alt={item.productName || `Sản phẩm #${item.productId}`}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">
                                        {item.productName || `Sản phẩm #${item.productId}`}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Đơn giá: {(item.price || 0).toLocaleString("vi-VN")} ₫
                                    </p>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                    <div className="text-center">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Số lượng</p>
                                        <p className="text-base font-semibold text-gray-900">{item.quantity}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Thành tiền</p>
                                        <p className="text-base font-semibold text-indigo-600">
                                            {((item.price || 0) * (item.quantity || 0)).toLocaleString("vi-VN")} ₫
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {order.payments && order.payments.length > 0 && (
                <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Thông tin thanh toán</p>
                    <div className="space-y-3">
                        {order.payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-700 rounded-lg border border-gray-200 bg-white px-4 py-3"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        #{payment.id} · {payment.method} · {payment.amount.toLocaleString("vi-VN")} ₫
                                    </p>
                                    {payment.enterpriseName && (
                                        <p className="text-xs text-gray-500">Doanh nghiệp: {payment.enterpriseName}</p>
                                    )}
                                </div>
                                <StatusBadge label={payment.status} type="payment" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {order.status === "Pending" && (
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-sm text-gray-600">
                            Đơn hàng đang chờ doanh nghiệp xử lý. Bạn có thể hủy nếu không còn nhu cầu.
                        </p>
                        <CancelOrderButton order={order} onCancelled={onCancelled} />
                    </div>
                </div>
            )}
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
        if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return
        setPending(true)
        try {
            await updateOrderStatus(order.id, { status: "Cancelled" })
            onCancelled(`Đơn hàng #${order.id} đã được hủy thành công.`)
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không thể hủy đơn hàng")
        } finally {
            setPending(false)
        }
    }

    return (
        <button
            onClick={handleCancel}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
            {pending ? "Đang hủy..." : "Hủy đơn hàng"}
        </button>
    )
}


