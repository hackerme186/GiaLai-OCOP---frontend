"use client"

import { useState, useEffect } from "react"
import { createOrder, getCurrentUser, updateCurrentUser, type CreateOrderDto, type User } from "@/lib/api"
import { 
  getSavedShippingAddresses, 
  getDefaultShippingAddress,
  syncMainAddressFromBackend,
  type SavedShippingAddress 
} from "@/lib/shipping-addresses"
import { useRouter } from "next/navigation"
import { isLoggedIn } from "@/lib/auth"
import Image from "next/image"
import { CartItem } from "@/lib/cart"
import { getCurrentAddress } from "@/lib/geolocation"

interface CheckoutModalProps {
    isOpen: boolean
    onClose: () => void
    cartItems: CartItem[]
    totalAmount: number
    onOrderCreated: () => void
}

export default function CheckoutModal({
    isOpen,
    onClose,
    cartItems,
    totalAmount,
    onOrderCreated,
}: CheckoutModalProps) {
    const router = useRouter()
    const [shippingAddress, setShippingAddress] = useState("")
    const [paymentMethod, setPaymentMethod] = useState<"COD" | "BankTransfer">("COD")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [checkingAuth, setCheckingAuth] = useState(false)
    const [loadingAddress, setLoadingAddress] = useState(false)
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [savedAddresses, setSavedAddresses] = useState<SavedShippingAddress[]>([])
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
    const [showSavedAddresses, setShowSavedAddresses] = useState(false)

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setError(null)
            
            // Check authentication when modal opens
            const checkAuth = async () => {
                setCheckingAuth(true)
                try {
                    const loggedIn = await isLoggedIn()
                    if (!loggedIn) {
                        setError("Vui lòng đăng nhập để đặt hàng")
                        setTimeout(() => {
                            router.push("/login?redirect=/cart")
                            onClose()
                        }, 2000)
                        return
                    }
                    
                    // Load shipping address from user profile (always load fresh)
                    try {
                        const user = await getCurrentUser()
                        setCurrentUser(user)
                        
                        // Đồng bộ địa chỉ từ backend
                        if (user.shippingAddress) {
                            syncMainAddressFromBackend(user.shippingAddress)
                        }
                        
                        // Load danh sách địa chỉ đã lưu
                        const addresses = getSavedShippingAddresses()
                        setSavedAddresses(addresses)
                        
                        // Lấy địa chỉ mặc định hoặc địa chỉ đầu tiên
                        const defaultAddr = getDefaultShippingAddress()
                        if (defaultAddr) {
                            setShippingAddress(defaultAddr.address)
                            setSelectedAddressId(defaultAddr.id)
                        } else if (user.shippingAddress) {
                            setShippingAddress(user.shippingAddress)
                            setSelectedAddressId(null)
                        } else {
                            setShippingAddress("")
                            setSelectedAddressId(null)
                        }
                    } catch (err) {
                        console.warn("Không thể tải địa chỉ giao hàng từ profile:", err)
                        setShippingAddress("")
                        setSelectedAddressId(null)
                    }
                } catch (err) {
                    setError("Không thể xác thực người dùng. Vui lòng đăng nhập lại.")
                } finally {
                    setCheckingAuth(false)
                }
            }
            checkAuth()
        } else {
            // Reset form state when modal closes
            setShippingAddress("")
            setPaymentMethod("COD")
            setError(null)
            setIsSubmitting(false)
            setCurrentUser(null)
            setSavedAddresses([])
            setSelectedAddressId(null)
            setShowSavedAddresses(false)
        }
    }, [isOpen, router, onClose])

    const handleGetCurrentLocation = async () => {
        setLoadingAddress(true)
        setError(null)
        try {
            const addressResult = await getCurrentAddress()
            setShippingAddress(addressResult.address)
            // Address will be saved to profile when order is created (if backend supports it)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể lấy địa chỉ từ GPS")
        } finally {
            setLoadingAddress(false)
        }
    }

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Verify authentication again before submitting
        const loggedIn = await isLoggedIn()
        if (!loggedIn) {
            setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
            setTimeout(() => {
                router.push("/login?redirect=/cart")
                onClose()
            }, 2000)
            return
        }

        if (!shippingAddress.trim()) {
            setError("Vui lòng nhập địa chỉ giao hàng")
            return
        }

        if (cartItems.length === 0) {
            setError("Giỏ hàng trống, không thể tạo đơn hàng")
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const addressToSave = shippingAddress.trim()
            
            // Create order (address will be saved with the order)
            const orderPayload: CreateOrderDto = {
                shippingAddress: addressToSave,
                items: cartItems.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                })),
                paymentMethod: paymentMethod,
            }

            const order = await createOrder(orderPayload)

            // Save address to profile after order is created for future use
            if (addressToSave && currentUser) {
                try {
                    // Include name field as backend requires it for validation
                    await updateCurrentUser({ 
                        name: currentUser.name || "", 
                        shippingAddress: addressToSave 
                    })
                    console.log("✅ Đã lưu địa chỉ giao hàng vào hồ sơ")
                } catch (err) {
                    // Silently fail - order is already created, address is saved with the order
                    console.debug("⚠️ Không thể lưu địa chỉ vào profile (đơn hàng đã được tạo thành công):", err)
                }
            }

            // If BankTransfer, redirect to payment page
            if (paymentMethod === "BankTransfer") {
                router.push(`/payment/${order.id}?method=BankTransfer`)
                onOrderCreated()
            } else {
                // COD - just show success and close
                onOrderCreated()
                onClose()
                router.push(`/orders`)
            }
        } catch (err) {
            console.error("Failed to create order:", err)
            const errorMessage = err instanceof Error ? err.message : "Không thể tạo đơn hàng. Vui lòng thử lại."
            setError(errorMessage)
            
            // If authentication error, redirect to login
            if (err instanceof Error && (err as any).isAuthError) {
                setTimeout(() => {
                    router.push("/login?redirect=/cart")
                    onClose()
                }, 2000)
            } else {
                setIsSubmitting(false)
            }
        }
    }

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) {
                    onClose()
                }
            }}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-200 scale-100">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Thanh toán</h2>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all disabled:opacity-50"
                            aria-label="Đóng"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {checkingAuth ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
                                <p className="text-sm text-gray-600 font-medium">Đang kiểm tra đăng nhập...</p>
                            </div>
                        </div>
                    ) : error && error.includes("đăng nhập") ? (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl px-5 py-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="text-sm text-yellow-800 font-medium">{error}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    router.push("/login?redirect=/cart")
                                    onClose()
                                }}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                            >
                                Đăng nhập ngay
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Hủy
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Payment Method */}
                            <div>
                                <label className="block text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    Phương thức thanh toán
                                </label>
                                <div className="space-y-3">
                                    <label className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        paymentMethod === "COD" 
                                            ? "border-indigo-500 bg-indigo-50 shadow-md" 
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={paymentMethod === "COD"}
                                            onChange={(e) => setPaymentMethod(e.target.value as "COD")}
                                            className="mt-1 w-5 h-5 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                                            disabled={isSubmitting}
                                        />
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                        paymentMethod === "COD" ? "bg-indigo-100" : "bg-gray-100"
                                                    }`}>
                                                        <svg className={`w-6 h-6 ${paymentMethod === "COD" ? "text-indigo-600" : "text-gray-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <span className="text-base font-semibold text-gray-900">Thanh toán khi nhận hàng</span>
                                                        {paymentMethod === "COD" && (
                                                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">
                                                                Đã chọn
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1.5 ml-[3.25rem]">Thanh toán bằng tiền mặt khi nhận hàng (COD)</p>
                                        </div>
                                    </label>

                                    <label className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        paymentMethod === "BankTransfer" 
                                            ? "border-indigo-500 bg-indigo-50 shadow-md" 
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="BankTransfer"
                                            checked={paymentMethod === "BankTransfer"}
                                            onChange={(e) => setPaymentMethod(e.target.value as "BankTransfer")}
                                            className="mt-1 w-5 h-5 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                                            disabled={isSubmitting}
                                        />
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                        paymentMethod === "BankTransfer" ? "bg-indigo-100" : "bg-gray-100"
                                                    }`}>
                                                        <svg className={`w-6 h-6 ${paymentMethod === "BankTransfer" ? "text-indigo-600" : "text-gray-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <span className="text-base font-semibold text-gray-900">Chuyển khoản ngân hàng</span>
                                                        {paymentMethod === "BankTransfer" && (
                                                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">
                                                                Đã chọn
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1.5 ml-[3.25rem]">Thanh toán qua chuyển khoản ngân hàng</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label htmlFor="shippingAddress" className="block text-base font-bold text-gray-900 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Địa chỉ giao hàng <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {savedAddresses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                                {showSavedAddresses ? 'Ẩn' : 'Chọn địa chỉ'}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleGetCurrentLocation}
                                            disabled={loadingAddress || isSubmitting}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loadingAddress ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                                                    <span>Đang tải...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span>Lấy từ GPS</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Danh sách địa chỉ đã lưu */}
                                {showSavedAddresses && savedAddresses.length > 0 && (
                                    <div className="mb-3 space-y-2 max-h-48 overflow-y-auto">
                                        {savedAddresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                onClick={() => {
                                                    setShippingAddress(addr.address)
                                                    setSelectedAddressId(addr.id)
                                                    setShowSavedAddresses(false)
                                                }}
                                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                    selectedAddressId === addr.id
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {addr.label && (
                                                                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                                    {addr.label}
                                                                </span>
                                                            )}
                                                            {addr.isDefault && (
                                                                <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                                                                    Mặc định
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-900">{addr.address}</p>
                                                    </div>
                                                    {selectedAddressId === addr.id && (
                                                        <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="relative">
                                    <textarea
                                        id="shippingAddress"
                                        value={shippingAddress}
                                        onChange={(e) => {
                                            setShippingAddress(e.target.value)
                                            setSelectedAddressId(null) // Clear selection if manually editing
                                        }}
                                        placeholder="Nhập địa chỉ giao hàng đầy đủ (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                                        rows={4}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-36 text-sm text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none bg-white"
                                        required
                                        disabled={loadingAddress || isSubmitting}
                                    />
                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleGetCurrentLocation}
                                            disabled={loadingAddress || isSubmitting}
                                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-white border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                                            title="Lấy địa chỉ từ GPS"
                                        >
                                            {loadingAddress ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent"></div>
                                                    <span>Đang tải...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span>Lấy từ GPS</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    {savedAddresses.length > 0 
                                        ? '💡 Chọn từ địa chỉ đã lưu hoặc bấm "Lấy từ GPS" để tự động điền địa chỉ từ vị trí hiện tại'
                                        : '💡 Bấm "Lấy từ GPS" để tự động điền địa chỉ từ vị trí hiện tại của bạn'
                                    }
                                </p>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Tóm tắt đơn hàng
                                </h3>
                                
                                {/* Product List */}
                                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                                    {cartItems.map((item) => (
                                        <div key={item.product.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                <Image
                                                    src={item.product.imageUrl || "/hero.jpg"}
                                                    alt={item.product.name}
                                                    width={48}
                                                    height={48}
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                                                <p className="text-xs text-gray-500">Số lượng: {item.quantity}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-bold text-gray-900">
                                                    {((item.product.price || 0) * item.quantity).toLocaleString("vi-VN")} ₫
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Summary Totals */}
                                <div className="space-y-2.5 pt-4 border-t-2 border-gray-300">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 font-medium">Số sản phẩm:</span>
                                        <span className="font-semibold text-gray-900">{cartItems.length} sản phẩm</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-base font-bold text-gray-900">Tổng cộng:</span>
                                        <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            {totalAmount.toLocaleString("vi-VN")} ₫
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {error && !error.includes("đăng nhập") && (
                                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl px-4 py-3">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || checkingAuth}
                                    className="flex-1 px-4 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Xác nhận đơn hàng</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

