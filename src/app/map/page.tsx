"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import InteractiveMap from "@/components/map/InteractiveMap"
import EnterpriseDetailCard from "@/components/map/EnterpriseDetailCard"
import Navbar from "@/components/layout/Navbar"
import {
    getMapFilterOptions,
    searchMap,
    type EnterpriseMapDto,
    type FilterOptions,
} from "@/lib/api"

export default function MapPage() {
    const [keyword, setKeyword] = useState("")
    const [selectedRating, setSelectedRating] = useState<string>("")
    const [selectedProvince, setSelectedProvince] = useState<string>("")
    const [enterprises, setEnterprises] = useState<EnterpriseMapDto[]>([])
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [showDetailCard, setShowDetailCard] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<FilterOptions>({
        districts: [],
        provinces: [],
        businessFields: [],
        ocopRatings: [],
    })

    const loadResults = async (params?: { keyword?: string; rating?: number; province?: string }) => {
        setLoading(true)
        setError(null)
        try {
            // Chỉ gửi params khi có giá trị (không phải empty string)
            const searchParams: {
                keyword?: string
                ocopRating?: number
                province?: string
                pageSize: number
            } = {
                pageSize: 100,
            }
            
            // Chỉ thêm keyword nếu có giá trị và không phải empty string
            if (params?.keyword && params.keyword.trim() !== "") {
                searchParams.keyword = params.keyword.trim()
            }
            
            // Chỉ thêm ocopRating nếu có giá trị hợp lệ
            if (params?.rating !== undefined && params.rating !== null && !isNaN(params.rating)) {
                searchParams.ocopRating = params.rating
            }
            
            // Chỉ thêm province nếu có giá trị và không phải empty string
            if (params?.province && params.province.trim() !== "") {
                searchParams.province = params.province.trim()
            }
            
            console.log("[Map Search] Calling searchMap with:", searchParams)
            const data = await searchMap(searchParams)
            const list = Array.isArray(data)
                ? data
                : ((data as any)?.items ?? (data as any)?.data ?? [])
            console.log("[Map Search] Results received:", list.length, "enterprises")
            
            // Backend đã filter, nhưng để chắc chắn, filter lại trên frontend nếu cần
            let filteredList = list
            
            // Double-check: Filter by rating nếu backend không filter đúng
            if (params?.rating !== undefined && params.rating !== null && !isNaN(params.rating)) {
                const beforeFilter = filteredList.length
                filteredList = filteredList.filter((e: EnterpriseMapDto) => e.ocopRating === params.rating)
                if (filteredList.length !== beforeFilter) {
                    console.log(`[Map Search] Frontend filtered by rating ${params.rating}: ${beforeFilter} -> ${filteredList.length} enterprises`)
                }
            }
            
            // Double-check: Filter by province nếu backend không filter đúng
            if (params?.province && params.province.trim() !== "") {
                const beforeFilter = filteredList.length
                filteredList = filteredList.filter((e: EnterpriseMapDto) => 
                    e.province?.toLowerCase() === params.province?.toLowerCase().trim()
                )
                if (filteredList.length !== beforeFilter) {
                    console.log(`[Map Search] Frontend filtered by province ${params.province}: ${beforeFilter} -> ${filteredList.length} enterprises`)
                }
            }
            
            // Double-check: Filter by keyword nếu backend không filter đúng
            if (params?.keyword && params.keyword.trim() !== "") {
                const keywordLower = params.keyword.toLowerCase().trim()
                const beforeFilter = filteredList.length
                filteredList = filteredList.filter((e: EnterpriseMapDto) => 
                    e.name?.toLowerCase().includes(keywordLower) ||
                    e.businessField?.toLowerCase().includes(keywordLower) ||
                    e.district?.toLowerCase().includes(keywordLower) ||
                    e.province?.toLowerCase().includes(keywordLower) ||
                    e.address?.toLowerCase().includes(keywordLower)
                )
                if (filteredList.length !== beforeFilter) {
                    console.log(`[Map Search] Frontend filtered by keyword "${params.keyword}": ${beforeFilter} -> ${filteredList.length} enterprises`)
                }
            }
            
            console.log(`[Map Search] Final results: ${filteredList.length} enterprises`)
            setEnterprises(filteredList)
            
            if (filteredList.length > 0) {
                setSelectedId(filteredList[0].id)
            } else {
                setSelectedId(null)
            }
        } catch (err) {
            console.error("Failed to load map data:", err)
            setEnterprises([])
            setError(err instanceof Error ? err.message : "Không thể tải dữ liệu bản đồ. Kiểm tra backend.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadResults()
        getMapFilterOptions()
            .then(setFilters)
            .catch((err) => console.warn("Cannot load map filters", err))
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        
        // Xử lý rating: chỉ convert nếu có giá trị hợp lệ
        let rating: number | undefined = undefined
        if (selectedRating && selectedRating !== "" && selectedRating !== "all") {
            const parsedRating = Number(selectedRating)
            if (!isNaN(parsedRating) && parsedRating >= 3 && parsedRating <= 5) {
                rating = parsedRating
            }
        }
        
        // Xử lý province: chỉ gửi nếu không phải "Tất cả"
        const province = selectedProvince && selectedProvince !== "" && selectedProvince !== "all" 
            ? selectedProvince 
            : undefined
        
        // Xử lý keyword: trim và chỉ gửi nếu không empty
        const searchKeyword = keyword && keyword.trim() !== "" ? keyword.trim() : undefined
        
        console.log("[Map Search] Search params:", { keyword: searchKeyword, rating, province })
        loadResults({ keyword: searchKeyword, rating, province })
    }
    
    const handleReset = () => {
        setKeyword("")
        setSelectedRating("")
        setSelectedProvince("")
        // Load lại tất cả enterprises
        loadResults()
    }

    const selectedEnterprise = useMemo(
        () => enterprises.find((item) => item.id === selectedId),
        [enterprises, selectedId]
    )

    const handleEnterpriseClick = (id: number) => {
        setSelectedId(id)
        setShowDetailCard(true)
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
            <Navbar />
            <main className="flex flex-1">
                {/* Sidebar - Modern Design */}
                <section className="w-full max-w-md bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl h-[calc(100vh-0px)] overflow-y-auto">
                    {/* Header với gradient */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 pb-8 shadow-lg">
                        <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-md">
                            🗺️ Bản đồ OCOP
                        </h1>
                        <p className="text-sm text-white/90">Khám phá doanh nghiệp OCOP Gia Lai</p>
                    </div>
                    
                    {/* Search Form */}
                    <div className="p-6 -mt-4">
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <form onSubmit={handleSearch} className="space-y-4">
                                {/* Từ khóa với icon */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Từ khóa
                                    </label>
                                    <div className="relative">
                                        <input
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            placeholder="Tìm kiếm doanh nghiệp, sản phẩm..."
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-medium text-gray-900 bg-white transition-all shadow-sm hover:shadow-md"
                                        />
                                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                                
                                {/* Filter Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Tỉnh/Thành
                                        </label>
                                        <select
                                            value={selectedProvince}
                                            onChange={(e) => setSelectedProvince(e.target.value)}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm hover:shadow-md cursor-pointer"
                                        >
                                            <option value="">Tất cả</option>
                                            {filters.provinces?.map((province) => (
                                                <option key={province} value={province}>
                                                    {province}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                            OCOP Rating
                                        </label>
                                        <select
                                            value={selectedRating}
                                            onChange={(e) => setSelectedRating(e.target.value)}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm hover:shadow-md cursor-pointer"
                                        >
                                            <option value="">Tất cả</option>
                                            {[3, 4, 5].map((rating) => (
                                                <option key={rating} value={rating}>
                                                    {rating} ⭐
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Tìm kiếm
                                    </button>
                                    {(keyword || selectedRating || selectedProvince) && (
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    {/* Results Count */}
                    {!loading && enterprises.length > 0 && (
                        <div className="px-6 -mt-2 mb-4">
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 flex items-center justify-between">
                                <span className="text-sm font-semibold text-indigo-900">
                                    Tìm thấy {enterprises.length} doanh nghiệp
                                </span>
                                <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                                    {enterprises.length}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Results List */}
                    <div className="px-6 pb-6 space-y-4">
                        {loading && (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                                <p className="text-gray-600 text-sm font-medium">Đang tải dữ liệu...</p>
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        )}
                        {!loading && enterprises.length === 0 && !error && (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-gray-500 text-sm font-medium">Không tìm thấy doanh nghiệp phù hợp</p>
                                <p className="text-xs text-gray-400 mt-1">Thử thay đổi bộ lọc để tìm thêm kết quả</p>
                            </div>
                        )}
                        {enterprises.map((enterprise, index) => (
                            <article
                                key={enterprise.id}
                                className={`rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                                    enterprise.id === selectedId
                                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-xl ring-4 ring-indigo-200"
                                        : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg"
                                } p-4 shadow-md`}
                                onClick={() => handleEnterpriseClick(enterprise.id)}
                                style={{
                                    animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                                }}
                            >
                                <div className="flex gap-4">
                                    <div className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md ${
                                        enterprise.id === selectedId ? 'ring-2 ring-indigo-400' : ''
                                    }`}>
                                        <Image
                                            src={enterprise.imageUrl || "/hero.jpg"}
                                            alt={enterprise.name}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                        {enterprise.ocopRating && (
                                            <div className="absolute top-1 right-1 bg-yellow-400 rounded-full px-2 py-0.5 shadow-lg">
                                                <span className="text-xs font-bold text-white flex items-center gap-0.5">
                                                    ⭐ {enterprise.ocopRating}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`text-base font-bold truncate ${
                                                enterprise.id === selectedId ? 'text-indigo-900' : 'text-gray-900'
                                            }`}>
                                                {enterprise.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <p className="text-sm text-gray-600 truncate">
                                                {enterprise.district}, {enterprise.province}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <p className="text-xs text-gray-500 line-clamp-1">
                                                {enterprise.businessField}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {enterprise.topProducts && enterprise.topProducts.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2 flex-wrap">
                                        {enterprise.topProducts.slice(0, 2).map((product) => (
                                            <span
                                                key={product.id}
                                                className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-200"
                                            >
                                                🛍️ {product.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>

                {/* Map */}
                <section className="flex-1 h-[calc(100vh-0px)] relative overflow-hidden">
                    {loading && enterprises.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-600 rounded-full opacity-20 animate-ping"></div>
                                <div className="relative bg-white rounded-full p-6 shadow-xl">
                                    <svg className="w-12 h-12 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            </div>
                            <p className="mt-6 text-gray-600 font-medium">Đang tải bản đồ...</p>
                            <p className="mt-2 text-sm text-gray-500">Vui lòng đợi trong giây lát</p>
                        </div>
                    ) : (
                        <div className="h-full w-full relative">
                            <InteractiveMap
                                enterprises={enterprises}
                                selectedId={selectedId}
                                onSelect={(id) => handleEnterpriseClick(id)}
                            />
                            {/* Map overlay info */}
                            {enterprises.length > 0 && (
                                <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-xl border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-semibold text-gray-700">
                                            {enterprises.length} doanh nghiệp
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>

            {/* Enterprise Detail Card - rendered outside main to ensure proper z-index */}
            {selectedEnterprise && showDetailCard && (
                <EnterpriseDetailCard
                    enterprise={selectedEnterprise}
                    onClose={() => setShowDetailCard(false)}
                />
            )}
        </div>
    )
}

