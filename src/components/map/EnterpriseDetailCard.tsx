"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { 
  getMapEnterprise, 
  getMapEnterpriseProducts, 
  getEnterprise, 
  getReviews,
  getProducts,
  type EnterpriseMapDto, 
  type Enterprise, 
  type Product,
  type Review
} from "@/lib/api"
import { isValidImageUrl, getImageUrl, getImageAttributes } from "@/lib/imageUtils"

interface EnterpriseDetailCardProps {
    enterprise: EnterpriseMapDto
    onClose: () => void
}

type TabType = "overview" | "menu" | "reviews" | "about"

export default function EnterpriseDetailCard({ enterprise, onClose }: EnterpriseDetailCardProps) {
    const [activeTab, setActiveTab] = useState<TabType>("overview")
    const [detailedInfo, setDetailedInfo] = useState<EnterpriseMapDto | Enterprise | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [reviews, setReviews] = useState<Review[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [loadingReviews, setLoadingReviews] = useState(false)
    const [loadingDetails, setLoadingDetails] = useState(true)

    useEffect(() => {
        // Fetch detailed info from Enterprise API (has full database info)
        const fetchDetails = async () => {
            setLoadingDetails(true)
            try {
                // Try to get full Enterprise info first
                const fullEnterprise = await getEnterprise(enterprise.id)
                // Convert Enterprise to EnterpriseMapDto format
                const mappedInfo: EnterpriseMapDto = {
                    id: fullEnterprise.id,
                    name: fullEnterprise.name,
                    district: fullEnterprise.district,
                    province: fullEnterprise.province,
                    latitude: fullEnterprise.latitude,
                    longitude: fullEnterprise.longitude,
                    ocopRating: fullEnterprise.ocopRating,
                    businessField: fullEnterprise.businessField,
                    imageUrl: fullEnterprise.imageUrl,
                    address: fullEnterprise.address,
                    ward: fullEnterprise.ward,
                    phoneNumber: fullEnterprise.phoneNumber,
                    emailContact: fullEnterprise.emailContact,
                    website: fullEnterprise.website,
                    description: fullEnterprise.description,
                    averageRating: fullEnterprise.averageRating,
                    topProducts: fullEnterprise.products || enterprise.topProducts || [],
                }
                setDetailedInfo(mappedInfo)
            } catch (err) {
                console.warn("Could not fetch full enterprise info, trying map API:", err)
                try {
                    // Fallback to map API
                    const mapDetails = await getMapEnterprise(enterprise.id)
                    setDetailedInfo(mapDetails)
                } catch (mapErr) {
                    console.warn("Could not fetch map enterprise info:", mapErr)
                    setDetailedInfo(enterprise) // Fallback to basic info
                }
            } finally {
                setLoadingDetails(false)
            }
        }
        fetchDetails()
    }, [enterprise])

    useEffect(() => {
        if (activeTab === "menu") {
            setLoadingProducts(true)
            
            // Fetch products với nhiều phương án fallback
            const fetchProducts = async () => {
                try {
                    // Thử 1: getMapEnterpriseProducts
                    console.log(`[EnterpriseDetailCard] Fetching products for enterprise ${enterprise.id}`)
                    let productData: Product[] = []
                    
                    try {
                        const mapProducts = await getMapEnterpriseProducts(enterprise.id, { pageSize: 100 })
                        const mapList = Array.isArray(mapProducts) ? mapProducts : []
                        console.log(`[EnterpriseDetailCard] getMapEnterpriseProducts returned ${mapList.length} products`)
                        
                        if (mapList.length > 0) {
                            productData = mapList
                        } else {
                            throw new Error("Empty result from getMapEnterpriseProducts")
                        }
                    } catch (err1) {
                        console.warn("[EnterpriseDetailCard] getMapEnterpriseProducts failed, trying getProducts:", err1)
                        
                        // Thử 2: getProducts với enterpriseId (KHÔNG filter status để lấy tất cả)
                        try {
                            const allProducts = await getProducts({ enterpriseId: enterprise.id, pageSize: 100 })
                            const allList = Array.isArray(allProducts) ? allProducts : []
                            console.log(`[EnterpriseDetailCard] getProducts returned ${allList.length} products`)
                            
                            // Log chi tiết để debug
                            if (allList.length > 0) {
                                console.log(`[EnterpriseDetailCard] Products found:`, allList.map(p => ({
                                    id: p.id,
                                    name: p.name,
                                    status: p.status,
                                    enterpriseId: p.enterpriseId
                                })))
                                productData = allList
                            } else {
                                // Nếu không có products, thử với status Approved
                                console.warn(`[EnterpriseDetailCard] No products found, trying with Approved status`)
                                const approvedProducts = await getProducts({ 
                                    enterpriseId: enterprise.id, 
                                    pageSize: 100, 
                                    status: "Approved" 
                                })
                                const approvedList = Array.isArray(approvedProducts) ? approvedProducts : []
                                console.log(`[EnterpriseDetailCard] getProducts (Approved) returned ${approvedList.length} products`)
                                
                                if (approvedList.length > 0) {
                                    productData = approvedList
                                } else {
                                    throw new Error("No products found with any status")
                                }
                            }
                        } catch (err2) {
                            console.warn("[EnterpriseDetailCard] getProducts failed:", err2)
                            // Fallback cuối cùng: dùng topProducts từ enterprise
                            productData = enterprise.topProducts || []
                            console.log(`[EnterpriseDetailCard] Using topProducts: ${productData.length} products`)
                        }
                    }
                    
                    // Đảm bảo chỉ lấy products thuộc enterprise này
                    const filteredProducts = productData.filter(p => {
                        const matchesEnterprise = p.enterpriseId === enterprise.id
                        if (!matchesEnterprise) {
                            console.warn(`[EnterpriseDetailCard] Product ${p.id} (${p.name}) has enterpriseId ${p.enterpriseId}, expected ${enterprise.id}`)
                        }
                        return matchesEnterprise
                    })
                    
                    console.log(`[EnterpriseDetailCard] Final products count: ${filteredProducts.length} (filtered from ${productData.length})`)
                    setProducts(filteredProducts)
                } catch (err) {
                    console.error("[EnterpriseDetailCard] Error fetching products:", err)
                    setProducts(enterprise.topProducts || [])
                } finally {
                    setLoadingProducts(false)
                }
            }
            
            fetchProducts()
        }
    }, [activeTab, enterprise])

    useEffect(() => {
        if (activeTab === "reviews") {
            setLoadingReviews(true)
            // Fetch all reviews, sau đó filter theo products của enterprise
            Promise.all([
                getReviews(),
                // Fetch products của enterprise để lấy product IDs
                getProducts({ enterpriseId: enterprise.id, pageSize: 100 })
                    .catch(() => {
                        // Fallback: thử getMapEnterpriseProducts
                        return getMapEnterpriseProducts(enterprise.id, { pageSize: 100 })
                            .catch(() => [])
                    })
            ])
                .then(([allReviews, productList]) => {
                    const products = Array.isArray(productList) ? productList : []
                    
                    // Lấy danh sách product IDs của enterprise (chỉ lấy products thuộc enterprise này)
                    const enterpriseProductIds = new Set<number>()
                    products
                        .filter(p => p.enterpriseId === enterprise.id) // Chỉ lấy products thuộc enterprise này
                        .forEach(p => enterpriseProductIds.add(p.id))
                    
                    // Thêm products từ enterprise.topProducts nếu có (đã được filter sẵn)
                    if (enterprise.topProducts) {
                        enterprise.topProducts
                            .filter(p => p.enterpriseId === enterprise.id)
                            .forEach(p => enterpriseProductIds.add(p.id))
                    }
                    
                    // Filter reviews theo product IDs
                    const filtered = Array.isArray(allReviews) 
                        ? allReviews.filter(r => enterpriseProductIds.has(r.productId))
                        : []
                    
                    console.log(`[EnterpriseDetailCard] Reviews: ${filtered.length} reviews for ${enterpriseProductIds.size} products of enterprise ${enterprise.id}`)
                    setReviews(filtered)
                })
                .catch((err) => {
                    console.warn("Could not fetch reviews:", err)
                    setReviews([])
                })
                .finally(() => setLoadingReviews(false))
        }
    }, [activeTab, enterprise])

    const displayInfo = (detailedInfo || enterprise) as EnterpriseMapDto & {
        address?: string
        ward?: string
        phoneNumber?: string
        emailContact?: string
        website?: string
        description?: string
        averageRating?: number
        distance?: number
        topProducts?: Product[]
    }

    const handleDirections = () => {
        if (displayInfo.latitude && displayInfo.longitude) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${displayInfo.latitude},${displayInfo.longitude}`
            window.open(url, "_blank")
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: displayInfo.name,
                    text: `${displayInfo.name} - ${displayInfo.businessField}`,
                    url: window.location.href,
                })
            } catch (err) {
                console.log("Share cancelled")
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href)
            alert("Đã sao chép liên kết!")
        }
    }

    const handlePhoneClick = (phone: string) => {
        window.location.href = `tel:${phone}`
    }

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
            style={{ zIndex: 10000, position: 'fixed' }}
            onClick={(e) => {
                // Close when clicking backdrop
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header with image */}
                <div className="relative h-64 bg-gray-200">
                    <Image
                        src={displayInfo.imageUrl || "/hero.jpg"}
                        alt={displayInfo.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 672px"
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition"
                        aria-label="Đóng"
                    >
                        <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Business Info */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayInfo.name}</h2>
                                <p className="text-sm text-gray-600">{displayInfo.businessField}</p>
                            </div>
                            {displayInfo.ocopRating && (
                                <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full">
                                    <span className="text-yellow-500 text-lg">⭐</span>
                                    <span className="text-base font-semibold text-gray-900">
                                        {displayInfo.ocopRating.toFixed(1)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 px-6">
                        <div className="flex gap-6">
                            {[
                                { id: "overview", label: "Tổng quan" },
                                { id: "menu", label: "Sản phẩm" },
                                { id: "reviews", label: "Đánh giá" },
                                { id: "about", label: "Giới thiệu" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`py-4 px-1 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                                        ? "border-teal-500 text-teal-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 py-4 border-b border-gray-200 flex gap-3">
                        {displayInfo.latitude && displayInfo.longitude && (
                            <button
                                onClick={handleDirections}
                                className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl bg-teal-50 hover:bg-teal-100 transition"
                            >
                                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                </div>
                                <span className="text-xs font-medium text-gray-700">Chỉ đường</span>
                            </button>
                        )}
                        <button
                            onClick={handleShare}
                            className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                    />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-700">Chia sẻ</span>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {loadingDetails ? (
                            <div className="text-center py-8 text-gray-500">Đang tải thông tin...</div>
                        ) : (
                            <>
                                {activeTab === "overview" && (
                                    <div className="space-y-4">
                                        {/* Address */}
                                        {displayInfo.address && (
                                            <div className="flex items-start gap-3">
                                                <svg
                                                    className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Địa chỉ</p>
                                                    <p className="text-sm text-gray-700">
                                                        {displayInfo.address}
                                                        {displayInfo.ward && `, ${displayInfo.ward}`}
                                                        {`, ${displayInfo.district}, ${displayInfo.province}`}
                                                    </p>
                                                    {displayInfo.distance && (
                                                        <p className="text-xs text-gray-500 mt-1">Cách {displayInfo.distance.toFixed(1)} km</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Contact Info */}
                                        {(displayInfo.phoneNumber || displayInfo.emailContact || displayInfo.website) && (
                                            <div className="space-y-2">
                                                <h3 className="text-sm font-semibold text-gray-900">Thông tin liên hệ</h3>
                                                {displayInfo.phoneNumber && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        <a href={`tel:${displayInfo.phoneNumber}`} className="text-teal-600 hover:underline">
                                                            {displayInfo.phoneNumber}
                                                        </a>
                                                    </div>
                                                )}
                                                {displayInfo.emailContact && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        <a href={`mailto:${displayInfo.emailContact}`} className="text-teal-600 hover:underline">
                                                            {displayInfo.emailContact}
                                                        </a>
                                                    </div>
                                                )}
                                                {displayInfo.website && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                        </svg>
                                                        <a href={displayInfo.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                                                            {displayInfo.website}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Rating */}
                                        {displayInfo.averageRating && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">Đánh giá trung bình:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-yellow-500">⭐</span>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {displayInfo.averageRating.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Top Products */}
                                        {displayInfo.topProducts && displayInfo.topProducts.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Sản phẩm nổi bật</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {displayInfo.topProducts.slice(0, 4).map((product) => (
                                                        <div
                                                            key={product.id}
                                                            className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-teal-300 transition"
                                                        >
                                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                                <Image
                                                                    src={product.imageUrl || "/hero.jpg"}
                                                                    alt={product.name}
                                                                    fill
                                                                    sizes="64px"
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {product.name}
                                                                </p>
                                                                {product.price && (
                                                                    <p className="text-sm font-semibold text-teal-600 mt-1">
                                                                        {product.price.toLocaleString("vi-VN")} ₫
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "menu" && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Danh sách sản phẩm ({products.length})
                                        </h3>
                                        {loadingProducts ? (
                                            <div className="text-center py-8 text-gray-500">Đang tải sản phẩm...</div>
                                        ) : products.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {products.map((product) => (
                                                    <div
                                                        key={product.id}
                                                        className="flex gap-3 p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer bg-white"
                                                        onClick={() => window.open(`/products/${product.id}`, "_blank")}
                                                    >
                                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                            {isValidImageUrl(product.imageUrl) ? (
                                                                <Image
                                                                    src={getImageUrl(product.imageUrl)}
                                                                    alt={product.name}
                                                                    fill
                                                                    sizes="96px"
                                                                    className="object-cover"
                                                                    {...getImageAttributes(product.imageUrl)}
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement
                                                                        target.style.display = 'none'
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                                    No Image
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                <p className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                                                                    {product.name}
                                                                </p>
                                                                {product.ocopRating && (
                                                                    <span className="flex items-center gap-0.5 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                                                                        ⭐ {product.ocopRating}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {product.categoryName && (
                                                                <p className="text-xs text-blue-600 mb-1">📂 {product.categoryName}</p>
                                                            )}
                                                            {product.description && (
                                                                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                                                    {product.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center justify-between mt-2">
                                                                {product.price && (
                                                                    <p className="text-sm font-bold text-teal-600">
                                                                        {product.price.toLocaleString("vi-VN")} ₫
                                                                    </p>
                                                                )}
                                                                {product.stockStatus && (
                                                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                                                        product.stockStatus === "InStock" 
                                                                            ? "bg-green-100 text-green-700" 
                                                                            : product.stockStatus === "LowStock"
                                                                            ? "bg-yellow-100 text-yellow-700"
                                                                            : "bg-red-100 text-red-700"
                                                                    }`}>
                                                                        {product.stockStatus === "InStock" ? "Còn hàng" : 
                                                                         product.stockStatus === "LowStock" ? "Sắp hết" : "Hết hàng"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                                <p className="text-gray-500 font-medium">Chưa có sản phẩm nào</p>
                                                <p className="text-sm text-gray-400 mt-1">Doanh nghiệp này chưa đăng sản phẩm</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "reviews" && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Đánh giá ({reviews.length})
                                            </h3>
                                            {displayInfo.averageRating && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">Đánh giá trung bình:</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-yellow-500 text-lg">⭐</span>
                                                        <span className="text-base font-bold text-gray-900">
                                                            {displayInfo.averageRating.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {loadingReviews ? (
                                            <div className="text-center py-8 text-gray-500">Đang tải đánh giá...</div>
                                        ) : reviews.length > 0 ? (
                                            <div className="space-y-4">
                                                {reviews.map((review) => (
                                                    <div
                                                        key={review.id}
                                                        className="p-4 rounded-xl border border-gray-200 bg-white hover:border-teal-300 transition"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                                                    <span className="text-teal-600 font-semibold text-sm">
                                                                        {review.user?.name?.charAt(0).toUpperCase() || "U"}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {review.user?.name || "Người dùng ẩn danh"}
                                                                    </p>
                                                                    {review.product && (
                                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                                            Đánh giá cho: {review.product.name}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className={`text-sm ${
                                                                            i < review.rating
                                                                                ? "text-yellow-500"
                                                                                : "text-gray-300"
                                                                        }`}
                                                                    >
                                                                        ⭐
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {review.comment && (
                                                            <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                                                                {review.comment}
                                                            </p>
                                                        )}
                                                        {review.createdAt && (
                                                            <p className="text-xs text-gray-400 mt-3">
                                                                {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                                                                    year: "numeric",
                                                                    month: "long",
                                                                    day: "numeric",
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                                <p className="text-gray-500 font-medium">Chưa có đánh giá nào</p>
                                                <p className="text-sm text-gray-400 mt-1">Hãy là người đầu tiên đánh giá doanh nghiệp này</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "about" && (
                                    <div className="space-y-4">
                                        {displayInfo.description && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Mô tả</h3>
                                                <p className="text-sm text-gray-600 whitespace-pre-line">
                                                    {displayInfo.description}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Lĩnh vực kinh doanh</h3>
                                            <p className="text-sm text-gray-600">
                                                {displayInfo.businessField}
                                            </p>
                                        </div>
                                        {displayInfo.address && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Địa chỉ</h3>
                                                <p className="text-sm text-gray-600">
                                                    {displayInfo.address}
                                                    {displayInfo.ward && `, ${displayInfo.ward}`}
                                                    {`, ${displayInfo.district}, ${displayInfo.province}`}
                                                </p>
                                            </div>
                                        )}
                                        {(displayInfo.phoneNumber || displayInfo.emailContact || displayInfo.website) && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Liên hệ</h3>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    {displayInfo.phoneNumber && (
                                                        <p>
                                                            <span className="font-medium">Điện thoại:</span>{" "}
                                                            <a href={`tel:${displayInfo.phoneNumber}`} className="text-teal-600 hover:underline">
                                                                {displayInfo.phoneNumber}
                                                            </a>
                                                        </p>
                                                    )}
                                                    {displayInfo.emailContact && (
                                                        <p>
                                                            <span className="font-medium">Email:</span>{" "}
                                                            <a href={`mailto:${displayInfo.emailContact}`} className="text-teal-600 hover:underline">
                                                                {displayInfo.emailContact}
                                                            </a>
                                                        </p>
                                                    )}
                                                    {displayInfo.website && (
                                                        <p>
                                                            <span className="font-medium">Website:</span>{" "}
                                                            <a href={displayInfo.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                                                                {displayInfo.website}
                                                            </a>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

