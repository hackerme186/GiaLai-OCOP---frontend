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
            const searchParams = {
                keyword: params?.keyword || undefined,
                ocopRating: params?.rating,
                province: params?.province || undefined,
                pageSize: 100,
            }
            console.log("[Map Search] Calling searchMap with:", searchParams)
            const data = await searchMap(searchParams)
            const list = Array.isArray(data)
                ? data
                : ((data as any)?.items ?? (data as any)?.data ?? [])
            console.log("[Map Search] Results received:", list.length, "enterprises")
            console.log("[Map Search] Ratings in results:", list.map((e: EnterpriseMapDto) => e.ocopRating))
            
            // Filter by rating on frontend if backend doesn't filter correctly
            let filteredList = list
            if (params?.rating !== undefined) {
                filteredList = list.filter((e: EnterpriseMapDto) => e.ocopRating === params.rating)
                console.log("[Map Search] After filtering by rating", params.rating + ":", filteredList.length, "enterprises")
            }
            
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
        const rating = selectedRating && selectedRating !== "" ? Number(selectedRating) : undefined
        console.log("[Map Search] Search params:", { keyword, rating, province: selectedProvince || undefined })
        loadResults({ keyword, rating, province: selectedProvince || undefined })
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
        <div className="min-h-screen flex flex-col bg-gray-50 relative">
            <Navbar />
            <main className="flex flex-1">
                {/* Sidebar */}
                <section className="w-full max-w-md border-r border-gray-200 bg-white h-[calc(100vh-0px)] overflow-y-auto">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tìm kiếm doanh nghiệp OCOP</h1>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Từ khóa
                                </label>
                                <input
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="Ví dụ: trà thảo mộc"
                                    className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-indigo-500 text-sm font-medium text-gray-900 bg-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">
                                        Tỉnh/Thành
                                    </label>
                                    <select
                                        value={selectedProvince}
                                        onChange={(e) => setSelectedProvince(e.target.value)}
                                        className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-900 bg-white focus:border-indigo-500 focus:ring-indigo-500"
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
                                    <label className="block text-sm font-bold text-gray-900 mb-2">
                                        OCOP Rating
                                    </label>
                                    <select
                                        value={selectedRating}
                                        onChange={(e) => setSelectedRating(e.target.value)}
                                        className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-900 bg-white focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Tất cả</option>
                                        {[3, 4, 5].map((rating) => (
                                            <option key={rating} value={rating}>
                                                {rating} sao
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition"
                            >
                                Tìm kiếm
                            </button>
                        </form>
                    </div>
                    <div className="border-t border-gray-200" />
                    <div className="p-4 space-y-4">
                        {loading && <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>}
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}
                        {!loading && enterprises.length === 0 && !error && (
                            <p className="text-gray-500 text-sm">Không tìm thấy doanh nghiệp phù hợp.</p>
                        )}
                        {enterprises.map((enterprise) => (
                            <article
                                key={enterprise.id}
                                className={`rounded-xl border ${enterprise.id === selectedId
                                    ? "border-indigo-500 bg-indigo-50"
                                    : "border-gray-200 bg-white"
                                    } p-4 shadow-sm hover:shadow transition cursor-pointer`}
                                onClick={() => handleEnterpriseClick(enterprise.id)}
                            >
                                <div className="flex gap-4">
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                        <Image
                                            src={enterprise.imageUrl || "/hero.jpg"}
                                            alt={enterprise.name}
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                                {enterprise.name}
                                            </h3>
                                            {enterprise.ocopRating && (
                                                <span className="text-sm text-yellow-600 font-semibold">
                                                    ⭐ {enterprise.ocopRating}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">
                                            {enterprise.district}, {enterprise.province}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {enterprise.businessField}
                                        </p>
                                    </div>
                                </div>
                                {enterprise.topProducts && enterprise.topProducts.length > 0 && (
                                    <div className="mt-3 flex gap-2 flex-wrap">
                                        {enterprise.topProducts.slice(0, 2).map((product) => (
                                            <span
                                                key={product.id}
                                                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                                            >
                                                {product.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>

                {/* Map */}
                <section className="flex-1 h-[calc(100vh-0px)]">
                    {loading && enterprises.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            Đang tải bản đồ...
                        </div>
                    ) : (
                        <InteractiveMap
                            enterprises={enterprises}
                            selectedId={selectedId}
                            onSelect={(id) => handleEnterpriseClick(id)}
                        />
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

