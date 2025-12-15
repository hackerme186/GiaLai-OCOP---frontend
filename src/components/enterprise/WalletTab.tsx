"use client"

import { useEffect, useState } from "react"
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
    type User
} from "@/lib/api"
import Image from "next/image"

// Danh sách ngân hàng Việt Nam hỗ trợ VietQR
const BANKS = [
    { code: "970425", name: "Ngân hàng TMCP An Bình (ABBANK)" },
    { code: "970416", name: "Ngân hàng TMCP Á Châu (ACB)" },
    { code: "970409", name: "Ngân hàng TMCP Bắc Á (BacABank)" },
    { code: "970418", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)" },
    { code: "970438", name: "Ngân hàng TMCP Bảo Việt (BaoVietBank)" },
    { code: "970432", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)" },
    { code: "970444", name: "Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam (CBBank)" },
    { code: "422589", name: "Ngân hàng TNHH MTV CIMB Việt Nam (CIMB)" },
    { code: "970446", name: "Ngân hàng Hợp tác xã Việt Nam (COOPBANK)" },
    { code: "970406", name: "Ngân hàng TMCP Đông Á (DongA Bank)" },
    { code: "970437", name: "Ngân hàng TMCP Phát triển TP.HCM (HDBank)" },
    { code: "970448", name: "Ngân hàng TMCP Phương Đông (OCB)" },
    { code: "970403", name: "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)" },
    { code: "970441", name: "Ngân hàng TMCP Quốc tế Việt Nam (VIB)" },
    { code: "970405", name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)" },
    { code: "970407", name: "Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)" },
    { code: "970415", name: "Ngân hàng TMCP Công Thương Việt Nam (VietinBank)" },
    { code: "970436", name: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)" },
    { code: "970422", name: "Ngân hàng TMCP Quân Đội (MB Bank)" },
    { code: "970423", name: "Ngân hàng TMCP Tiên Phong (TPBank)" },
]

interface WalletTabProps {
    user: User | null
}

