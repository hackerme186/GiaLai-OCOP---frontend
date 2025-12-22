"use client"

import { useCart } from "@/lib/cart-context"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useQueries } from "@tanstack/react-query"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import CheckoutModal from "@/components/cart/CheckoutModal"
import { getEnterprise, getProduct, type Enterprise } from "@/lib/api"

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
        className={`${bold ? "font-semibold text-gray-900" : "text-gray-900"
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
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

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

  // Fetch all products to ensure we have latest enterprise info
  const productIds = useMemo(() => {
    return displayItems.map(item => item.product.id)
  }, [displayItems])

  const productQueries = useQueries({
    queries: productIds.map(productId => ({
      queryKey: ['product', productId, 'cart'],
      queryFn: () => getProduct(productId, { silent: true }),
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
  })

  // Create map of productId -> Product (with full enterprise info)
  const productsMap = useMemo(() => {
    const map = new Map<number, typeof displayItems[0]['product']>()
    productQueries.forEach((query, index) => {
      if (query.data && productIds[index]) {
        map.set(productIds[index], query.data)
      }
    })
    return map
  }, [productQueries, productIds])

  // Get products with enterpriseId (use fetched if available, otherwise use cart item)
  const productsWithEnterprise = useMemo(() => {
    return displayItems.map(item => {
      const fetchedProduct = productsMap.get(item.product.id)
      // Use fetched product if available, otherwise use cart item
      // Prefer enterpriseId from fetched product or from product.enterprise
      const product = fetchedProduct || item.product
      const enterpriseId = product.enterpriseId ?? product.enterprise?.id
      const enterpriseName = product.enterprise?.name
      return {
        ...product,
        enterpriseId: enterpriseId || product.enterpriseId,
        enterprise: product.enterprise || (enterpriseId && enterpriseName ? { id: enterpriseId, name: enterpriseName } : undefined)
      }
    })
  }, [displayItems, productsMap])

  // Get unique enterprise IDs from cart items (including fetched ones)
  const enterpriseIds = useMemo(() => {
    const ids = new Set<number>()
    productsWithEnterprise.forEach(product => {
      if (product.enterpriseId) {
        ids.add(product.enterpriseId)
      }
    })
    return Array.from(ids)
  }, [productsWithEnterprise])

  // Fetch enterprise info for all enterprises in cart
  const enterpriseQueries = useQueries({
    queries: enterpriseIds.map(id => ({
      queryKey: ['enterprise', id],
      queryFn: () => getEnterprise(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    })),
  })

  // Create map of enterpriseId -> Enterprise
  const enterprisesMap = useMemo(() => {
    const map = new Map<number, Enterprise>()
    enterpriseQueries.forEach((query, index) => {
      if (query.data && enterpriseIds[index]) {
        map.set(enterpriseIds[index], query.data)
      }
    })
    return map
  }, [enterpriseQueries, enterpriseIds])

  // Group cart items by enterprise
  const groupedByEnterprise = useMemo(() => {
    const groups = new Map<number | string, Array<{ product: typeof productsWithEnterprise[0]; quantity: number }>>()

    displayItems.forEach((item, index) => {
      const product = productsWithEnterprise[index] || item.product
      // Get enterpriseId from multiple sources
      const enterpriseId = product.enterpriseId ?? product.enterprise?.id
      const enterpriseName = product.enterprise?.name
      const key = enterpriseId ?? enterpriseName ?? 'unknown'

      // Debug logging
      if (!enterpriseId && !enterpriseName) {
        console.warn(`[Cart] Product ${product.id} (${product.name}) missing enterprise info:`, {
          enterpriseId: product.enterpriseId,
          enterprise: product.enterprise,
          fetchedProduct: productsMap.get(product.id)
        })
      }

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push({ product, quantity: item.quantity })
    })

    return Array.from(groups.entries()).map(([key, items]) => {
      // Determine enterpriseId from the first item
      const firstProduct = items[0]?.product
      const enterpriseId = typeof key === 'number' ? key : (firstProduct?.enterpriseId ?? firstProduct?.enterprise?.id)
      const enterprise = enterpriseId ? enterprisesMap.get(enterpriseId) : null

      // Get enterprise name from multiple sources
      const enterpriseName = enterprise?.name
        || firstProduct?.enterprise?.name
        || (enterpriseId ? undefined : 'Doanh nghiệp không xác định')

      // Debug logging
      if (!enterpriseName || enterpriseName === 'Doanh nghiệp không xác định') {
        console.warn(`[Cart] Enterprise info missing for group:`, {
          enterpriseId,
          enterprise,
          firstProduct: {
            id: firstProduct?.id,
            name: firstProduct?.name,
            enterpriseId: firstProduct?.enterpriseId,
            enterprise: firstProduct?.enterprise
          },
          enterprisesMapSize: enterprisesMap.size
        })
      }

      // Get enterpriseImageUrl safely
      let enterpriseImageUrl: string | undefined = undefined
      if (enterprise && 'imageUrl' in enterprise) {
        enterpriseImageUrl = enterprise.imageUrl
      } else if (firstProduct?.enterprise && 'imageUrl' in firstProduct.enterprise) {
        enterpriseImageUrl = firstProduct.enterprise.imageUrl
      }

      return {
        enterpriseId,
        enterpriseName: enterpriseName || 'Doanh nghiệp không xác định',
        enterpriseImageUrl,
        items,
        total: items.reduce((sum, item) => sum + ((item.product.price || 0) * item.quantity), 0)
      }
    })
  }, [displayItems, productsWithEnterprise, enterprisesMap, productsMap])

  // Calculate totals for displayed items only
  const displaySubtotal = useMemo(() => {
    return displayItems.reduce((sum, item) => {
      return sum + (item.product.price || 0) * item.quantity
    }, 0)
  }, [displayItems])

  const displayTotalItems = useMemo(() => {
    return displayItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [displayItems])

  // Calculate totals for SELECTED items only (for order summary)
  const selectedSubtotal = useMemo(() => {
    return displayItems
      .filter(item => selectedItems.has(item.product.id))
      .reduce((sum, item) => {
        return sum + (item.product.price || 0) * item.quantity
      }, 0)
  }, [displayItems, selectedItems])

  const selectedItemCount = useMemo(() => {
    return displayItems
      .filter(item => selectedItems.has(item.product.id))
      .reduce((sum, item) => sum + item.quantity, 0)
  }, [displayItems, selectedItems])

  // Use selected subtotal for order summary, show 0 if no items selected
  const subtotal = selectedItems.size > 0 ? selectedSubtotal : 0

  const discount = useMemo(() => {
    if (!appliedCoupon || selectedItems.size === 0) return 0
    return Math.round(subtotal * appliedCoupon.percent)
  }, [appliedCoupon, subtotal, selectedItems.size])
  const grandTotal = Math.max(subtotal - discount, 0) // Không cộng phí ship ở đây, sẽ tính trong checkout

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) {
      setCouponError("Vui lòng nhập mã giảm giá")
      return
    }

    // Only allow coupon if items are selected
    if (selectedItems.size === 0) {
      setCouponError("Vui lòng chọn ít nhất một sản phẩm để áp dụng mã giảm giá")
      return
    }

    // Calculate subtotal for validation (only selected items)
    const currentSubtotal = selectedSubtotal

    if (code === "OCOP10") {
      setAppliedCoupon({ code, percent: 0.1 })
      setCouponError(null)
    } else if (code === "OCOP15" && currentSubtotal >= 500000) {
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

  const toggleSelectItem = (productId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === displayItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(displayItems.map(item => item.product.id)))
    }
  }

  // Don't auto-select items - let user choose manually
  // Removed auto-select to match user expectation

  // Use the same calculated values
  const selectedTotal = selectedSubtotal
  const selectedCount = selectedItemCount

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Giỏ hàng</h1>
          </div>

          {/* Main Content */}
          <div className="flex gap-4">
            {/* Cart Items - Left Side */}
            <div className="flex-1 space-y-4">
              {groupedByEnterprise.map((group, groupIndex) => (
                <div key={group.enterpriseId || group.enterpriseName} className="bg-white rounded-sm shadow-sm">
                  {/* Shop Header - Shopee Style */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={group.items.every(item => selectedItems.has(item.product.id))}
                      onChange={() => {
                        const allSelected = group.items.every(item => selectedItems.has(item.product.id))
                        if (allSelected) {
                          group.items.forEach(item => {
                            setSelectedItems(prev => {
                              const newSet = new Set(prev)
                              newSet.delete(item.product.id)
                              return newSet
                            })
                          })
                        } else {
                          group.items.forEach(item => {
                            setSelectedItems(prev => new Set(prev).add(item.product.id))
                          })
                        }
                      }}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-500">Yêu thích</span>
                    {group.enterpriseImageUrl ? (
                      <div className="relative w-5 h-5 rounded overflow-hidden">
                        <Image
                          src={group.enterpriseImageUrl}
                          alt={group.enterpriseName}
                          fill
                          className="object-cover"
                          sizes="20px"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/hero.jpg'
                          }}
                        />
                      </div>
                    ) : null}
                    <span className="text-sm font-medium text-gray-900">{group.enterpriseName}</span>
                    <button className="ml-auto text-red-500 hover:text-red-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>

                  {/* Products */}
                  {group.items.map((item, itemIndex) => (
                    <div key={item.product.id} className={`px-4 py-4 ${itemIndex < group.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.product.id)}
                          onChange={() => toggleSelectItem(item.product.id)}
                          className="mt-2 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />

                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0">
                          <Image
                            src={item.product.imageUrl || "/hero.jpg"}
                            alt={item.product.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (!target.src.includes('hero.jpg')) {
                                target.src = '/hero.jpg'
                              }
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.product.id}`}
                            className="text-sm text-gray-900 hover:text-orange-500 line-clamp-2 mb-1"
                          >
                            {item.product.name}
                          </Link>

                          {/* Voucher Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              15.12 VOUCHER
                            </span>
                            <span className="text-xs text-gray-500">Mua ngay giá {item.product.price?.toLocaleString('vi-VN')}₫</span>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-base font-medium text-red-500">
                              {item.product.price?.toLocaleString('vi-VN')}₫
                              {item.product.unit ? <span className="text-sm text-gray-500 font-normal ml-1">/{item.product.unit}</span> : ''}
                            </span>
                          </div>

                          {/* Quantity and Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-gray-300 rounded">
                              {(() => {
                                const isDiscrete = ["cái", "hộp", "chai", "lo", "lọ", "lon", "gói", "viên"].includes((item.product.unit || "").toLowerCase());
                                const step = isDiscrete ? 1 : 0.5;
                                return (
                                  <>
                                    <button
                                      onClick={() => updateQuantity(item.product.id, Math.max(step, Number((item.quantity - step).toFixed(1))))}
                                      className="px-2 py-1 text-gray-600 hover:text-gray-900"
                                      disabled={item.quantity <= step}
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                      </svg>
                                    </button>
                                    <span className="px-3 py-1 text-sm min-w-[3rem] text-center border-x border-gray-300">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => updateQuantity(item.product.id, Number((item.quantity + step).toFixed(1)))}
                                      className="px-2 py-1 text-gray-600 hover:text-gray-900"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                  </>
                                )
                              })()}
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-base font-medium text-red-500">
                                {((item.product.price || 0) * item.quantity).toLocaleString('vi-VN')}₫
                              </span>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-gray-400 hover:text-red-500 text-sm"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Shop Vouchers Section */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-sm text-gray-600">Xem tất cả Voucher của Shop</span>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700">Xem thêm voucher</button>
                  </div>

                  {/* Shipping Discount */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="text-sm text-gray-600">Giảm 500.000₫ phí vận chuyển đơn tối thiểu 0₫</span>
                    <button className="text-sm text-blue-600 hover:text-blue-700 ml-auto">Tìm hiểu thêm</button>
                  </div>
                </div>
              ))}

            </div>

            {/* Order Summary Sidebar */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-sm shadow-sm p-4 sticky top-4">
                <h2 className="text-base font-medium text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

                {/* Voucher Input */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">OCOP Voucher</span>
                    <button className="text-sm text-blue-600 hover:text-blue-700">Chọn hoặc nhập mã</button>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="text-gray-900">{subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="text-green-600">-{discount.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Vận chuyển</span>
                    <span className="text-gray-500 text-xs">Tính khi thanh toán</span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-gray-200 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium text-gray-900">Tổng cộng</span>
                    <span className="text-xl font-medium text-red-500">{grandTotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => {
                    if (selectedItems.size > 0) {
                      setShowCheckoutModal(true)
                    }
                  }}
                  disabled={selectedItems.size === 0}
                  className="w-full bg-orange-500 text-white py-3 rounded-sm font-medium hover:bg-orange-600 transition-colors mb-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Mua Hàng
                </button>

                {/* Show message if no items selected */}
                {selectedItems.size === 0 && (
                  <p className="text-xs text-gray-500 text-center mb-3">
                    Vui lòng chọn ít nhất một sản phẩm
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar - Shopee Style */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === displayItems.length && displayItems.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-900">Chọn Tất Cả ({displayItems.length})</span>
                  </label>
                  <button
                    onClick={() => {
                      const selectedProductIds = Array.from(selectedItems)
                      selectedProductIds.forEach(id => removeFromCart(id))
                      setSelectedItems(new Set())
                    }}
                    className="text-sm text-gray-600 hover:text-red-500"
                  >
                    Xóa
                  </button>
                  <button className="text-sm text-red-500 hover:text-red-600">
                    Lưu vào mục Đã thích
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Tổng cộng ({selectedCount} sản phẩm):
                    </div>
                    <div className="text-xl font-medium text-red-500">
                      {selectedTotal.toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedItems.size > 0) {
                        setShowCheckoutModal(true)
                      }
                    }}
                    disabled={selectedItems.size === 0}
                    className="px-8 py-3 bg-orange-500 text-white rounded-sm font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Mua Hàng
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Add padding bottom to prevent content from being hidden behind fixed bottom bar */}
          <div className="h-20"></div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Thanh toán an toàn & bảo mật
        </div>
      </div>

      <Footer />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cartItems={displayItems.filter(item => selectedItems.has(item.product.id))}
        totalAmount={subtotal - discount}
        onOrderCreated={() => {
          if (isBuyNow && buyNowProductId) {
            // Only remove the buy now product from cart
            removeFromCart(buyNowProductId)
          } else {
            // Remove only selected items from cart
            const selectedProductIds = Array.from(selectedItems)
            selectedProductIds.forEach(id => removeFromCart(id))
            setSelectedItems(new Set())
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
