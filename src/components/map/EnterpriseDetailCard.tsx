"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getMapEnterprise, getMapEnterpriseProducts, getEnterprise, type EnterpriseMapDto, type Enterprise, type Product } from "@/lib/api"

interface EnterpriseDetailCardProps {
    enterprise: EnterpriseMapDto
    onClose: () => void
}

type TabType = "overview" | "menu" | "reviews" | "about"

export default function EnterpriseDetailCard({ enterprise, onClose }: EnterpriseDetailCardProps) {
    const [activeTab, setActiveTab] = useState<TabType>("overview")
    const [detailedInfo, setDetailedInfo] = useState<EnterpriseMapDto | Enterprise | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)
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
            getMapEnterpriseProducts(enterprise.id, { pageSize: 20 })
                .then(setProducts)
                .catch((err) => {
                    console.warn("Could not fetch products:", err)
                    setProducts(enterprise.topProducts || [])
                })
                .finally(() => setLoadingProducts(false))
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
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách sản phẩm</h3>
                                        {loadingProducts ? (
                                            <div className="text-center py-8 text-gray-500">Đang tải sản phẩm...</div>
                                        ) : products.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {products.map((product) => (
                                                    <div
                                                        key={product.id}
                                                        className="flex gap-3 p-4 rounded-xl border border-gray-200 hover:border-teal-300 transition cursor-pointer"
                                                        onClick={() => window.open(`/products/${product.id}`, "_blank")}
                                                    >
                                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                            <Image
                                                                src={product.imageUrl || "/hero.jpg"}
                                                                alt={product.name}
                                                                fill
                                                                sizes="80px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                                {product.name}
                                                            </p>
                                                            {product.description && (
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                    {product.description}
                                                                </p>
                                                            )}
                                                            {product.price && (
                                                                <p className="text-sm font-bold text-teal-600 mt-2">
                                                                    {product.price.toLocaleString("vi-VN")} ₫
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">Chưa có sản phẩm nào</div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "reviews" && (
                                    <div className="text-center py-8 text-gray-500">
                                        Tính năng đánh giá đang được phát triển
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

