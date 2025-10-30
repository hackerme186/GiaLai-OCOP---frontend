"use client";

import { useCart } from "@/lib/cart-context";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCart = async () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) {
      setIsClearing(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      clearCart();
      setIsClearing(false);
    }
  };

  const handleRemoveItem = (productId: number, productName: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa ${productName} khỏi giỏ hàng?`)) {
      removeFromCart(productId);
    }
  };

  const handleQuantityUpdate = (
    productId: number,
    newQuantity: number,
    maxQuantity: number
  ) => {
    if (newQuantity > maxQuantity) {
      alert(`Chỉ còn ${maxQuantity} sản phẩm trong kho`);
      updateQuantity(productId, maxQuantity);
    } else if (newQuantity <= 0) {
      handleRemoveItem(
        productId,
        cart.items.find((item) => item.product.id === productId)?.product
          .name || ""
      );
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Giỏ hàng trống
            </h1>
            <p className="text-gray-600 mb-8">
              Bạn chưa có sản phẩm nào trong giỏ hàng
            </p>
            <Link
              href="/products"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Giỏ hàng của bạn
          </h1>
          <p className="text-gray-600">
            {cart.totalItems} sản phẩm trong giỏ hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.product.id}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={item.product.image || "/hero.jpg"}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    {item.product.category && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.product.category}
                      </p>
                    )}
                    <div className="flex items-center mt-2">
                      <span className="text-lg font-bold text-gray-900">
                        {item.product.price?.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            handleQuantityUpdate(
                              item.product.id,
                              item.quantity - 1,
                              item.product.quantity
                            )
                          }
                          className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityUpdate(
                              item.product.id,
                              parseInt(e.target.value) || 0,
                              item.product.quantity
                            )
                          }
                          className="px-4 py-2 text-center w-16 focus:outline-none"
                          min="1"
                          max={item.product.quantity}
                        />
                        <button
                          onClick={() =>
                            handleQuantityUpdate(
                              item.product.id,
                              item.quantity + 1,
                              item.product.quantity
                            )
                          }
                          className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                          disabled={item.quantity >= item.product.quantity}
                        >
                          +
                        </button>
                      </div>

                      <div className="text-sm text-gray-500">
                        Còn {item.product.quantity} sản phẩm
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() =>
                          handleRemoveItem(item.product.id, item.product.name)
                        }
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Item Total */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Thành tiền:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {(
                        (item.product.price || 0) * item.quantity
                      ).toLocaleString("vi-VN")}{" "}
                      ₫
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            <div className="flex justify-end">
              <button
                onClick={handleClearCart}
                disabled={isClearing}
                className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
              >
                {isClearing ? "Đang xóa..." : "Xóa tất cả"}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">
                    {cart.totalPrice.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium text-green-600">Miễn phí</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      Tổng cộng:
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {cart.totalPrice.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                  Thanh toán ngay
                </button>

                <Link
                  href="/products"
                  className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-block text-center"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 mr-2 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Thanh toán an toàn & bảo mật
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
