"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  getTransactionHistory,
  type TransactionHistoryItem,
  type TransactionSort,
} from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

const PAGE_SIZE = 10;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("vi-VN");
};

const mapToBaseStatus = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("cancel") || s.includes("fail") || s.includes("reject"))
    return "Cancelled";
  if (s.includes("pendingcompletion")) return "Completed"; // gộp về Completed
  if (s.includes("ship") || s.includes("giao") || s.includes("deliver"))
    return "Shipped";
  if (s.includes("process")) return "Processing";
  if (s.includes("pending")) return "Pending";
  if (s.includes("success") || s.includes("complete") || s.includes("paid"))
    return "Completed";
  return "Pending";
};

const statusBadgeClass = (status: string) => {
  const normalized = mapToBaseStatus(status).toLowerCase();
  if (normalized === "completed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (normalized === "pending") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (normalized === "processing") {
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
  if (normalized === "shipped") {
    return "bg-sky-50 text-sky-700 border-sky-200";
  }
  if (normalized === "cancelled") {
    return "bg-red-50 text-red-700 border-red-200";
  }
  return "bg-gray-50 text-gray-700 border-gray-200";
};

export default function TransactionsPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState<TransactionSort>("date_desc");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        router.replace("/login?redirect=/transactions");
        return;
      }
      setAuthReady(true);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    loadTransactions(1);
  }, [authReady, statusFilter, paymentFilter, sortBy, appliedSearch]);

  const loadTransactions = async (pageToLoad: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTransactionHistory({
        page: pageToLoad,
        pageSize: PAGE_SIZE,
        status: statusFilter !== "all" ? statusFilter : undefined,
        paymentMethod: paymentFilter !== "all" ? paymentFilter : undefined,
        sortBy,
        searchTerm: appliedSearch.trim() || undefined,
      });

      const term = appliedSearch.trim().toLowerCase();
      const filteredItems = term
        ? response.items.filter((item) => {
            const code = item.transactionCode?.toLowerCase() || "";
            const orderCode = item.orderCode?.toLowerCase() || "";
            return code.includes(term) || orderCode.includes(term);
          })
        : response.items;

      setTransactions(filteredItems);
      setPage(response.page);
      setTotalPages(response.totalPages);
      setTotalItems(filteredItems.length);
    } catch (err: any) {
      const message =
        err?.bodyMessage || err?.message || "Không thể tải lịch sử giao dịch";
      setError(message);

      if (err?.isAuthError) {
        setTimeout(() => router.replace("/login?redirect=/transactions"), 1200);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedSearch(searchInput);
  };

  const baseStatuses = ["Pending", "Processing", "Shipped", "Completed"];
  const paymentOptions = useMemo(() => ["BankTransfer", "COD"], []);

  const paginationItems = useMemo(() => {
    const items: Array<number | "left-ellipsis" | "right-ellipsis"> = [];
    if (totalPages <= 8) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    items.push(1);

    if (page > 3) items.push("left-ellipsis");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let p = start; p <= end; p++) {
      items.push(p);
    }

    if (page < totalPages - 2) items.push("right-ellipsis");

    items.push(totalPages);
    return items;
  }, [page, totalPages]);

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === page)
      return;
    loadTransactions(targetPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const statusSteps = ["Đặt hàng", "Xử lý", "Đang giao", "Đã nhận"];

  const statusStepIndex = (status: string) => {
    const base = mapToBaseStatus(status).toLowerCase();
    if (base === "cancelled") return -1;
    if (base === "pending") return 0;
    if (base === "processing") return 1;
    if (base === "shipped") return 2;
    if (base === "completed") return 3;
    return 0;
  };

  const statusIcon = (status: string) => {
    const base = mapToBaseStatus(status).toLowerCase();
    if (base === "completed") return "✅"; // Completed
    if (base === "pending") return "🕒"; // Pending
    if (base === "processing") return "⚙️"; // Processing
    if (base === "shipped") return "🚚"; // Shipped / Delivering
    if (base === "cancelled") return "❌";
    return "ℹ️";
  };

  const isReorderable = (status: string) => {
    const s = status.toLowerCase();
    return (
      s.includes("success") || s.includes("complete") || s.includes("paid")
    );
  };

  const paymentIcon = (method?: string) => {
    if (!method) return "💳";
    const m = method.toLowerCase();
    if (m.includes("cod") || m.includes("cash")) return "💵";
    if (m.includes("bank") || m.includes("transfer")) return "🏦";
    return "💳";
  };

  const handlePageChange = (direction: "prev" | "next") => {
    const nextPage = direction === "prev" ? page - 1 : page + 1;
    goToPage(nextPage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lịch sử giao dịch
          </h1>
          <p className="text-gray-600">
            Xem lại các giao dịch đơn hàng và thanh toán gần đây của bạn.
          </p>
        </div>

        <div className="bg-white/90 border border-emerald-100 rounded-2xl shadow-md shadow-emerald-100/60 p-6 mb-6 backdrop-blur">
          <form
            onSubmit={onSearchSubmit}
            className="flex flex-col md:flex-row md:items-end md:flex-wrap gap-4"
          >
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Mã giao dịch, mã đơn hàng..."
                  className="flex-1 px-4 py-2 focus:outline-none text-sm"
                />
                <button
                  type="submit"
                  className="px-4 bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  Tìm
                </button>
              </div>
            </div>

            <div className="w-full md:w-48">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm bg-white"
              >
                <option value="all">Tất cả</option>
                {baseStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-52">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phương thức
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm bg-white"
              >
                <option value="all">Tất cả</option>
                {paymentOptions.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-52">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sắp xếp
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as TransactionSort)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus-ring-green-100 text-sm"
              >
                <option value="date_desc">Ngày mới nhất</option>
                <option value="date_asc">Ngày cũ nhất</option>
                <option value="amount_desc">Số tiền giảm dần</option>
                <option value="amount_asc">Số tiền tăng dần</option>
              </select>
            </div>
          </form>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <p className="font-semibold">Không thể tải dữ liệu</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-100 border-t-green-600 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              Đang tải lịch sử giao dịch...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
            <p className="text-lg font-semibold text-gray-800 mb-2">
              Chưa có giao dịch
            </p>
            <p className="text-gray-500 text-sm">
              Bạn sẽ thấy giao dịch của mình tại đây sau khi thanh toán đơn
              hàng.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.transactionCode}
                className="bg-white/98 border border-emerald-100 rounded-2xl shadow-xl shadow-emerald-100/60 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-l-4 border-l-emerald-500"
              >
                <div className="flex items-start gap-4 w-full">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center text-emerald-600 text-xl shadow-inner">
                    🛍️
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Mã giao dịch
                      </span>
                      <span className="text-[1.1rem] font-extrabold text-gray-900 tracking-wide">
                        {tx.transactionCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(
                          tx.status
                        )}`}
                      >
                        <span>{statusIcon(tx.status)}</span>
                        {mapToBaseStatus(tx.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                        🏷️ <strong className="text-gray-800">{tx.type}</strong>
                      </span>
                      <span className="inline-flex items-center justify-center gap-2 bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-full border border-cyan-100 whitespace-nowrap">
                        {paymentIcon(tx.paymentMethod)}{" "}
                        <strong className="text-gray-800">
                          {tx.paymentMethod}
                        </strong>
                      </span>
                      <span>
                        Ngày:{" "}
                        <strong className="text-gray-800">
                          {formatDateTime(tx.transactionDate)}
                        </strong>
                      </span>
                      {tx.orderCode && (
                        <span>
                          Đơn hàng:{" "}
                          <strong className="text-gray-800">
                            {tx.orderCode}
                          </strong>
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        Lộ trình giao hàng
                        {tx.status && (
                          <span className="text-xs font-medium text-gray-500">
                            ({mapToBaseStatus(tx.status)})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs">
                        {statusSteps.map((step, idx) => {
                          const active =
                            idx <= statusStepIndex(tx.status) &&
                            statusStepIndex(tx.status) >= 0;
                          const failed = statusStepIndex(tx.status) === -1;
                          return (
                            <div key={step} className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  failed
                                    ? "bg-red-400"
                                    : active
                                    ? "bg-emerald-500"
                                    : "bg-gray-200"
                                }`}
                              />
                              <span
                                className={`text-[11px] font-semibold ${
                                  failed
                                    ? "text-red-500"
                                    : active
                                    ? "text-emerald-700"
                                    : "text-gray-400"
                                }`}
                              >
                                {step}
                              </span>
                              {idx < statusSteps.length - 1 && (
                                <div
                                  className={`w-6 h-0.5 ${
                                    failed
                                      ? "bg-red-300"
                                      : idx < statusStepIndex(tx.status)
                                      ? "bg-emerald-400"
                                      : "bg-gray-200"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {tx.description && (
                      <p className="text-sm text-gray-500">{tx.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Số tiền</p>
                    <p className="text-2xl font-black text-emerald-800">
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[110px] max-w-[160px]">
                    {tx.orderId ? (
                      <Link
                        href={`/transactions/${tx.orderId}`}
                        className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors min-h-[28px]"
                      >
                        Xem chi tiết
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        Không tìm thấy mã đơn để xem chi tiết
                      </span>
                    )}
                    {isReorderable(tx.status) && tx.orderId && (
                      <Link
                        href={`/orders?reorder=${tx.orderId}`}
                        className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors min-h-[28px]"
                      >
                        🔄 Đặt lại
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() => handlePageChange("prev")}
                  disabled={page <= 1 || loading}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ‹ Trước
                </button>

                {paginationItems.map((item, index) => {
                  if (item === "left-ellipsis" || item === "right-ellipsis") {
                    return (
                      <span
                        key={`${item}-${index}`}
                        className="px-3 py-2 rounded-lg border border-transparent text-sm text-gray-500"
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive = item === page;
                  return (
                    <button
                      key={item}
                      onClick={() => goToPage(item)}
                      className={`min-w-[40px] px-3 py-2 rounded-lg border text-sm font-semibold ${
                        isActive
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                      }`}
                      disabled={loading}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange("next")}
                  disabled={page >= totalPages || loading}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Tiếp ›
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
