"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getMockProducts } from "@/lib/mock-data";
import { Product } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedOcopLevel, setSelectedOcopLevel] = useState<number | "">("");

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    searchQuery,
    selectedCategory,
    selectedProvince,
    selectedOcopLevel,
  ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getMockProducts({
        page: currentPage,
        limit: 12,
        search: searchQuery || undefined,
        category: selectedCategory === "Tất cả" ? undefined : selectedCategory,
        province: selectedProvince === "Tất cả" ? undefined : selectedProvince,
        ocopLevel: selectedOcopLevel === "" ? undefined : selectedOcopLevel,
      });
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const provinces = ["Tất cả", "Gia Lai", "Bình Định"];
  const ocopLevels = [3, 4, 5];

  const categories = [
    "Tất cả",
    "Nông sản",
    "Thủ công mỹ nghệ",
    "Thực phẩm",
    "Dược liệu",
    "Khác",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Sản phẩm OCOP
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Khám phá các sản phẩm OCOP chất lượng cao
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-10">
          {/* Search Bar */}
          <div className="flex items-center space-x-6 mb-8">
            <form onSubmit={handleSearch} className="search-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="search-input"
                aria-label="Tìm kiếm sản phẩm"
              />
              <svg
                className="search-icon"
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
            </form>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category === "Tất cả" ? "" : category);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (category === "Tất cả" && !selectedCategory) ||
                  selectedCategory === category
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {products?.products && products.products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
                >
                  <div className="aspect-square bg-gray-200 relative overflow-hidden">
                    <Image
                      src={product.image || "/hero.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.category && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-indigo-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {product.category}
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
                        {product.rating && (
                          <>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(product.rating || 0)
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
                            <span className="text-sm text-gray-500">
                              {product.rating}
                            </span>
                          </>
                        )}
                      </div>

                      {product.price && (
                        <span className="text-lg font-bold text-indigo-600">
                          {product.price.toLocaleString("vi-VN")} ₫
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {products.total && products.total > 12 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>

                <div className="flex space-x-1">
                  {Array.from(
                    { length: Math.ceil((products.total || 0) / 12) },
                    (_, i) => i + 1
                  )
                    .slice(Math.max(0, currentPage - 3), currentPage + 2)
                    .map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? "bg-indigo-600 text-white"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={
                    currentPage >= Math.ceil((products.total || 0) / 12)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy sản phẩm
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                : "Chưa có sản phẩm nào được thêm vào"}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                  setCurrentPage(1);
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
  );
}
