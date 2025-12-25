"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  getWallet,
  getWalletTransactions,
  createWalletRequest,
  getWalletRequests,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setDefaultBankAccount,
  type Wallet,
  type WalletTransaction,
  type WalletRequest,
  type BankAccount,
} from "@/lib/api";
import { isLoggedIn, getRoleFromToken } from "@/lib/auth";
import Image from "next/image";

// Danh sách ngân hàng Việt Nam hỗ trợ VietQR
const BANKS = [
  { code: "970425", name: "Ngân hàng TMCP An Bình (ABBANK)" },
  { code: "970416", name: "Ngân hàng TMCP Á Châu (ACB)" },
  { code: "970409", name: "Ngân hàng TMCP Bắc Á (BacABank)" },
  {
    code: "970418",
    name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)",
  },
  { code: "970438", name: "Ngân hàng TMCP Bảo Việt (BaoVietBank)" },
  { code: "970432", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)" },
  {
    code: "970444",
    name: "Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam (CBBank)",
  },
  { code: "422589", name: "Ngân hàng TNHH MTV CIMB Việt Nam (CIMB)" },
  { code: "970446", name: "Ngân hàng Hợp tác xã Việt Nam (COOPBANK)" },
  { code: "970406", name: "Ngân hàng TMCP Đông Á (DongA Bank)" },
  { code: "970437", name: "Ngân hàng TMCP Phát triển TP.HCM (HDBank)" },
  { code: "970448", name: "Ngân hàng TMCP Phương Đông (OCB)" },
  { code: "970403", name: "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)" },
  { code: "970441", name: "Ngân hàng TMCP Quốc tế Việt Nam (VIB)" },
  {
    code: "970405",
    name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)",
  },
  { code: "970407", name: "Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)" },
  { code: "970415", name: "Ngân hàng TMCP Công Thương Việt Nam (VietinBank)" },
  {
    code: "970436",
    name: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
  },
  { code: "970422", name: "Ngân hàng TMCP Quân Đội (MB Bank)" },
  { code: "970423", name: "Ngân hàng TMCP Tiên Phong (TPBank)" },
];

