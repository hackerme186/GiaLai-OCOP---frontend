"use client"

import { useCart } from "@/lib/cart-context"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import CheckoutModal from "@/components/cart/CheckoutModal"

interface SummaryRowProps {
  label: string
  value: number
  bold?: boolean
  large?: boolean
  highlight?: boolean
}

function SummaryRow({ label, value, bold, large, highlight }: SummaryRowProps) {
  const formatted = `${value >= 0 ? "" : "-"}${Math.abs(value).toLocaleString("vi-VN")} ₫`
  return (
    <div className="flex justify-between text-sm">
      <span className={`text-gray-600 ${bold ? "font-semibold text-gray-900" : ""}`}>{label}</span>
      <span
        className={`${
          bold ? "font-semibold text-gray-900" : "text-gray-900"
        } ${large ? "text-lg" : ""} ${highlight ? "text-green-600" : ""}`}
      >
        {formatted}
      </span>
    </div>
  )
}

// Component con sử dụng useSearchParams (phải wrap trong Suspense)
function CartContent() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart()
  const searchParams = useSearchParams()
  const [isClearing, setIsClearing] = useState(false)
  const [couponInput, setCouponInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  
  // Check if this is a "Buy Now" flow - only show specific product
  const isBuyNow = searchParams.get('buyNow') === 'true'
  const buyNowProductId = searchParams.get('productId') ? parseInt(searchParams.get('productId')!) : null
  
  // Filter cart items if in "Buy Now" mode
  const displayItems = useMemo(() => {
    if (isBuyNow && buyNowProductId) {
      return cart.items.filter(item => item.product.id === buyNowProductId)
    }
    return cart.items
  }, [cart.items, isBuyNow, buyNowProductId])
  
  // Calculate totals for displayed items only
  const displaySubtotal = useMemo(() => {
    return displayItems.reduce((sum, item) => {
      return sum + (item.product.price || 0) * item.quantity
    }, 0)
  }, [displayItems])
  
  const displayTotalItems = useMemo(() => {
    return displayItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [displayItems])

  const subtotal = displaySubtotal
  const shippingCost = 0
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0
    return Math.round(subtotal * appliedCoupon.percent)
  }, [appliedCoupon, subtotal])
  const grandTotal = Math.max(subtotal - discount, 0) + shippingCost

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) {
      setCouponError("Vui lòng nhập mã giảm giá")
      return
    }
    if (code === "OCOP10") {
      setAppliedCoupon({ code, percent: 0.1 })
      setCouponError(null)
    } else if (code === "OCOP15" && subtotal >= 500000) {
      setAppliedCoupon({ code, percent: 0.15 })
      setCouponError(null)
    } else {
      setAppliedCoupon(null)
      setCouponError("Mã giảm giá không hợp lệ hoặc không đủ điều kiện")
    }
  }

  const handleClearCart = async () => {
    setIsClearing(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    clearCart()
    setIsClearing(false)
  }

  if (displayItems.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Giỏ hàng trống</h1>
              <p className="text-gray-600 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
              <Link
                href="/products"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Tiếp tục mua sắm
              </Link>
            </div>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isBuyNow ? "Thanh toán nhanh" : "Giỏ hàng của bạn"}
          </h1>
          <p className="text-gray-600">
            {displayTotalItems} sản phẩm {isBuyNow ? "đang thanh toán" : "trong giỏ hàng"}
          </p>
          {isBuyNow && cart.items.length > displayItems.length && (
            <p className="text-sm text-amber-600 mt-2">
              ⚠️ Bạn có {cart.items.length - displayItems.length} sản phẩm khác trong giỏ hàng. Chỉ sản phẩm này sẽ được thanh toán.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {displayItems.map((item) => (
              <div key={item.product.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={item.product.imageUrl || "/hero.jpg"}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    {item.product.categoryName && (
                      <p className="text-sm text-gray-500 mt-1">{item.product.categoryName}</p>
                    )}
                    {item.product.ocopRating && (
                      <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                        ⭐ OCOP {item.product.ocopRating} sao
                      </p>
                    )}
                    <div className="flex items-center mt-2">
                      <span className="text-lg font-bold text-gray-900">
                        {item.product.price?.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-l-lg"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-4 py-2 text-center min-w-[3rem] font-bold text-lg text-gray-900 bg-gray-50">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-r-lg"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {/* Item Total */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Thành tiền:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {((item.product.price || 0) * item.quantity).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart Button - Only show if not in Buy Now mode */}
            {!isBuyNow && (
              <div className="flex justify-end">
                <button
                  onClick={handleClearCart}
                  disabled={isClearing}
                  className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
                >
                  {isClearing ? "Đang xóa..." : "Xóa tất cả"}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-4 text-sm">
                <div className="border-2 rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Mã giảm giá</label>
                  <form onSubmit={(e) => { e.preventDefault(); handleApplyCoupon(); }} className="space-y-3">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Nhập mã (ví dụ: OCOP10)"
                      className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-900 bg-white focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
                    >
                      Áp dụng
                    </button>
                  </form>
                  {couponError && <p className="text-xs text-red-600 mt-2">{couponError}</p>}
                  {appliedCoupon && !couponError && (
                    <p className="text-xs text-green-600 mt-2">
                      Đã áp dụng mã {appliedCoupon.code} (-{appliedCoupon.percent * 100}%)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <SummaryRow label="Tạm tính" value={subtotal} />
                  <SummaryRow label="Giảm giá" value={-discount} highlight />
                  <SummaryRow label="Vận chuyển" value={shippingCost} />
                  <div className="border-t pt-4">
                    <SummaryRow label="Tổng cộng" value={grandTotal} bold large />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button 
                  onClick={() => setShowCheckoutModal(true)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Thanh toán ngay
                </button>
                
                <Link
                  href="/products"
                  className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-block text-center"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Thanh toán an toàn & bảo mật
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      <Footer />
      
      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cartItems={displayItems}
        totalAmount={grandTotal}
        onOrderCreated={() => {
          if (isBuyNow && buyNowProductId) {
            // Only remove the buy now product from cart
            removeFromCart(buyNowProductId)
          } else {
            // Clear entire cart
            clearCart()
          }
          setShowCheckoutModal(false)
        }}
      />
    </>
  )
}

// Component chính - wrap CartContent trong Suspense
export default function CartPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
          </div>
        </div>
        <Footer />
      </>
    }>
      <CartContent />
    </Suspense>
  )
}