export default function WalletTab({ user }: WalletTabProps) {
    // Thông tin tài khoản SystemAdmin (MB Bank)
    const ADMIN_BANK_ACCOUNT = process.env.NEXT_PUBLIC_ADMIN_BANK_ACCOUNT || "0858153779"
    const ADMIN_BANK_CODE = process.env.NEXT_PUBLIC_ADMIN_BANK_CODE || "970422" // MB Bank BIN
    const ADMIN_ACCOUNT_NAME = process.env.NEXT_PUBLIC_ADMIN_ACCOUNT_NAME || "NGUYEN BA QUYET"

    const [wallet, setWallet] = useState<Wallet | null>(null)
    const [transactions, setTransactions] = useState<WalletTransaction[]>([])
    const [requests, setRequests] = useState<WalletRequest[]>([])
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Form states
    const [showDepositModal, setShowDepositModal] = useState(false)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [showBankAccountModal, setShowBankAccountModal] = useState(false)
    const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null)
    const [depositAmount, setDepositAmount] = useState("")
    const [depositDescription, setDepositDescription] = useState("")
    const [withdrawAmount, setWithdrawAmount] = useState("")
    const [withdrawDescription, setWithdrawDescription] = useState("")
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [depositRequestId, setDepositRequestId] = useState<number | null>(null)
    const [showDepositQRCode, setShowDepositQRCode] = useState(false)

    // Hàm tạo QR code URL cho SystemAdmin
    const generateAdminQRCode = (amount: number, requestId: number): string => {
        const content = `NAP-${requestId}` // Nội dung chuyển khoản: NAP-{requestId}
        // Format VietQR: https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png?amount={amount}&addInfo={content}
        return `https://img.vietqr.io/image/${ADMIN_BANK_CODE}-${ADMIN_BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`
    }

    // Bank Account Form
    const [bankForm, setBankForm] = useState({
        bankCode: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
        branch: "",
        isDefault: false
    })
    const [isCustomBankMode, setIsCustomBankMode] = useState(false)
    const [bankSearchQuery, setBankSearchQuery] = useState("")
    const [showBankDropdown, setShowBankDropdown] = useState(false)

    useEffect(() => {
        loadWalletData()
    }, [])

    const loadWalletData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [walletData, transactionsData, requestsData, bankAccountsData] = await Promise.all([
                getWallet(),
                getWalletTransactions(),
                getWalletRequests(),
                getBankAccounts()
            ])

            setWallet(walletData)
            setTransactions(transactionsData || [])
            setRequests(requestsData || [])
            setBankAccounts(bankAccountsData || [])
        } catch (err) {
            console.error("Failed to load wallet data:", err)
            setError("Không thể tải thông tin ví")
        } finally {
            setLoading(false)
        }
    }

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount)
        if (!amount || amount <= 0) {
            alert("Vui lòng nhập số tiền hợp lệ")
            return
        }

        try {
            setSubmitting(true)
            const request = await createWalletRequest({
                type: "deposit",
                amount,
                description: depositDescription || `Nạp tiền vào ví - ${new Date().toLocaleString("vi-VN")}`
            })

            setDepositRequestId(request.id)
            setShowDepositQRCode(true)
            setSuccess("Đã tạo yêu cầu nạp tiền thành công!")
            setTimeout(() => setSuccess(null), 5000)
            await loadWalletData()
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không thể tạo yêu cầu nạp tiền")
        } finally {
            setSubmitting(false)
        }
    }

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount)
        if (!amount || amount <= 0) {
            alert("Vui lòng nhập số tiền hợp lệ")
            return
        }

        if (!selectedBankAccountId) {
            alert("Vui lòng chọn tài khoản ngân hàng")
            return
        }

        if (wallet && amount > wallet.balance) {
            alert("Số dư không đủ")
            return
        }

        try {
            setSubmitting(true)
            await createWalletRequest({
                type: "withdraw",
                amount,
                bankAccountId: selectedBankAccountId,
                description: withdrawDescription || `Rút tiền từ ví - ${new Date().toLocaleString("vi-VN")}`
            })

            setSuccess("Đã tạo yêu cầu rút tiền thành công!")
            setTimeout(() => setSuccess(null), 5000)
            setShowWithdrawModal(false)
            setWithdrawAmount("")
            setWithdrawDescription("")
            setSelectedBankAccountId(null)
            await loadWalletData()
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không thể tạo yêu cầu rút tiền")
        } finally {
            setSubmitting(false)
        }
    }

    const handleSaveBankAccount = async () => {
        if (!bankForm.bankCode.trim() || !bankForm.accountNumber.trim() || !bankForm.accountName.trim()) {
            alert("Vui lòng điền đầy đủ thông tin")
            return
        }

        if (bankAccounts.length >= 2 && !editingBankAccount) {
            alert("Bạn chỉ có thể thêm tối đa 2 tài khoản ngân hàng")
            return
        }

        try {
            setSubmitting(true)
            const payload = {
                bankCode: bankForm.bankCode.trim(),
                bankName: bankForm.bankName.trim(),
                accountNumber: bankForm.accountNumber.trim(),
                accountName: bankForm.accountName.trim(),
                branch: bankForm.branch.trim() || undefined,
                isDefault: bankForm.isDefault
            }

            if (editingBankAccount) {
                await updateBankAccount(editingBankAccount.id, payload)
                setSuccess("Đã cập nhật tài khoản ngân hàng thành công!")
            } else {
                await createBankAccount(payload)
                setSuccess("Đã thêm tài khoản ngân hàng thành công!")
            }

            setTimeout(() => setSuccess(null), 5000)
            setShowBankAccountModal(false)
            resetBankForm()
            await loadWalletData()
        } catch (err) {
            console.error("Failed to save bank account:", err)
            alert(err instanceof Error ? err.message : "Không thể lưu tài khoản ngân hàng")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteBankAccount = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa tài khoản ngân hàng này?")) return

        try {
            await deleteBankAccount(id)
            setSuccess("Đã xóa tài khoản ngân hàng thành công!")
            setTimeout(() => setSuccess(null), 5000)
            await loadWalletData()
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không thể xóa tài khoản ngân hàng")
        }
    }

    const handleSetDefaultBankAccount = async (id: number) => {
        try {
            await setDefaultBankAccount(id)
            setSuccess("Đã đặt tài khoản ngân hàng làm mặc định!")
            setTimeout(() => setSuccess(null), 5000)
            await loadWalletData()
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không thể đặt tài khoản mặc định")
        }
    }

    const resetBankForm = () => {
        setBankForm({
            bankCode: "",
            bankName: "",
            accountNumber: "",
            accountName: "",
            branch: "",
            isDefault: false
        })
        setEditingBankAccount(null)
        setIsCustomBankMode(false)
        setBankSearchQuery("")
    }

    const openEditBankAccount = (account: BankAccount) => {
        setEditingBankAccount(account)
        setBankForm({
            bankCode: account.bankCode,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountName: account.accountName,
            branch: account.branch || "",
            isDefault: account.isDefault
        })
        setIsCustomBankMode(!BANKS.some(b => b.code === account.bankCode))
        setShowBankAccountModal(true)
    }

    const filteredBanks = BANKS.filter(bank =>
        bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
        bank.code.includes(bankSearchQuery)
    )

    const pendingRequests = requests.filter(r => r.status === "pending")
    const pendingDepositCount = pendingRequests.filter(r => r.type === "deposit").length
    const pendingWithdrawCount = pendingRequests.filter(r => r.type === "withdraw").length

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        )
    }

    if (error && !wallet) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={loadWalletData}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    Thử lại
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 border-2 border-green-200 text-green-800 rounded-lg p-4 flex items-center justify-between">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
                        ✕
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-lg p-4 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                        ✕
                    </button>
                </div>
            )}

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Số dư ví</h2>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="text-4xl font-bold mb-2">
                    {wallet?.balance.toLocaleString("vi-VN") || "0"} ₫
                </div>
                <p className="text-green-100 text-sm">Số dư khả dụng</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => setShowDepositModal(true)}
                    className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-semibold text-lg">Nạp tiền</span>
                </button>
                <button
                    onClick={() => {
                        if (bankAccounts.length === 0) {
                            alert("Vui lòng thêm tài khoản ngân hàng trước khi rút tiền")
                            setShowBankAccountModal(true)
                            return
                        }
                        setShowWithdrawModal(true)
                    }}
                    className="bg-red-600 text-white rounded-lg p-6 hover:bg-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    <span className="font-semibold text-lg">Rút tiền</span>
                </button>
            </div>

            {/* Pending Requests Alert */}
            {pendingRequests.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="font-semibold text-yellow-900">
                                Bạn có {pendingRequests.length} yêu cầu đang chờ xử lý
                            </p>
                            {pendingDepositCount > 0 && (
                                <p className="text-sm text-yellow-700">- {pendingDepositCount} yêu cầu nạp tiền</p>
                            )}
                            {pendingWithdrawCount > 0 && (
                                <p className="text-sm text-yellow-700">- {pendingWithdrawCount} yêu cầu rút tiền</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Bank Accounts Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Tài khoản ngân hàng</h3>
                    <button
                        onClick={() => {
                            if (bankAccounts.length >= 2) {
                                alert("Bạn chỉ có thể thêm tối đa 2 tài khoản ngân hàng")
                                return
                            }
                            resetBankForm()
                            setShowBankAccountModal(true)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                        + Thêm tài khoản
                    </button>
                </div>

                {bankAccounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>Chưa có tài khoản ngân hàng nào</p>
                        <p className="text-sm mt-2">Thêm tài khoản để có thể rút tiền</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bankAccounts.map((account) => (
                            <div
                                key={account.id}
                                className={`border-2 rounded-lg p-4 ${
                                    account.isDefault ? "border-green-500 bg-green-50" : "border-gray-200"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold text-gray-900">{account.bankName}</span>
                                            {account.isDefault && (
                                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                                    Mặc định
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">Số tài khoản: {account.accountNumber}</p>
                                        <p className="text-sm text-gray-600">Chủ tài khoản: {account.accountName}</p>
                                        {account.branch && (
                                            <p className="text-sm text-gray-600">Chi nhánh: {account.branch}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {!account.isDefault && (
                                            <button
                                                onClick={() => handleSetDefaultBankAccount(account.id)}
                                                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                            >
                                                Đặt mặc định
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openEditBankAccount(account)}
                                            className="px-3 py-1 text-xs bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBankAccount(account.id)}
                                            className="px-3 py-1 text-xs bg-red-200 text-red-700 rounded hover:bg-red-300"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Transactions Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Lịch sử giao dịch</h3>
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>Chưa có giao dịch nào</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                                    transaction.type === "deposit"
                                                        ? "bg-green-100 text-green-700"
                                                        : transaction.type === "withdraw"
                                                        ? "bg-red-100 text-red-700"
                                                        : transaction.type === "payment"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                {transaction.type === "deposit"
                                                    ? "Nạp tiền"
                                                    : transaction.type === "withdraw"
                                                    ? "Rút tiền"
                                                    : transaction.type === "payment"
                                                    ? "Thanh toán"
                                                    : transaction.type === "refund"
                                                    ? "Hoàn tiền"
                                                    : transaction.type}
                                            </span>
                                            <span
                                                className={`text-sm font-semibold ${
                                                    transaction.type === "deposit" || transaction.type === "refund"
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {transaction.type === "deposit" || transaction.type === "refund"
                                                    ? "+"
                                                    : "-"}
                                                {transaction.amount.toLocaleString("vi-VN")} ₫
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{transaction.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(transaction.createdAt).toLocaleString("vi-VN")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-700">
                                            Số dư: {transaction.balanceAfter.toLocaleString("vi-VN")} ₫
                                        </p>
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${
                                                transaction.status === "success"
                                                    ? "bg-green-100 text-green-700"
                                                    : transaction.status === "pending"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {transaction.status === "success"
                                                ? "Thành công"
                                                : transaction.status === "pending"
                                                ? "Đang chờ"
                                                : "Thất bại"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {!showDepositQRCode ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">Nạp tiền vào ví</h3>
                                    <button
                                        onClick={() => {
                                            setShowDepositModal(false)
                                            setDepositAmount("")
                                            setDepositDescription("")
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số tiền (₫)
                                        </label>
                                        <input
                                            type="number"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            placeholder="Nhập số tiền"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                            min="1000"
                                            step="1000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ghi chú (tùy chọn)
                                        </label>
                                        <textarea
                                            value={depositDescription}
                                            onChange={(e) => setDepositDescription(e.target.value)}
                                            placeholder="Nhập ghi chú"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                                            rows={3}
                                        />
                                    </div>
                                    <button
                                        onClick={handleDeposit}
                                        disabled={submitting || !depositAmount || parseFloat(depositAmount) <= 0}
                                        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? "Đang xử lý..." : "Gửi yêu cầu nạp tiền"}
                                    </button>
                                </div>
                            </>
                        ) : depositRequestId ? (
                            <div className="text-center">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">Quét mã QR để nạp tiền</h3>
                                    <button
                                        onClick={() => {
                                            setShowDepositQRCode(false)
                                            setDepositRequestId(null)
                                            setShowDepositModal(false)
                                            setDepositAmount("")
                                            setDepositDescription("")
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-4">
                                    <Image
                                        src={generateAdminQRCode(parseFloat(depositAmount), depositRequestId)}
                                        alt="QR Code"
                                        width={300}
                                        height={300}
                                        className="mx-auto"
                                    />
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Ngân hàng:</strong> {BANKS.find(b => b.code === ADMIN_BANK_CODE)?.name || "MB Bank"}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Số tài khoản:</strong> {ADMIN_BANK_ACCOUNT}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Chủ tài khoản:</strong> {ADMIN_ACCOUNT_NAME}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Số tiền:</strong> {parseFloat(depositAmount).toLocaleString("vi-VN")} ₫
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <strong>Nội dung:</strong> NAP-{depositRequestId}
                                    </p>
                                </div>

                                <p className="text-sm text-gray-600 mb-4">
                                    Vui lòng chuyển khoản đúng số tiền và nội dung trên. Sau khi SystemAdmin xác nhận, tiền sẽ được cộng vào ví của bạn.
                                </p>

                                <button
                                    onClick={() => {
                                        setShowDepositQRCode(false)
                                        setDepositRequestId(null)
                                        setShowDepositModal(false)
                                        setDepositAmount("")
                                        setDepositDescription("")
                                    }}
                                    className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                                >
                                    Đóng
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Rút tiền từ ví</h3>
                            <button
                                onClick={() => {
                                    setShowWithdrawModal(false)
                                    setWithdrawAmount("")
                                    setWithdrawDescription("")
                                    setSelectedBankAccountId(null)
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số tiền (₫)
                                </label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="Nhập số tiền"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                    min="1000"
                                    step="1000"
                                />
                                {wallet && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Số dư khả dụng: {wallet.balance.toLocaleString("vi-VN")} ₫
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tài khoản ngân hàng nhận tiền
                                </label>
                                <select
                                    value={selectedBankAccountId || ""}
                                    onChange={(e) => setSelectedBankAccountId(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                >
                                    <option value="">Chọn tài khoản ngân hàng</option>
                                    {bankAccounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.bankName} - {account.accountNumber}
                                            {account.isDefault ? " (Mặc định)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú (tùy chọn)
                                </label>
                                <textarea
                                    value={withdrawDescription}
                                    onChange={(e) => setWithdrawDescription(e.target.value)}
                                    placeholder="Nhập ghi chú"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 resize-none"
                                    rows={3}
                                />
                            </div>
                            <button
                                onClick={handleWithdraw}
                                disabled={
                                    submitting ||
                                    !withdrawAmount ||
                                    parseFloat(withdrawAmount) <= 0 ||
                                    selectedBankAccountId === null ||
                                    (wallet !== null && parseFloat(withdrawAmount) > wallet.balance)
                                }
                                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Đang xử lý..." : "Gửi yêu cầu rút tiền"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bank Account Modal */}
            {showBankAccountModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingBankAccount ? "Sửa tài khoản ngân hàng" : "Thêm tài khoản ngân hàng"}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowBankAccountModal(false)
                                    resetBankForm()
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Bank Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngân hàng
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={isCustomBankMode ? bankForm.bankName : bankSearchQuery}
                                        onChange={(e) => {
                                            if (isCustomBankMode) {
                                                setBankForm({ ...bankForm, bankName: e.target.value })
                                            } else {
                                                setBankSearchQuery(e.target.value)
                                                setShowBankDropdown(true)
                                            }
                                        }}
                                        onFocus={() => !isCustomBankMode && setShowBankDropdown(true)}
                                        placeholder={isCustomBankMode ? "Nhập tên ngân hàng" : "Tìm kiếm ngân hàng..."}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                    />
                                    {!isCustomBankMode && showBankDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            <button
                                                onClick={() => {
                                                    setIsCustomBankMode(true)
                                                    setBankSearchQuery("")
                                                    setShowBankDropdown(false)
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 border-b border-gray-200"
                                            >
                                                + Nhập thủ công
                                            </button>
                                            {filteredBanks.map((bank) => (
                                                <button
                                                    key={bank.code}
                                                    onClick={() => {
                                                        setBankForm({
                                                            ...bankForm,
                                                            bankCode: bank.code,
                                                            bankName: bank.name
                                                        })
                                                        setBankSearchQuery(bank.name)
                                                        setShowBankDropdown(false)
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="font-medium">{bank.name}</div>
                                                    <div className="text-xs text-gray-500">Mã: {bank.code}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isCustomBankMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mã ngân hàng
                                    </label>
                                    <input
                                        type="text"
                                        value={bankForm.bankCode}
                                        onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })}
                                        placeholder="Nhập mã ngân hàng (BIN)"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số tài khoản *
                                </label>
                                <input
                                    type="text"
                                    value={bankForm.accountNumber}
                                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                                    placeholder="Nhập số tài khoản"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chủ tài khoản *
                                </label>
                                <input
                                    type="text"
                                    value={bankForm.accountName}
                                    onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                                    placeholder="Nhập tên chủ tài khoản"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chi nhánh (tùy chọn)
                                </label>
                                <input
                                    type="text"
                                    value={bankForm.branch}
                                    onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                                    placeholder="Nhập chi nhánh"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={bankForm.isDefault}
                                    onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                                    Đặt làm tài khoản mặc định
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveBankAccount}
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Đang lưu..." : editingBankAccount ? "Cập nhật" : "Thêm"}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBankAccountModal(false)
                                        resetBankForm()
                                    }}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

