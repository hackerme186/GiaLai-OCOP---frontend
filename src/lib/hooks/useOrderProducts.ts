"use client"

import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import { getProduct, type OrderItem, type Product } from "@/lib/api"
import { getImageUrl } from "@/lib/imageUtils"

/**
 * Hook để load thông tin sản phẩm từ API cho các order items
 * @param orderItems - Mảng các order items cần load thông tin sản phẩm
 * @returns Object chứa các hàm helper và trạng thái loading
 */
export function useOrderProducts(orderItems?: OrderItem[]) {
    // Lấy danh sách các productId duy nhất từ orderItems
    const productIds = useMemo(() => {
        if (!orderItems || orderItems.length === 0) return []
        const uniqueIds = Array.from(new Set(orderItems.map(item => item.productId)))
        return uniqueIds
    }, [orderItems])

    // Sử dụng useQueries để load tất cả products song song
    const productQueries = useQueries({
        queries: productIds.map(productId => ({
            queryKey: ["product", productId],
            queryFn: () => getProduct(productId, { silent: true }),
            staleTime: 5 * 60 * 1000, // 5 phút
            retry: 1, // Chỉ retry 1 lần để tránh spam
        })),
    })

    // Tạo Map để truy cập nhanh product theo ID
    const productsMap = useMemo(() => {
        const map = new Map<number, Product>()
        productQueries.forEach((query, index) => {
            if (query.data && productIds[index]) {
                map.set(productIds[index], query.data)
            }
        })
        return map
    }, [productQueries, productIds])

    // Kiểm tra xem có đang load không
    const loadingProducts = useMemo(() => {
        return productQueries.some(query => query.isLoading)
    }, [productQueries])

    /**
     * Lấy tên sản phẩm từ product đã load hoặc từ orderItem
     */
    const getProductName = (item: OrderItem): string => {
        const product = productsMap.get(item.productId)
        if (product?.name) {
            return product.name
        }
        // Fallback về productName từ orderItem nếu có
        return item.productName || `Sản phẩm #${item.productId}`
    }

    /**
     * Lấy URL hình ảnh sản phẩm từ product đã load hoặc từ orderItem
     */
    const getProductImageUrl = (item: OrderItem): string => {
        // Ưu tiên 1: Lấy từ orderItem.productImageUrl (đã có sẵn, không cần fetch)
        if (item.productImageUrl) {
            return getImageUrl(item.productImageUrl, '/hero.jpg')
        }
        
        const product = productsMap.get(item.productId)
        
        // Ưu tiên 2: Lấy từ product.imageUrl (field chính của Product)
        if (product?.imageUrl) {
            return getImageUrl(product.imageUrl, '/hero.jpg')
        }
        
        // Fallback về hero.jpg
        return '/hero.jpg'
    }

    return {
        getProductName,
        getProductImageUrl,
        loadingProducts,
        products: productsMap,
    }
}


