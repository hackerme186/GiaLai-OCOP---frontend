"use client"

import { useEffect, useState } from "react"
import { getProducts, getInventoryHistory, adjustInventory, type Product, type User, type InventoryHistory } from "@/lib/api"

interface InventoryTabProps {
  user: User | null
}

export default function InventoryTab({ user }: InventoryTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustQuantity, setAdjustQuantity] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.enterpriseId) {
      loadProducts()
      loadInventoryHistory()
    }
  }, [user?.enterpriseId])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts({ pageSize: 100 })
      setProducts(data)
    } catch (err) {
      console.error("Failed to load products:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadInventoryHistory = async (productId?: number) => {
    try {
      setLoadingHistory(true)
      const response = await getInventoryHistory({ productId, pageSize: 50 })
      setInventoryHistory(response.items || [])
    } catch (err) {
      console.error("Failed to load inventory history:", err)
      setInventoryHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAdjustStock = async () => {
    if (!selectedProduct || !adjustQuantity || !adjustReason) {
      alert("Vui lòng điền đầy đủ thông tin")
      return
    }

    const quantity = parseFloat(adjustQuantity)
    if (isNaN(quantity) || quantity === 0) {
      alert("Số lượng không hợp lệ")
      return
    }

    try {
      setSaving(true)

      // Call API to adjust inventory
      const history = await adjustInventory({
        productId: selectedProduct.id,
        type: quantity > 0 ? "import" : "export",
        quantity: quantity,
        reason: adjustReason,
        lowStockThreshold: lowStockThreshold,
      })

      // Refresh products and history
      await loadProducts()
      await loadInventoryHistory(selectedProduct.id)

      setShowAdjustModal(false)
      setAdjustQuantity("")
      setAdjustReason("")
      setSelectedProduct(null)
      alert("Đã cập nhật tồn kho thành công!")
    } catch (err) {
      console.error("Failed to adjust stock:", err)
      alert(err instanceof Error ? err.message : "Không thể cập nhật tồn kho")
    } finally {
      setSaving(false)
    }
  }

  // Logic tính toán tồn thấp và hết hàng
  // Nếu có stockQuantity từ backend: dựa vào số lượng thực tế
  // Nếu không có: dựa vào stockStatus
  const lowStockProducts = products.filter(p => {
    if (p.stockQuantity !== undefined) {
      // Có số lượng thực tế: so sánh với ngưỡng
      return p.stockQuantity > 0 && p.stockQuantity <= lowStockThreshold
    } else {
      // Không có số lượng: dựa vào stockStatus
      return p.stockStatus === "LowStock"
    }
  })

  const outOfStockProducts = products.filter(p => {
    if (p.stockQuantity !== undefined) {
      // Có số lượng thực tế: hết hàng khi = 0
      return p.stockQuantity === 0
    } else {
      // Không có số lượng: dựa vào stockStatus
      return p.stockStatus === "OutOfStock"
    }
  })

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang tải thông tin kho...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl shadow-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">📚 Quản lý kho</h2>
        <p className="text-purple-100 text-lg">Theo dõi và quản lý tồn kho sản phẩm</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border-2 border-blue-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>

          <div className="text-4xl font-bold text-blue-700 mb-2">
            {products.filter(p => p.stockStatus === "InStock").length}
          </div>
          <div className="text-sm font-semibold text-blue-600">Sản phẩm có hàng</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-lg p-6 border-2 border-green-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold text-green-700 mb-2">
            {products.filter(p => p.stockStatus === "InStock").length}
          </div>
          <div className="text-sm font-semibold text-green-600">Sản phẩm còn hàng</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl shadow-lg p-6 border-2 border-yellow-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>

          <div className="text-4xl font-bold text-yellow-700 mb-2">
            {lowStockProducts.length}
          </div>
          <div className="text-sm font-semibold text-yellow-600">Tồn thấp</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl shadow-lg p-6 border-2 border-red-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          <div className="text-4xl font-bold text-red-700 mb-2">
            {outOfStockProducts.length}
          </div>
          <div className="text-sm font-semibold text-red-600">Hết hàng</div>

        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-yellow-900">Cảnh báo tồn thấp</h3>
          </div>
          <div className="space-y-2">
            {lowStockProducts.slice(0, 5).map(product => {
              const quantity = product.stockQuantity ?? 0
              const hasQuantity = product.stockQuantity !== undefined

              return (
                <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="font-medium text-gray-900">{product.name}</span>
                  <span className="text-yellow-600 font-semibold">
                    {hasQuantity
                      ? `Còn ${quantity} sản phẩm (ngưỡng: ${lowStockThreshold})`
                      : "Tồn thấp"
                    }
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Danh sách sản phẩm</h3>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ngưỡng tồn thấp:</label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn vị</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map(product => {
                // Logic hiển thị tồn kho
                const hasQuantity = product.stockQuantity !== undefined
                const quantity = product.stockQuantity ?? 0

                // Xác định trạng thái
                const isOutOfStock = hasQuantity
                  ? quantity === 0
                  : product.stockStatus === "OutOfStock"

                const isLowStock = hasQuantity
                  ? quantity > 0 && quantity <= lowStockThreshold
                  : product.stockStatus === "LowStock"

                const isInStock = hasQuantity
                  ? quantity > lowStockThreshold
                  : product.stockStatus === "InStock"

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.unit || "cái"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-yellow-600" : "text-green-600"
                        }`}>
                        {hasQuantity
                          ? `${quantity.toLocaleString("vi-VN")} ${product.unit || ""}` // Hiển thị số lượng nếu có
                          : isOutOfStock ? "0" : isLowStock ? `< ${lowStockThreshold}` : "Có hàng"
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.stockStatus === "InStock"
                        ? "bg-green-100 text-green-800"
                        : product.stockStatus === "OutOfStock"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {product.stockStatus === "InStock" ? "Còn hàng" :
                          product.stockStatus === "OutOfStock" ? "Hết hàng" : "Tồn thấp"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={async () => {
                          setSelectedProduct(product)
                          await loadInventoryHistory(product.id)
                          setShowAdjustModal(true)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Điều chỉnh
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory History */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Lịch sử thay đổi tồn kho</h3>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải lịch sử...</p>
          </div>
        ) : inventoryHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có lịch sử thay đổi</p>
        ) : (
          <div className="space-y-3">
            {inventoryHistory.map(history => (
              <div key={history.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{history.productName}</div>
                  <div className="text-sm text-gray-600">{history.reason}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(history.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${history.type === "import" ? "text-green-600" : "text-red-600"
                    }`}>
                    {history.type === "import" ? "+" : "-"}{history.quantity}
                  </div>
                  <div className="text-xs text-gray-500">
                    {history.previousQuantity} → {history.newQuantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Điều chỉnh tồn kho</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Sản phẩm:</p>
              <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProduct.stockQuantity !== undefined ? (
                  <>
                    Tồn kho hiện tại: <span className="font-semibold">{selectedProduct.stockQuantity.toLocaleString("vi-VN")} {selectedProduct.unit || ""}</span>
                    {selectedProduct.stockQuantity <= lowStockThreshold && selectedProduct.stockQuantity > 0 && (
                      <span className="text-yellow-600 ml-2">(Tồn thấp - ngưỡng: {lowStockThreshold})</span>
                    )}
                  </>
                ) : (
                  <>
                    Trạng thái: <span className="font-semibold">
                      {selectedProduct.stockStatus === "InStock" ? "Còn hàng" :
                        selectedProduct.stockStatus === "OutOfStock" ? "Hết hàng" : "Tồn thấp"}
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Số lượng thay đổi <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  placeholder="Nhập số lượng (+ để nhập, - để xuất)"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Số dương để nhập kho, số âm để xuất kho
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Lý do <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                  rows={3}
                  placeholder="Nhập lý do điều chỉnh..."
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAdjustModal(false)
                  setSelectedProduct(null)
                  setAdjustQuantity("")
                  setAdjustReason("")
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleAdjustStock}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

