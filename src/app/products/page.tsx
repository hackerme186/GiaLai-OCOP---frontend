"use client"

import { useState, useEffect, Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getProducts, Product } from "@/lib/api"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

// Component con sử dụng useSearchParams (phải wrap trong Suspense)
function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  // Đọc search query từ URL params (khi điều hướng từ navbar)
  useEffect(() => {
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setSearchInput(urlSearch)
      setSearchQuery(urlSearch)
    }
  }, [searchParams])

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim()
      setSearchQuery(trimmed)
      // Update URL khi search thay đổi (nhưng không trigger navigation)
      if (trimmed) {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('search', trimmed)
        window.history.replaceState({}, '', newUrl.toString())
      } else {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('search')
        window.history.replaceState({}, '', newUrl.toString())
      }
    }, 500)

    return () => clearTimeout(handler)
  }, [searchInput])

  // React Query: Fetch products from API with search
  // ✅ FIX: Request only Approved products from backend to prevent showing pending/rejected products
  const {
    data: allProducts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products", "customer", searchQuery, selectedCategory],
    queryFn: async () => {
      // Call API with search parameter AND status filter
      const searchTerm = searchQuery || undefined;
      if (searchTerm) {
        console.log('🔍 Frontend: Searching for:', searchTerm);
      }
      
      // ✅ FIX: Request only Approved products from backend
      const result = await getProducts({
        page: 1,
        pageSize: 100, // Get all products
        status: "Approved", // ✅ Only get approved products from backend
        q: searchTerm, // Try 'q' parameter first
      });
      
      if (searchTerm) {
        console.log('✅ Frontend: Received', result.length, 'approved products from API');
      }
      
      // ✅ Double-check: Filter again on client-side as safety measure
      const approvedOnly = result.filter((p) => p.status === "Approved");
      if (approvedOnly.length !== result.length) {
        console.warn(`⚠️ Backend returned ${result.length - approvedOnly.length} non-approved products. Filtered out.`);
      }
      
      return approvedOnly;
    },
    enabled: true, // Always enabled
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  })

  // ✅ All products from API are already filtered to Approved only
  const approvedProducts = allProducts

  // Client-side search filter (fallback if API doesn't support search)
  const searchFiltered = searchQuery
    ? approvedProducts.filter((p) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.categoryName?.toLowerCase().includes(searchLower)
        );
      })
    : approvedProducts;

  // Filter by category
  const products =
    selectedCategory && selectedCategory !== "Tất cả"
      ? searchFiltered.filter((p) =>
          p.categoryName?.toLowerCase().includes(selectedCategory.toLowerCase())
        )
      : searchFiltered

  const categories = [
    "Tất cả",
    "Nông sản",
    "Thủ công mỹ nghệ", 
    "Thực phẩm",
    "Dược liệu",
    "Khác"
  ]

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
        <Footer />
      </>
    )
  }

  // Error state
  if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Không thể tải sản phẩm từ server"
    return (
      <>
        <Header />
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
              Lỗi tải sản phẩm
            </h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
              onClick={() => refetch()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Thử lại
          </button>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sản phẩm OCOP</h1>
          <p className="text-gray-600">
            {searchQuery
              ? `Tìm thấy ${products.length} sản phẩm cho "${searchQuery}"`
              : "Khám phá các sản phẩm OCOP chất lượng cao"}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-10 py-2 border border-gray-400 rounded-xl bg-white text-gray-900 placeholder:text-gray-500 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("")
                    setSearchQuery("")
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Xóa tìm kiếm"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              </div>
            </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category === "Tất cả" ? "" : category)
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (category === "Tất cả" && !selectedCategory) || selectedCategory === category
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-4 text-sm text-gray-600">
            {isLoading ? (
              <span>Đang tìm kiếm...</span>
            ) : (
              <span>
                Tìm thấy <strong className="text-gray-900">{products.length}</strong> sản phẩm
                {selectedCategory && ` trong danh mục "${selectedCategory}"`}
              </span>
            )}
          </div>
        )}

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
                >
                  <div className="aspect-square bg-gray-200 relative overflow-hidden">
                    <Image
                      src={product.imageUrl || "/hero.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.categoryName && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-indigo-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {product.categoryName}
                        </span>
                      </div>
                    )}
                    {product.ocopRating && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          ⭐ {product.ocopRating}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {product.averageRating && (
                          <>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(product.averageRating || 0)
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{product.averageRating.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                      
                      {product.price && (
                        <span className="text-lg font-bold text-indigo-600">
                          {product.price.toLocaleString('vi-VN')} ₫
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory 
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                : "Chưa có sản phẩm nào được thêm vào"
              }
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchInput("")
                  setSearchQuery("")
                  setSelectedCategory("")
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
      <Footer />
    </>
  )
}

// Component chính - wrap ProductsContent trong Suspense
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
          </div>
        </div>
        <Footer />
      </>
    }>
      <ProductsContent />
    </Suspense>
  )
}
