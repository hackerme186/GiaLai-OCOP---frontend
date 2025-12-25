"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import {
    getRevenueStatistics,
    getEnterprises,
    type RevenueStatisticsResponse,
    type User,
    type Enterprise,
} from "@/lib/api"
import { getRoleFromToken } from "@/lib/auth"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"

interface RevenueStatisticsTabProps {
    user: User | null
}

type PeriodType = "week" | "month" | "year"

export default function RevenueStatisticsTab({ user }: RevenueStatisticsTabProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<RevenueStatisticsResponse | null>(null)

    // Filters
    const [periodType, setPeriodType] = useState<PeriodType>("month")
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    )
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<number | undefined>(undefined)

    // Enterprise list (for SystemAdmin)
    const [enterprises, setEnterprises] = useState<Enterprise[]>([])

    // Check SystemAdmin - handle multiple case variations
    // Fallback to token if user.role is not available
    const isSystemAdmin = useMemo(() => {
        // Try to get role from user object first
        let role: string | null = null

        if (user?.role) {
            role = String(user.role).trim()
        } else if (typeof window !== "undefined") {
            // Fallback: try to get role from token
            role = getRoleFromToken() || null
        }

        if (!role) {
            if (typeof window !== "undefined") {
                console.warn("🔍 RevenueStatisticsTab - No role found in user object or token:", {
                    userRole: user?.role,
                    userObject: user,
                })
            }
            return false
        }

        const roleLower = role.toLowerCase().trim()
        const roleOriginal = role.trim()

        // Check various possible formats
        const result =
            roleLower === "systemadmin" ||
            roleLower === "system admin" ||
            roleLower === "sysadmin" ||
            roleLower === "system_admin" ||
            roleOriginal === "SystemAdmin" ||
            roleOriginal === "System Admin" ||
            roleOriginal === "SYSTEMADMIN" ||
            (roleLower.includes("system") && roleLower.includes("admin"))

        // Debug log
        if (typeof window !== "undefined") {
            console.log("🔍 RevenueStatisticsTab - Role check:", {
                userRole: user?.role,
                tokenRole: typeof window !== "undefined" ? getRoleFromToken() : null,
                finalRole: role,
                roleLower: roleLower,
                roleOriginal: roleOriginal,
                isSystemAdmin: result,
                userObject: user,
            })
        }

        return result
    }, [user?.role, user])

    // Define callbacks first before using them in useEffect
    const loadEnterprises = useCallback(async () => {
        if (!isSystemAdmin) return

        try {
            const enterprisesData = await getEnterprises({ pageSize: 1000 })
            const enterprisesList = Array.isArray(enterprisesData)
                ? enterprisesData
                : (enterprisesData as any)?.items || []

            // Sort enterprises by name for better UX
            const sortedEnterprises = enterprisesList.sort((a: Enterprise, b: Enterprise) =>
                a.name.localeCompare(b.name, "vi")
            )

            setEnterprises(sortedEnterprises)
        } catch (err) {
            console.error("Failed to load enterprises:", err)
            setEnterprises([])
        }
    }, [isSystemAdmin])

    const loadData = useCallback(async () => {
        // Validate date input
        if (!selectedDate) {
            setError("Vui lòng chọn ngày")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await getRevenueStatistics({
                type: periodType,
                date: selectedDate,
                enterpriseId: selectedEnterpriseId,
            })

            // Validate response structure
            if (!response || !response.summary || !response.chart) {
                throw new Error("Dữ liệu thống kê không hợp lệ")
            }

            setData(response)
        } catch (err) {
            console.error("❌ Failed to load revenue statistics:", err)

            // Extract detailed error information
            let errorMessage = "Không thể tải thống kê doanh thu"

            if (err instanceof Error) {
                errorMessage = err.message

                // Check for specific error types
                const errorAny = err as any
                if (errorAny.status === 404) {
                    errorMessage = "Không tìm thấy dữ liệu thống kê. Có thể chưa có đơn hàng hoàn thành trong khoảng thời gian này."
                } else if (errorAny.status === 403) {
                    errorMessage = "Bạn không có quyền xem thống kê doanh thu này."
                } else if (errorAny.status === 500 || errorAny.status === 502 || errorAny.status === 503) {
                    errorMessage = "Lỗi server khi xử lý thống kê. Vui lòng thử lại sau."
                } else if (errorAny.isNetworkError) {
                    errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
                } else if (errorAny.response) {
                    // Log the full response for debugging
                    console.error("📋 Error response details:", errorAny.response)

                    // Try to extract more details from response
                    if (typeof errorAny.response === "object") {
                        const responseObj = errorAny.response as any
                        if (responseObj.message && typeof responseObj.message === "string") {
                            errorMessage = responseObj.message
                        } else if (responseObj.error && typeof responseObj.error === "string") {
                            errorMessage = responseObj.error
                        }
                    }
                }
            }

            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [periodType, selectedDate, selectedEnterpriseId])

    // Use effects after callbacks are defined
    useEffect(() => {
        loadData()
    }, [loadData]) // loadData already includes selectedEnterpriseId in dependencies

    useEffect(() => {
        if (isSystemAdmin) {
            console.log("🔍 SystemAdmin detected, loading enterprises...")
            loadEnterprises()
        } else {
            const tokenRole = typeof window !== "undefined" ? getRoleFromToken() : null
            console.log("🔍 Not SystemAdmin, userRole:", user?.role, "tokenRole:", tokenRole)
        }
    }, [isSystemAdmin, loadEnterprises, user?.role])

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value)
    }

    // Format date label - BE trả về format: week/month = "dd/MM", year = "MM/yyyy"
    // Giữ nguyên format từ BE để đảm bảo consistency
    const formatDateLabel = (label: string) => {
        // BE đã format sẵn: week/month = "dd/MM", year = "MM/yyyy"
        // Chỉ cần return label từ BE
        return label
    }

    // Chart data
    const chartData = useMemo(() => {
        if (!data?.chart) return []
        return data.chart.map((item) => ({
            label: formatDateLabel(item.label),
            revenue: item.revenue,
            formattedRevenue: formatCurrency(item.revenue),
        }))
    }, [data, periodType])

    // Period label - Format theo BE logic
    const periodLabel = useMemo(() => {
        if (!data?.filter) return ""
        const { type, date } = data.filter

        if (!date) return ""

        try {
            const dateObj = new Date(date + "T00:00:00") // Add time to avoid timezone issues

            if (type === "week") {
                // Tuần bắt đầu từ thứ 2 (theo BE logic)
                const dayOfWeek = dateObj.getDay()
                const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
                const weekStart = new Date(dateObj)
                weekStart.setDate(dateObj.getDate() - daysToSubtract)
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)

                return `Tuần từ ${weekStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} đến ${weekEnd.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`
            } else if (type === "month") {
                return `Tháng ${dateObj.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`
            } else if (type === "year") {
                return `Năm ${dateObj.getFullYear()}`
            }
        } catch (e) {
            console.error("Error parsing date:", e)
        }

        return ""
    }, [data])

    // Debug: Log user info - MUST be before any early returns
    useEffect(() => {
        if (typeof window !== "undefined") {
            console.log("🔍 RevenueStatisticsTab - User info:", {
                user,
                role: user?.role,
                isSystemAdmin,
                enterprisesCount: enterprises.length,
            })
        }
    }, [user, isSystemAdmin, enterprises.length])

    // Loading state - show spinner only on initial load
    if (loading && !data) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
                <p className="text-gray-600">Đang tải thống kê doanh thu...</p>
            </div>
        )
    }

    if (error && !data) {
        return (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
                <div className="text-red-600 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-red-800 font-semibold mb-2">Lỗi tải dữ liệu</p>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Thử lại
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📊 Phân tích doanh thu</h2>
                        <p className="text-white/90 text-lg">Thống kê doanh thu theo thời gian</p>
                    </div>
                    {data?.filter && (
                        <div className="text-right">
                            <p className="text-sm text-white/80 mb-1">Kỳ thống kê</p>
                            <p className="text-lg font-semibold">{periodLabel}</p>
                            {isSystemAdmin && (
                                <>
                                    {data.filter.enterpriseName ? (
                                        <p className="text-sm text-white/80 mt-1">
                                            📊 Doanh nghiệp: <span className="font-semibold">{data.filter.enterpriseName}</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-white/80 mt-1">
                                            🌐 <span className="font-semibold">Toàn hệ thống</span>
                                        </p>
                                    )}
                                </>
                            )}
                            {!isSystemAdmin && data.filter.enterpriseName && (
                                <p className="text-sm text-white/80 mt-1">
                                    Doanh nghiệp: {data.filter.enterpriseName}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Bộ lọc</h3>
                </div>
                <div className={`grid gap-4 ${isSystemAdmin ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {/* Period Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Loại kỳ
                        </label>
                        <select
                            value={periodType}
                            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white cursor-pointer"
                        >
                            <option value="week">📅 Tuần</option>
                            <option value="month">📆 Tháng</option>
                            <option value="year">📊 Năm</option>
                        </select>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {periodType === "week" ? "Chọn tuần" : periodType === "month" ? "Chọn tháng" : "Chọn năm"}
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                const newDate = e.target.value
                                if (newDate) {
                                    setSelectedDate(newDate)
                                }
                            }}
                            max={new Date().toISOString().split("T")[0]} // Không cho chọn ngày tương lai
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                    </div>

                    {/* Enterprise Filter (SystemAdmin only) - Always show if SystemAdmin */}
                    {isSystemAdmin ? (
                        <div className="border-2 border-indigo-300 rounded-xl p-3 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-md">
                            <label className="block text-sm font-bold text-indigo-700 mb-2">
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Lọc theo doanh nghiệp
                                </span>
                            </label>
                            <select
                                value={selectedEnterpriseId || ""}
                                onChange={(e) => {
                                    const value = e.target.value
                                    console.log("🔍 Enterprise filter changed:", value)
                                    setSelectedEnterpriseId(
                                        value ? parseInt(value) : undefined
                                    )
                                }}
                                className="w-full px-4 py-3 border-2 border-indigo-400 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 transition-all bg-white cursor-pointer font-medium text-gray-900 shadow-sm"
                            >
                                <option value="">
                                    🌐 Tất cả doanh nghiệp (Toàn hệ thống)
                                </option>
                                {enterprises.length > 0 ? (
                                    enterprises.map((enterprise) => (
                                        <option key={enterprise.id} value={enterprise.id}>
                                            🏢 {enterprise.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>
                                        {loading ? "⏳ Đang tải danh sách doanh nghiệp..." : "❌ Không có doanh nghiệp nào"}
                                    </option>
                                )}
                            </select>
                            {selectedEnterpriseId ? (
                                <p className="text-xs text-indigo-700 mt-2 font-semibold bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200">
                                    💡 Đang xem doanh thu của: <span className="font-bold">{enterprises.find(e => e.id === selectedEnterpriseId)?.name || "Doanh nghiệp được chọn"}</span>
                                </p>
                            ) : (
                                <p className="text-xs text-gray-600 mt-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                    💡 Đang xem tổng hợp doanh thu toàn hệ thống
                                </p>
                            )}
                        </div>
                    ) : null}

                    {/* Debug: Show if not SystemAdmin but should be */}
                    {!isSystemAdmin && typeof window !== "undefined" && process.env.NODE_ENV === "development" && (
                        <div className="col-span-full bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3">
                            <p className="text-xs text-yellow-800">
                                ⚠️ Debug: User role = "{user?.role}" | isSystemAdmin = {String(isSystemAdmin)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading indicator when refreshing (non-blocking) */}
            {loading && data && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600 mr-3" />
                        <p className="text-sm text-blue-700">Đang cập nhật dữ liệu...</p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {data?.summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                                Tổng doanh thu
                            </p>
                            <p className="text-4xl font-bold leading-tight">
                                {data.summary.totalRevenue > 0 ? formatCurrency(data.summary.totalRevenue) : "0₫"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-md">
                                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                                Tổng đơn hàng
                            </p>
                            <p className="text-4xl font-bold text-blue-900 leading-tight">
                                {data.summary.totalOrders}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center shadow-md">
                                <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
                                Giá trị đơn trung bình
                            </p>
                            <p className="text-4xl font-bold text-purple-900 leading-tight">
                                {data.summary.averageOrderValue > 0 ? formatCurrency(data.summary.averageOrderValue) : "0₫"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State - No Data */}
            {data && chartData.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-12 border-2 border-gray-200 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có dữ liệu</h3>
                    <p className="text-gray-600 mb-4">
                        Không có đơn hàng hoàn thành trong khoảng thời gian này.
                    </p>
                    <p className="text-sm text-gray-500">
                        Hãy thử chọn khoảng thời gian khác hoặc kiểm tra lại bộ lọc.
                    </p>
                </div>
            )}

            {/* Chart */}
            {chartData.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900">
                                Biểu đồ doanh thu {periodType === "week" ? "theo ngày trong tuần" : periodType === "month" ? "theo ngày trong tháng" : "theo tháng trong năm"}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {periodType === "week" && "7 ngày trong tuần (bắt đầu từ thứ 2)"}
                                {periodType === "month" && data?.filter?.date && `Tất cả các ngày trong tháng ${new Date(data.filter.date + "T00:00:00").toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`}
                                {periodType === "year" && data?.filter?.date && `12 tháng trong năm ${new Date(data.filter.date + "T00:00:00").getFullYear()}`}
                            </p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={periodType === "month" ? 500 : 400}>
                        {periodType === "year" ? (
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000) {
                                            return `${(value / 1000000).toFixed(1)}M`
                                        } else if (value >= 1000) {
                                            return `${(value / 1000).toFixed(1)}K`
                                        }
                                        return value.toString()
                                    }}
                                />
                                <Tooltip
                                    formatter={(value: any) => [
                                        value && typeof value === 'number' ? formatCurrency(value) : "0₫",
                                        "Doanh thu"
                                    ]}
                                    labelFormatter={(label) => `Tháng: ${label}`}
                                    contentStyle={{
                                        backgroundColor: "white",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                        padding: "12px",
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="revenue" fill="#6366f1" name="Doanh thu" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        ) : (
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11 }}
                                    interval={periodType === "month" ? "preserveStartEnd" : 0}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000) {
                                            return `${(value / 1000000).toFixed(1)}M`
                                        } else if (value >= 1000) {
                                            return `${(value / 1000).toFixed(1)}K`
                                        }
                                        return value.toString()
                                    }}
                                />
                                <Tooltip
                                    formatter={(value: any) => [
                                        value && typeof value === 'number' ? formatCurrency(value) : "0₫",
                                        "Doanh thu"
                                    ]}
                                    labelFormatter={(label) => {
                                        if (periodType === "week" || periodType === "month") {
                                            return `Ngày: ${label}`
                                        } else {
                                            return `Tháng: ${label}`
                                        }
                                    }}
                                    contentStyle={{
                                        backgroundColor: "white",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                        padding: "12px",
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    dot={{ fill: "#6366f1", r: 5 }}
                                    activeDot={{ r: 8 }}
                                    name="Doanh thu"
                                />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            )}

            {/* Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Lưu ý về thống kê:</p>
                        <ul className="space-y-1">
                            <li>• Doanh thu chỉ tính từ các đơn hàng đã hoàn thành (Status = "Completed")</li>
                            <li>• Số liệu được tính toán theo thời gian thực từ database</li>
                            {isSystemAdmin ? (
                                <>
                                    <li>• <strong>SystemAdmin:</strong> Bạn có thể xem doanh thu toàn hệ thống hoặc lọc theo từng doanh nghiệp</li>
                                    <li>• Chọn "Tất cả doanh nghiệp" để xem tổng hợp, hoặc chọn doanh nghiệp cụ thể để xem chi tiết</li>
                                </>
                            ) : (
                                <li>• Bạn chỉ xem được doanh thu của doanh nghiệp mình</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

