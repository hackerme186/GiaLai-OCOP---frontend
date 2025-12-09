"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import Link from "next/link"
import { Product, getProduct } from "@/lib/api"
import { getImageAttributes, isValidImageUrl, getImageUrl } from "@/lib/imageUtils"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/components/Toast"
import Navbar from "@/components/layout/Navbar"
import ProductReviews from "@/components/ProductReviews"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string
  const { addToCart, getItemQuantity } = useCart()
  const { showToast, ToastContainer } = useToast()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)

  // React Query: Fetch product from API
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) throw new Error("Product ID is required")
      return await getProduct(parseInt(productId))
    },
    enabled: !!productId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  })

  const handleAddToCart = async () => {
    if (!product) return
    
    setIsAddingToCart(true)
    try {
      addToCart(product, quantity)
      showToast(`Đã thêm ${quantity} ${product.name} vào giỏ hàng!`, "success")
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error)
      showToast("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng", "error")
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    
    setIsBuyingNow(true)
    try {
      // Thêm sản phẩm vào giỏ hàng với quantity đã chọn
      addToCart(product, quantity)
      
      // Điều hướng đến cart với query parameter để chỉ thanh toán sản phẩm này
      router.push(`/cart?buyNow=true&productId=${product.id}`)
    } catch (error) {
      console.error('Lỗi khi mua ngay:', error)
      showToast("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng", "error")
      setIsBuyingNow(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
          </div>
        </div>
      </>
    )
  }

  if (isError || !product) {
    const errorMessage =
      error instanceof Error ? error.message : "Sản phẩm không tồn tại"
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Không tìm thấy sản phẩm
            </h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <Link
              href="/products"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Quay lại danh sách sản phẩm
            </Link>
          </div>
        </div>
      </>
    )
  }

  const productImages = [product.imageUrl || "/hero.jpg"]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Trang chủ
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/products" className="text-gray-500 hover:text-gray-700">
                Sản phẩm
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              <Image
                src={isValidImageUrl(productImages[selectedImage]) ? getImageUrl(productImages[selectedImage], "/hero.jpg") : "/hero.jpg"}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
                priority
                {...(() => {
                  const attrs = getImageAttributes(productImages[selectedImage])
                  // Remove loading property if priority is set
                  const { loading, ...rest } = attrs
                  return rest
                })()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (!target.src.includes('hero.jpg')) {
                    target.src = '/hero.jpg'
                  }
                }}
              />
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-2">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? "border-indigo-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={isValidImageUrl(image) ? getImageUrl(image, "/hero.jpg") : "/hero.jpg"}
                    alt={`${product.name} ${index + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                    {...getImageAttributes(image)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (!target.src.includes('hero.jpg')) {
                        target.src = '/hero.jpg'
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Product Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {product.categoryName && (
                  <p className="text-sm text-gray-500">
                    Danh mục:{" "}
                    <span className="font-medium text-indigo-600">
                      {product.categoryName}
                    </span>
                  </p>
                )}
                {product.enterprise?.name && (
                  <p className="text-sm text-gray-500">
                    Doanh nghiệp:{" "}
                    <span className="font-medium text-gray-700">
                      {product.enterprise.name}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Rating */}
            {(product.averageRating || product.ocopRating) && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => {
                    const rating = product.averageRating || product.ocopRating || 0
                    return (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(rating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )
                  })}
                </div>
                {product.ocopRating && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                    {product.ocopRating} sao OCOP
                  </span>
                )}
                {product.averageRating && (
                  <span className="text-sm font-medium text-gray-700">
                    {product.averageRating.toFixed(1)}/5
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              {product.price && (
                <span className="text-3xl font-black text-gray-900">
                  {product.price.toLocaleString('vi-VN')} ₫
                </span>
              )}
              <span className="text-sm font-medium text-gray-600">(Đã bao gồm VAT)</span>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Mô tả sản phẩm</h3>
                <p className="text-gray-700 font-medium leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="text-sm font-bold text-gray-900">
                Số lượng:
              </label>
              <div className="flex items-center border-2 border-gray-400 rounded-lg bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-700 hover:text-gray-900 font-bold transform-none transition-colors"
                  style={{ transform: 'none' }}
                >
                  -
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-0 focus:ring-0 font-bold text-gray-900 bg-gray-50"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-gray-700 hover:text-gray-900 font-bold transform-none transition-colors"
                  style={{ transform: 'none' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 active:bg-indigo-800 transform-none transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ transform: 'none' }}
              >
                {isAddingToCart ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8" />
                    </svg>
                    Thêm vào giỏ hàng
                    {product && getItemQuantity(product.id) > 0 && (
                      <span className="ml-2 bg-indigo-700 px-2 py-1 rounded-full text-xs font-semibold">
                        {getItemQuantity(product.id)} trong giỏ
                      </span>
                    )}
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isBuyingNow}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 transform-none transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ transform: 'none' }}
              >
                {isBuyingNow ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Mua ngay
                  </>
                )}
              </button>
            </div>

            {/* Product Features */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin sản phẩm</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Mã sản phẩm:</span>
                  <span className="font-bold text-gray-900">#{product.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Danh mục:</span>
                  <span className="font-bold text-gray-900">
                    {product.categoryName || "Chưa phân loại"}
                  </span>
                </div>
                {product.enterprise?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Doanh nghiệp:</span>
                    <span className="font-bold text-gray-900">
                      {product.enterprise.name}
                    </span>
                  </div>
                )}
                {product.ocopRating && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">OCOP Rating:</span>
                    <span className="font-bold text-indigo-600">
                      {product.ocopRating} sao
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Tình trạng:</span>
                  <span className={`font-bold ${
                    !product.stockStatus || product.stockStatus === "" || product.stockStatus === "InStock"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    {!product.stockStatus || product.stockStatus === "" || product.stockStatus === "InStock"
                      ? "Còn hàng"
                      : product.stockStatus === "OutOfStock"
                      ? "Hết hàng"
                      : product.stockStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Vận chuyển:</span>
                  <span className="font-bold text-green-600">Miễn phí</span>
                </div>
              </div>
            </div>

            {/* Social Share */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chia sẻ</h3>
              <div className="flex space-x-4">
                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </button>
                <button className="p-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews Section */}
        <div className="mt-12">
          <ProductReviews productId={product.id} />
        </div>
      </div>
      <ToastContainer />
      </div>
    </>
  )
}
