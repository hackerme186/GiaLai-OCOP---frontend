"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getTransactionDetail, type TransactionDetail } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("vi-VN");
};

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (
    normalized.includes("completed") ||
    normalized === "paid" ||
    normalized === "success"
  ) {
    return "bg-green-100 text-green-700 border-green-200";
  }
  if (normalized.includes("pending") || normalized.includes("processing")) {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }
  if (
    normalized.includes("cancel") ||
    normalized.includes("failed") ||
    normalized.includes("rejected")
  ) {
    return "bg-red-100 text-red-700 border-red-200";
  }
  return "bg-gray-100 text-gray-700 border-gray-200";
};

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const transactionId = idParam ? Number(idParam) : NaN;

  const [transaction, setTransaction] = useState<TransactionDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!transactionId || Number.isNaN(transactionId)) {
        setError("ID giao dịch không hợp lệ");
        setLoading(false);
        return;
      }

      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        router.replace(`/login?redirect=/transactions/${transactionId}`);
        return;
      }

      await loadDetail(transactionId);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  const loadDetail = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactionDetail(id);
      setTransaction(data);
    } catch (err: any) {
      const message =
        err?.bodyMessage || err?.message || "Không thể tải chi tiết giao dịch";
      setError(message);

      if (err?.isAuthError) {
        setTimeout(
          () => router.replace(`/login?redirect=/transactions/${id}`),
          1200
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Mã giao dịch</p>
            <h1 className="text-3xl font-bold text-gray-900">
              {transaction?.transactionCode || "Chi tiết giao dịch"}
            </h1>
            {transaction?.status && (
              <span
                className={`inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${statusClass(
                  transaction.status
                )}`}
              >
                {transaction.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/transactions"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-white text-sm font-semibold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm transition-colors"
            >
              ← Quay lại
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6">
            <p className="font-semibold">Không thể tải dữ liệu</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-100 border-t-green-600 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              Đang tải chi tiết giao dịch...
            </p>
          </div>
        ) : !transaction ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
            <p className="text-lg font-semibold text-gray-800 mb-2">
              Không tìm thấy giao dịch
            </p>
            <p className="text-gray-500 text-sm">
              Vui lòng kiểm tra lại mã giao dịch.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-emerald-700 tracking-wide">
                  Số tiền
                </p>
                <p className="text-3xl font-black text-emerald-700 mt-2">
                  {formatCurrency(transaction.totalAmount)}
                </p>
              </div>
              <div className="bg-cyan-50/70 border border-cyan-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                  Loại
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {transaction.type}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                  Thời gian
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {formatDateTime(transaction.transactionDate)}
                </p>
              </div>
            </div>

            {transaction.customer && (
              <div className="bg-white/95 border border-emerald-100 rounded-2xl shadow-md shadow-emerald-50 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  👤 Thông tin khách hàng
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                      Họ tên
                    </p>
                    <p className="font-semibold text-gray-900">
                      {transaction.customer.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                      Email
                    </p>
                    <p className="font-semibold text-gray-900">
                      {transaction.customer.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                      SĐT
                    </p>
                    <p className="font-semibold text-gray-900">
                      {transaction.customer.phoneNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                      Địa chỉ
                    </p>
                    <p className="font-semibold text-gray-900">
                      {transaction.customer.address || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {transaction.payments && transaction.payments.length > 0 && (
              <div className="bg-white/95 border border-emerald-100 rounded-2xl shadow-md shadow-emerald-50 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  💳 Thanh toán
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {transaction.payments.map((payment, idx) => (
                    <div
                      key={`${payment.reference}-${idx}`}
                      className="border border-emerald-50 rounded-xl p-4 bg-white/95 shadow-sm"
                    >
                      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                        Phương thức
                      </p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {payment.method}
                      </p>
                      <div className="mt-3 space-y-1.5 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                            Trạng thái
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                            Mã tham chiếu:
                          </span>{" "}
                          <span className="font-semibold">
                            {payment.reference || "N/A"}
                          </span>
                        </div>
                        {payment.maskedBankAccount && (
                          <div>
                            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                              Tài khoản:
                            </span>{" "}
                            {payment.maskedBankAccount}
                          </div>
                        )}
                        {payment.bankName && (
                          <div>
                            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                              Ngân hàng:
                            </span>{" "}
                            {payment.bankName}
                          </div>
                        )}
                        {payment.paidAt && (
                          <div>
                            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                              Thanh toán lúc:
                            </span>{" "}
                            {formatDateTime(payment.paidAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transaction.orderItems && transaction.orderItems.length > 0 && (
              <div className="bg-white/95 border border-emerald-100 rounded-2xl shadow-md shadow-emerald-50 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  🛒 Sản phẩm
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Sản phẩm
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          SL
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Giá
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Tạm tính
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transaction.orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 whitespace-nowrap flex items-center gap-3">
                            {item.productImage ? (
                              <Image
                                src={item.productImage}
                                alt={item.productName}
                                width={64}
                                height={64}
                                className="rounded-lg object-cover border border-emerald-100 bg-white"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 text-base shadow-inner">
                                🛍️
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">
                                {item.productName}
                              </p>
                              <p className="text-xs text-gray-500">
                                Mã: {item.productId}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {transaction.shippingInfo && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Vận chuyển
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>
                    Đơn vị giao:{" "}
                    <strong>
                      {transaction.shippingInfo.shipperName || "N/A"}
                    </strong>
                  </div>
                  <div>
                    Mã vận đơn:{" "}
                    <strong>
                      {transaction.shippingInfo.trackingNumber || "N/A"}
                    </strong>
                  </div>
                  <div>
                    Trạng thái:{" "}
                    <strong>{transaction.shippingInfo.status}</strong>
                  </div>
                  <div>
                    Giao dự kiến:{" "}
                    <strong>
                      {transaction.shippingInfo.deliveredAt
                        ? formatDateTime(transaction.shippingInfo.deliveredAt)
                        : "N/A"}
                    </strong>
                  </div>
                  <div>
                    Ghi chú:{" "}
                    {transaction.shippingInfo.deliveryNotes || "Không có"}
                  </div>
                  <div>
                    Địa chỉ giao:{" "}
                    {transaction.shippingInfo.shippingAddress || "Không có"}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