export default function WalletPage() {
  const router = useRouter();

  // Thông tin tài khoản SystemAdmin (MB Bank)
  const ADMIN_BANK_ACCOUNT =
    process.env.NEXT_PUBLIC_ADMIN_BANK_ACCOUNT || "0858153779";
  const ADMIN_BANK_CODE = process.env.NEXT_PUBLIC_ADMIN_BANK_CODE || "970422"; // MB Bank BIN
  const ADMIN_ACCOUNT_NAME =
    process.env.NEXT_PUBLIC_ADMIN_ACCOUNT_NAME || "NGUYEN BA QUYET";

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [editingBankAccount, setEditingBankAccount] =
    useState<BankAccount | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDescription, setDepositDescription] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDescription, setWithdrawDescription] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<
    number | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [depositRequestId, setDepositRequestId] = useState<number | null>(null);
  const [showDepositQRCode, setShowDepositQRCode] = useState(false);

  // Hàm tạo QR code URL cho SystemAdmin
  const generateAdminQRCode = (amount: number, requestId: number): string => {
    const content = `NAP-${requestId}`; // Nội dung chuyển khoản: NAP-{requestId}
    // Format VietQR: https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png?amount={amount}&addInfo={content}
    return `https://img.vietqr.io/image/${ADMIN_BANK_CODE}-${ADMIN_BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      content
    )}`;
  };

  // Bank Account Form
  const [bankForm, setBankForm] = useState({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    branch: "",
    isDefault: false,
  });
  const [isCustomBankMode, setIsCustomBankMode] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        router.replace("/login");
        return;
      }

      const role = getRoleFromToken();
      if (role === "SystemAdmin") {
        router.replace("/admin");
        return;
      }

      loadData();
    };
    checkAuth();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [walletRes, txRes, reqRes, bankRes] = await Promise.allSettled([
        getWallet(),
        getWalletTransactions({ page: 1, pageSize: 20 }),
        getWalletRequests({ page: 1, pageSize: 10 }),
        getBankAccounts(),
      ]);

      const errors: string[] = [];

      if (walletRes.status === "fulfilled") {
        setWallet(walletRes.value);
      } else {
        console.error("Failed to load wallet:", walletRes.reason);
        errors.push("Không thể tải thông tin ví");
      }

      if (txRes.status === "fulfilled") {
        setTransactions(txRes.value);
      } else {
        console.error("Failed to load wallet transactions:", txRes.reason);
      }

      if (reqRes.status === "fulfilled") {
        setRequests(reqRes.value || []);
      } else {
        console.error("Failed to load wallet requests:", reqRes.reason);
        setRequests([]);
        errors.push("Không thể tải danh sách yêu cầu");
      }

      if (bankRes.status === "fulfilled") {
        setBankAccounts(bankRes.value || []);
      } else {
        console.warn("Bank accounts may be unavailable:", bankRes.reason);
        setBankAccounts([]);
      }

      // Set default bank account for withdraw
      const defaultAccount = (
        bankRes.status === "fulfilled" ? bankRes.value || [] : []
      ).find((acc) => acc.isDefault);
      if (defaultAccount) {
        setSelectedBankAccountId(defaultAccount.id);
      }

      if (errors.length > 0) {
        setError(errors.join(". "));
      }
    } catch (err) {
      console.error("Failed to load wallet data:", err);
      setError(
        err instanceof Error ? err.message : "Không thể tải thông tin ví"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const amount = parseFloat(depositAmount);
      if (amount < 1000 || amount > 100000000) {
        setError("Số tiền phải từ 1,000 VND đến 100,000,000 VND");
        return;
      }

      // Tất cả yêu cầu nạp tiền đều phải được gửi lên SystemAdmin để xét duyệt
      // Không sử dụng direct deposit API, chỉ tạo WalletRequest
      const result = await createWalletRequest({
        type: "deposit",
        amount: amount,
        description: depositDescription || "Nạp tiền vào ví",
      });

      // Lưu requestId và hiển thị QR code
      setDepositRequestId(result.id);
      setShowDepositQRCode(true);
      setSuccess(
        "Yêu cầu nạp tiền đã được gửi. Vui lòng quét QR code để chuyển tiền."
      );
    } catch (err) {
      console.error("Failed to create deposit request:", err);
      setError(
        err instanceof Error ? err.message : "Không thể tạo yêu cầu nạp tiền"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (!wallet) {
      setError("Không tìm thấy thông tin ví");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount > wallet.balance) {
      setError("Số tiền rút không được vượt quá số dư hiện tại");
      return;
    }

    if (amount < 1000 || amount > 100000000) {
      setError("Số tiền phải từ 1,000 VND đến 100,000,000 VND");
      return;
    }

    if (!selectedBankAccountId && bankAccounts.length > 0) {
      setError("Vui lòng chọn tài khoản ngân hàng để nhận tiền");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await createWalletRequest({
        type: "withdraw",
        amount: amount,
        description: withdrawDescription || "Rút tiền từ ví",
        bankAccountId: selectedBankAccountId || undefined,
      });

      setSuccess(
        "Yêu cầu rút tiền đã được gửi. Vui lòng chờ SystemAdmin phê duyệt."
      );
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setWithdrawDescription("");
      await loadData();
    } catch (err) {
      console.error("Failed to create withdraw request:", err);
      setError(
        err instanceof Error ? err.message : "Không thể tạo yêu cầu rút tiền"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBankAccount = async () => {
    if (
      !bankForm.bankCode ||
      !bankForm.bankName ||
      !bankForm.accountNumber ||
      !bankForm.accountName
    ) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Chuẩn bị payload đúng format
      const payload: any = {
        bankCode: bankForm.bankCode.trim(),
        bankName: bankForm.bankName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        accountName: bankForm.accountName.trim(),
      };

      // Chỉ thêm branch nếu có giá trị
      if (bankForm.branch && bankForm.branch.trim()) {
        payload.branch = bankForm.branch.trim();
      }

      // Thêm isDefault nếu có
      if (bankForm.isDefault !== undefined) {
        payload.isDefault = bankForm.isDefault;
      }

      console.log("Sending bank account payload:", payload);

      if (editingBankAccount) {
        await updateBankAccount(editingBankAccount.id, payload);
        setSuccess("Cập nhật tài khoản ngân hàng thành công!");
      } else {
        await createBankAccount(payload);
        setSuccess("Thêm tài khoản ngân hàng thành công!");
      }

      setShowBankAccountModal(false);
      setEditingBankAccount(null);
      setIsCustomBankMode(false);
      setBankSearchQuery("");
      setShowBankDropdown(false);
      setBankForm({
        bankCode: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
        branch: "",
        isDefault: false,
      });
      await loadData();
    } catch (err: any) {
      console.error("Failed to save bank account:", err);
      console.error(
        "Error details:",
        err.response || err.bodyMessage || err.message
      );

      // Hiển thị error message chi tiết từ backend
      let errorMessage = "Không thể lưu tài khoản ngân hàng";
      if (err.bodyMessage) {
        errorMessage = err.bodyMessage;
      } else if (err.bodyDetails) {
        errorMessage = err.bodyDetails;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBankAccount = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?")) {
      return;
    }

    try {
      await deleteBankAccount(id);
      setSuccess("Xóa tài khoản ngân hàng thành công!");
      await loadData();
    } catch (err) {
      console.error("Failed to delete bank account:", err);
      setError(
        err instanceof Error ? err.message : "Không thể xóa tài khoản ngân hàng"
      );
    }
  };

  const handleSetDefaultBankAccount = async (id: number) => {
    try {
      await setDefaultBankAccount(id);
      setSuccess("Đặt tài khoản mặc định thành công!");
      await loadData();
    } catch (err) {
      console.error("Failed to set default bank account:", err);
      setError(
        err instanceof Error ? err.message : "Không thể đặt tài khoản mặc định"
      );
    }
  };

  const openEditBankAccount = (account: BankAccount) => {
    setEditingBankAccount(account);
    const bankInList = BANKS.find((b) => b.code === account.bankCode);
    setIsCustomBankMode(!bankInList); // Nếu không có trong danh sách, tự động chuyển sang chế độ custom
    setBankSearchQuery("");
    setShowBankDropdown(false);
    setBankForm({
      bankCode: account.bankCode,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      branch: account.branch || "",
      isDefault: account.isDefault,
    });
    setShowBankAccountModal(true);
  };

  // Calculate statistics
  const stats = {
    totalDeposits: transactions
      .filter((tx) => tx.type === "deposit" && tx.status === "success")
      .reduce((sum, tx) => sum + tx.amount, 0),
    totalWithdraws: transactions
      .filter((tx) => tx.type === "withdraw" && tx.status === "success")
      .reduce((sum, tx) => sum + tx.amount, 0),
    totalPayments: transactions
      .filter((tx) => tx.type === "payment" && tx.status === "success")
      .reduce((sum, tx) => sum + tx.amount, 0),
    pendingRequests: requests.filter((r) => r.status === "pending").length,
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">
              Đang tải thông tin ví...
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Ví của tôi
            </h1>
            <p className="text-gray-600">Quản lý số dư và giao dịch của bạn</p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>{success}</p>
                <button onClick={() => setSuccess(null)} className="ml-auto">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>{error}</p>
                <button onClick={() => setError(null)} className="ml-auto">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Balance Card - Enhanced */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 mb-8 text-white shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <p className="text-indigo-100 text-sm mb-2 font-medium">
                    Số dư hiện tại
                  </p>
                  <p className="text-5xl font-bold mb-2 drop-shadow-lg">
                    {wallet?.balance.toLocaleString("vi-VN") || "0"} ₫
                  </p>
                  <p className="text-indigo-100 text-sm">
                    Đơn vị: {wallet?.currency || "VND"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Nạp tiền
                  </button>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="px-8 py-4 bg-indigo-700/80 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-indigo-800 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                    Rút tiền
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã nạp</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalDeposits.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã rút</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.totalWithdraws.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã thanh toán</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalPayments.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đang chờ</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pendingRequests}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Bank Accounts & Pending Requests */}
            <div className="lg:col-span-1 space-y-6">
              {/* Bank Accounts */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Tài khoản ngân hàng
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {bankAccounts.length}/2 tài khoản
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (bankAccounts.length >= 2) {
                        setError(
                          "Mỗi người dùng chỉ được phép có tối đa 2 tài khoản ngân hàng."
                        );
                        return;
                      }
                      setEditingBankAccount(null);
                      setIsCustomBankMode(false);
                      setBankSearchQuery("");
                      setShowBankDropdown(false);
                      setBankForm({
                        bankCode: "",
                        bankName: "",
                        accountNumber: "",
                        accountName: "",
                        branch: "",
                        isDefault: false,
                      });
                      setShowBankAccountModal(true);
                    }}
                    disabled={bankAccounts.length >= 2}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Thêm mới
                  </button>
                </div>
                {bankAccounts.length >= 2 && (
                  <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý:</strong> Bạn đã đạt giới hạn tối đa 2 tài
                      khoản ngân hàng. Vui lòng xóa một tài khoản hiện có trước
                      khi thêm mới.
                    </p>
                  </div>
                )}
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <p className="text-gray-500 text-sm mb-4">
                      Chưa có tài khoản ngân hàng
                    </p>
                    <p className="text-xs text-gray-400">
                      Thêm tài khoản để rút tiền
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`p-4 rounded-lg border-2 ${
                          account.isDefault
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {account.isDefault && (
                              <span className="inline-block px-2 py-1 bg-indigo-500 text-white text-xs rounded-full mb-2">
                                Mặc định
                              </span>
                            )}
                            <p className="font-semibold text-gray-900">
                              {account.bankName}
                            </p>
                            <p className="text-sm text-gray-600 font-mono">
                              {account.accountNumber}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              {account.accountName}
                            </p>
                            {account.branch && (
                              <p className="text-xs text-gray-500 mt-1">
                                {account.branch}
                              </p>
                            )}
                            {account.qrCodeUrl && (
                              <div className="mt-2">
                                <Image
                                  src={account.qrCodeUrl}
                                  alt="QR Code"
                                  width={100}
                                  height={100}
                                  className="border border-gray-300 rounded"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 ml-2">
                            {!account.isDefault && (
                              <button
                                onClick={() =>
                                  handleSetDefaultBankAccount(account.id)
                                }
                                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded"
                                title="Đặt làm mặc định"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => openEditBankAccount(account)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Chỉnh sửa"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteBankAccount(account.id)
                              }
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Xóa"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Requests */}
              {requests.filter((r) => r.status === "pending").length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Yêu cầu đang chờ (
                    {requests.filter((r) => r.status === "pending").length})
                  </h2>
                  <div className="space-y-3">
                    {requests
                      .filter((r) => r.status === "pending")
                      .map((request) => (
                        <div
                          key={request.id}
                          className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {request.type === "deposit"
                                  ? "Nạp tiền"
                                  : "Rút tiền"}
                              </p>
                              <p className="text-sm text-gray-600">
                                {request.amount.toLocaleString("vi-VN")} ₫
                              </p>
                              {request.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {request.description}
                                </p>
                              )}
                            </div>
                            <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                              Đang chờ
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Transactions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Lịch sử giao dịch
                </h2>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-20 h-20 text-gray-300 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-gray-500 text-lg mb-2">
                      Chưa có giao dịch nào
                    </p>
                    <p className="text-sm text-gray-400">
                      Các giao dịch của bạn sẽ hiển thị ở đây
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${
                              tx.type === "deposit" || tx.type === "refund"
                                ? "bg-green-100"
                                : "bg-red-100"
                            }`}
                          >
                            {tx.type === "deposit" || tx.type === "refund" ? (
                              <svg
                                className="w-7 h-7 text-green-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-7 h-7 text-red-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 12H4"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-lg">
                              {tx.type === "deposit"
                                ? "Nạp tiền"
                                : tx.type === "withdraw"
                                ? "Rút tiền"
                                : tx.type === "payment"
                                ? "Thanh toán đơn hàng"
                                : "Hoàn tiền"}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {tx.description}
                            </p>
                            <p
                              className="text-xs text-gray-500 mt-2"
                              suppressHydrationWarning
                            >
                              {new Date(tx.createdAt).toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold text-xl ${
                              tx.type === "deposit" || tx.type === "refund"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {tx.type === "deposit" || tx.type === "refund"
                              ? "+"
                              : "-"}
                            {tx.amount.toLocaleString("vi-VN")} ₫
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Số dư: {tx.balanceAfter.toLocaleString("vi-VN")} ₫
                          </p>
                          <span
                            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                              tx.status === "success"
                                ? "bg-green-100 text-green-800"
                                : tx.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tx.status === "success"
                              ? "Thành công"
                              : tx.status === "pending"
                              ? "Đang chờ"
                              : "Thất bại"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal - Gửi yêu cầu nạp tiền */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div
            className={`bg-white rounded-2xl ${
              showDepositQRCode ? "max-w-4xl" : "max-w-lg"
            } w-full p-8 shadow-2xl my-8`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Nạp tiền vào ví
              </h2>
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  setDepositAmount("");
                  setDepositDescription("");
                  setShowDepositQRCode(false);
                  setDepositRequestId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {!showDepositQRCode ? (
              <>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Yêu cầu nạp tiền sẽ được gửi lên SystemAdmin để xét
                        duyệt
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Sau khi chuyển tiền, SystemAdmin sẽ phê duyệt và số tiền
                        sẽ được cộng vào ví của bạn
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số tiền (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Nhập số tiền"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      min="1000"
                      max="100000000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tối thiểu: 1,000 VND - Tối đa: 100,000,000 VND
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả (tùy chọn)
                    </label>
                    <textarea
                      value={depositDescription}
                      onChange={(e) => setDepositDescription(e.target.value)}
                      placeholder="Nhập mô tả (ví dụ: Nạp tiền để thanh toán đơn hàng)"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowDepositModal(false);
                      setDepositAmount("");
                      setDepositDescription("");
                      setShowDepositQRCode(false);
                      setDepositRequestId(null);
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDeposit}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <p className="text-xl font-bold text-gray-900 mb-2">
                    Quét mã QR để chuyển tiền
                  </p>
                  <p className="text-sm text-gray-600">
                    Yêu cầu nạp tiền đã được tạo. Vui lòng quét mã QR để chuyển
                    tiền vào tài khoản SystemAdmin
                  </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                  {/* QR Code - Left Side */}
                  <div className="flex-shrink-0 flex justify-center lg:justify-start">
                    <div className="bg-white p-6 rounded-xl border-2 border-indigo-300 shadow-lg">
                      <Image
                        src={generateAdminQRCode(
                          parseFloat(depositAmount),
                          depositRequestId!
                        )}
                        alt="QR Code chuyển tiền"
                        width={280}
                        height={280}
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Bank Account Info - Right Side */}
                  <div className="flex-1 space-y-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-5 border-2 border-indigo-200">
                      <p className="text-base font-bold text-gray-900 mb-4">
                        Thông tin tài khoản nhận tiền:
                      </p>
                      <div className="space-y-3 text-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-gray-600 font-medium w-28 flex-shrink-0">
                            Ngân hàng:
                          </span>
                          <span className="font-semibold text-gray-900">
                            Ngân hàng TMCP Quân Đội (MB Bank)
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-gray-600 font-medium w-28 flex-shrink-0">
                            Số tài khoản:
                          </span>
                          <span className="font-semibold font-mono text-gray-900 text-lg">
                            {ADMIN_BANK_ACCOUNT}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-gray-600 font-medium w-28 flex-shrink-0">
                            Chủ tài khoản:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {ADMIN_ACCOUNT_NAME}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-indigo-200">
                          <span className="text-gray-600 font-medium w-28 flex-shrink-0">
                            Số tiền:
                          </span>
                          <span className="font-bold text-indigo-600 text-2xl">
                            {parseFloat(depositAmount || "0").toLocaleString(
                              "vi-VN"
                            )}{" "}
                            ₫
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-gray-600 font-medium w-28 flex-shrink-0">
                            Nội dung:
                          </span>
                          <span className="font-mono text-gray-900 bg-white px-3 py-2 rounded-lg border border-indigo-200 font-semibold">
                            NAP-{depositRequestId}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                      <p className="text-sm text-blue-800 font-bold mb-2 flex items-center gap-2">
                        <span>📌</span>
                        <span>Hướng dẫn:</span>
                      </p>
                      <ol className="text-sm text-blue-700 space-y-2 ml-6">
                        <li className="list-decimal">
                          Mở ứng dụng ngân hàng của bạn
                        </li>
                        <li className="list-decimal">Quét mã QR ở trên</li>
                        <li className="list-decimal">
                          Kiểm tra số tiền và nội dung chuyển khoản
                        </li>
                        <li className="list-decimal">Xác nhận chuyển khoản</li>
                        <li className="list-decimal">
                          Sau khi chuyển khoản, SystemAdmin sẽ phê duyệt và số
                          tiền sẽ được cộng vào ví của bạn
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowDepositModal(false);
                      setDepositAmount("");
                      setDepositDescription("");
                      setShowDepositQRCode(false);
                      setDepositRequestId(null);
                      loadData();
                    }}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                  >
                    Đóng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Rút tiền từ ví
              </h2>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount("");
                  setWithdrawDescription("");
                  setSelectedBankAccountId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Nhập số tiền"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  min="1000"
                  max={wallet?.balance || 100000000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Số dư hiện tại:{" "}
                  <span className="font-semibold">
                    {wallet?.balance.toLocaleString("vi-VN") || "0"} ₫
                  </span>
                </p>
              </div>

              {bankAccounts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tài khoản ngân hàng nhận tiền{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBankAccountId || ""}
                    onChange={(e) =>
                      setSelectedBankAccountId(Number(e.target.value))
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="">Chọn tài khoản ngân hàng</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber}{" "}
                        {account.isDefault && "(Mặc định)"}
                      </option>
                    ))}
                  </select>
                  {bankAccounts.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Bạn chưa có tài khoản ngân hàng. Vui lòng thêm tài khoản
                      trước khi rút tiền.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={withdrawDescription}
                  onChange={(e) => setWithdrawDescription(e.target.value)}
                  placeholder="Nhập mô tả"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {bankAccounts.length === 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong> Bạn cần thêm tài khoản ngân hàng
                    trước khi rút tiền. SystemAdmin sẽ chuyển khoản vào tài
                    khoản ngân hàng của bạn sau khi phê duyệt.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount("");
                  setWithdrawDescription("");
                  setSelectedBankAccountId(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleWithdraw}
                disabled={submitting || bankAccounts.length === 0}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? "Đang xử lý..." : "Gửi yêu cầu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Account Modal */}
      {showBankAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBankAccount
                  ? "Chỉnh sửa tài khoản ngân hàng"
                  : "Thêm tài khoản ngân hàng"}
              </h2>
              <button
                onClick={() => {
                  setShowBankAccountModal(false);
                  setEditingBankAccount(null);
                  setIsCustomBankMode(false);
                  setBankForm({
                    bankCode: "",
                    bankName: "",
                    accountNumber: "",
                    accountName: "",
                    branch: "",
                    isDefault: false,
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn ngân hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={
                      bankForm.bankCode &&
                      BANKS.find((b) => b.code === bankForm.bankCode)
                        ? `${
                            BANKS.find((b) => b.code === bankForm.bankCode)
                              ?.name
                          } (${bankForm.bankCode})`
                        : bankSearchQuery ||
                          (bankForm.bankCode &&
                          !BANKS.find((b) => b.code === bankForm.bankCode)
                            ? bankForm.bankCode
                            : "") ||
                          ""
                    }
                    onChange={(e) => {
                      const query = e.target.value;
                      setBankSearchQuery(query);
                      setShowBankDropdown(true);
                      setIsCustomBankMode(false);

                      // Tự động tìm ngân hàng khi nhập mã chính xác
                      const foundBank = BANKS.find((b) => b.code === query);
                      if (foundBank) {
                        setBankForm({
                          ...bankForm,
                          bankCode: foundBank.code,
                          bankName: foundBank.name,
                        });
                        setBankSearchQuery("");
                        setShowBankDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      setShowBankDropdown(true);
                      if (
                        bankForm.bankCode &&
                        BANKS.find((b) => b.code === bankForm.bankCode)
                      ) {
                        setBankSearchQuery("");
                      } else {
                        setBankSearchQuery(
                          bankForm.bankCode || bankForm.bankName || ""
                        );
                      }
                    }}
                    onBlur={() => {
                      // Delay để cho phép click vào dropdown
                      setTimeout(() => {
                        setShowBankDropdown(false);
                        // Nếu có query nhưng chưa chọn, giữ lại query để hiển thị
                        if (
                          bankSearchQuery &&
                          !BANKS.find((b) => b.code === bankSearchQuery)
                        ) {
                          // Nếu là mã số, lưu vào bankCode
                          if (/^\d+$/.test(bankSearchQuery)) {
                            setBankForm({
                              ...bankForm,
                              bankCode: bankSearchQuery,
                              bankName: bankForm.bankName || "",
                            });
                            setIsCustomBankMode(true);
                          } else {
                            // Nếu là tên, lưu vào bankName
                            setBankForm({
                              ...bankForm,
                              bankCode: bankForm.bankCode || "",
                              bankName: bankSearchQuery,
                            });
                            setIsCustomBankMode(true);
                          }
                        }
                      }, 200);
                    }}
                    placeholder="Nhập mã hoặc tên ngân hàng..."
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Dropdown list */}
                  {showBankDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {BANKS.filter(
                        (bank) =>
                          !bankSearchQuery ||
                          bank.name
                            .toLowerCase()
                            .includes(bankSearchQuery.toLowerCase()) ||
                          bank.code.includes(bankSearchQuery)
                      ).map((bank) => (
                        <div
                          key={bank.code}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur event
                          }}
                          onClick={() => {
                            setBankForm({
                              ...bankForm,
                              bankCode: bank.code,
                              bankName: bank.name,
                            });
                            setBankSearchQuery("");
                            setShowBankDropdown(false);
                            setIsCustomBankMode(false);
                          }}
                          className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 transition-colors ${
                            bankForm.bankCode === bank.code
                              ? "bg-indigo-100"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {bank.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Mã: {bank.code}
                              </p>
                            </div>
                            {bankForm.bankCode === bank.code && (
                              <svg
                                className="w-5 h-5 text-indigo-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                      {bankSearchQuery &&
                        BANKS.filter(
                          (bank) =>
                            bank.name
                              .toLowerCase()
                              .includes(bankSearchQuery.toLowerCase()) ||
                            bank.code.includes(bankSearchQuery)
                        ).length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            Không tìm thấy. Bạn có thể nhập thủ công mã ngân
                            hàng.
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Hiển thị thông tin đã chọn */}
                {bankForm.bankCode &&
                  BANKS.find((b) => b.code === bankForm.bankCode) && (
                    <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-sm text-indigo-900">
                        <span className="font-semibold">Mã ngân hàng:</span>{" "}
                        {bankForm.bankCode}
                      </p>
                      <p className="text-sm text-indigo-900 mt-1">
                        <span className="font-semibold">Tên ngân hàng:</span>{" "}
                        {bankForm.bankName}
                      </p>
                    </div>
                  )}
              </div>

              {/* Hiển thị input fields riêng khi nhập thủ công mã ngân hàng không có trong danh sách */}
              {bankForm.bankCode &&
                !BANKS.find((b) => b.code === bankForm.bankCode) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mã ngân hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankForm.bankCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          // Tự động tìm ngân hàng trong danh sách khi nhập mã
                          const foundBank = BANKS.find((b) => b.code === code);
                          setBankForm({
                            ...bankForm,
                            bankCode: code,
                            bankName: foundBank
                              ? foundBank.name
                              : bankForm.bankName,
                          });
                          if (foundBank) {
                            setBankSearchQuery("");
                            setIsCustomBankMode(false);
                          }
                        }}
                        placeholder="VD: 970422"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên ngân hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankForm.bankName}
                        onChange={(e) =>
                          setBankForm({ ...bankForm, bankName: e.target.value })
                        }
                        placeholder="VD: MB Bank"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                )}

              {/* Hiển thị thông báo khi nhập mã không có trong danh sách */}
              {bankForm.bankCode &&
                !BANKS.find((b) => b.code === bankForm.bankCode) &&
                bankForm.bankCode.length >= 6 && (
                  <div className="mt-2 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-900 mb-1">
                          Không tìm thấy ngân hàng trong danh sách
                        </p>
                        <p className="text-xs text-yellow-800">
                          Vui lòng nhập đầy đủ thông tin ngân hàng của bạn.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Hiển thị thông tin khi đang edit với bank không có trong danh sách */}
              {editingBankAccount &&
                !BANKS.find((b) => b.code === editingBankAccount.bankCode) && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý:</strong> Ngân hàng này không có trong danh
                      sách. Bạn có thể chỉnh sửa thông tin bên dưới hoặc chọn
                      ngân hàng khác từ dropdown.
                    </p>
                  </div>
                )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankForm.accountNumber}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, accountNumber: e.target.value })
                  }
                  placeholder="Nhập số tài khoản"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên chủ tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankForm.accountName}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, accountName: e.target.value })
                  }
                  placeholder="Nhập tên chủ tài khoản"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chi nhánh (tùy chọn)
                </label>
                <input
                  type="text"
                  value={bankForm.branch}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, branch: e.target.value })
                  }
                  placeholder="Nhập chi nhánh"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={bankForm.isDefault}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, isDefault: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="isDefault"
                  className="ml-2 text-sm text-gray-700"
                >
                  Đặt làm tài khoản mặc định
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBankAccountModal(false);
                  setEditingBankAccount(null);
                  setIsCustomBankMode(false);
                  setBankForm({
                    bankCode: "",
                    bankName: "",
                    accountNumber: "",
                    accountName: "",
                    branch: "",
                    isDefault: false,
                  });
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveBankAccount}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting
                  ? "Đang lưu..."
                  : editingBankAccount
                  ? "Cập nhật"
                  : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
