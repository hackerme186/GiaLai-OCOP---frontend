"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getUserProfile, isLoggedIn } from "@/lib/auth"
import { getCurrentUser, getEnterprise, updateCurrentUser, changePassword, verifyEmail, resendVerificationOtp, type Enterprise, type User, type UpdateUserDto } from "@/lib/api"
import Header from "@/components/layout/Header"
import { useRouter } from "next/navigation"
import {
  getSavedShippingAddresses,
  addShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  setDefaultShippingAddress,
  syncMainAddressFromBackend,
  type SavedShippingAddress
} from "@/lib/shipping-addresses"
import NewAddressForm, { type AddressFormData } from "@/components/address/NewAddressForm"
import dynamic from "next/dynamic"
import ImageUploader from "@/components/upload/ImageUploader"
import Image from "next/image"

const AddressMapModal = dynamic(() => import("@/components/address/AddressMapModal"), { ssr: false })

type NotificationItem = {
  id: number
  title: string
  message: string
  date: string
  read: boolean
  type?: "order" | "system" | "promotion"
}

export default function AccountPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [showAddressMapModal, setShowAddressMapModal] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [shippingAddress, setShippingAddress] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [gender, setGender] = useState<string>("female")
  const [dateOfBirth, setDateOfBirth] = useState<{ day: string; month: string; year: string }>({ day: "", month: "", year: "" })
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<SavedShippingAddress[]>([])
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddressLabel, setNewAddressLabel] = useState("")
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [newAddressValue, setNewAddressValue] = useState("")
  const [editingAddressValue, setEditingAddressValue] = useState("")
  const [editingAddressLabelValue, setEditingAddressLabelValue] = useState("")
  const [activeMenu, setActiveMenu] = useState("profile")
  const [expandedMenu, setExpandedMenu] = useState("account")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Change password states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false })

  // Verify email states
  const [otpCode, setOtpCode] = useState("")
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)

  // Notifications states
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  useEffect(() => {
    const init = async () => {
      const ok = await isLoggedIn()
      if (!ok) {
        router.replace("/login")
        return
      }
      // Prefer fetching from backend
      try {
        const me = await getCurrentUser()
        const { getUserProfile, setUserProfile } = await import("@/lib/auth")
        const currentProfile = getUserProfile() || {}

        // Đảm bảo createdAt được lấy từ backend hoặc từ profile đã lưu
        const createdAt = me.createdAt || currentProfile.createdAt

        // Lưu tất cả thông tin user (bao gồm createdAt) vào user profile
        const updatedProfile = {
          ...currentProfile,
          id: me.id,
          name: me.name,
          email: me.email,
          role: me.role,
          enterpriseId: me.enterpriseId ?? undefined,
          createdAt: createdAt, // Lưu ngày tạo tài khoản từ backend hoặc profile
        }
        setUserProfile(updatedProfile)

        // Set user state với createdAt đã đảm bảo
        setUser({
          ...me,
          createdAt: createdAt, // Đảm bảo createdAt luôn có trong user state
        })
        setShippingAddress(me.shippingAddress || "")
        setName(me.name || "")
        setEmail(me.email || "")
        setPhoneNumber(me.phoneNumber || "")
        setGender(me.gender || "female")

        // Load date of birth from user data
        if (me.dateOfBirth) {
          try {
            const dob = new Date(me.dateOfBirth)
            setDateOfBirth({
              day: dob.getDate().toString(),
              month: (dob.getMonth() + 1).toString(),
              year: dob.getFullYear().toString()
            })
          } catch {
            // Ignore date parsing errors
          }
        }

        // Load avatar từ localStorage hoặc từ user.avatarUrl nếu có
        if (typeof window !== "undefined") {
          if (me.avatarUrl) {
            setAvatarPreview(me.avatarUrl)
          } else {
            const savedAvatar = localStorage.getItem(`user_avatar_${me.id}`)
            if (savedAvatar) {
              setAvatarPreview(savedAvatar)
            }
          }
        }

        // Đồng bộ địa chỉ từ backend vào danh sách địa chỉ đã lưu
        if (me.shippingAddress) {
          syncMainAddressFromBackend(me.shippingAddress)
        }

        // Load danh sách địa chỉ đã lưu
        setSavedAddresses(getSavedShippingAddresses())
      } catch {
        const profile = getUserProfile() || {}
        const userData = {
          id: profile.id ?? 0,
          name: profile.name || "",
          email: profile.email || "",
          role: profile.role || "Customer",
          enterpriseId: profile.enterpriseId ?? undefined,
          createdAt: profile.createdAt,
        } as User
        setUser(userData)
        setShippingAddress("")
        setName(userData.name || "")
        setEmail(userData.email || "")
        setPhoneNumber(userData.phoneNumber || "")
        setGender(userData.gender || "female")

        // Load date of birth from user data
        if (userData.dateOfBirth) {
          try {
            const dob = new Date(userData.dateOfBirth)
            setDateOfBirth({
              day: dob.getDate().toString(),
              month: (dob.getMonth() + 1).toString(),
              year: dob.getFullYear().toString()
            })
          } catch {
            // Ignore date parsing errors
          }
        }

        // Load avatar từ localStorage nếu có
        if (typeof window !== "undefined" && userData.id) {
          if (userData.avatarUrl) {
            setAvatarPreview(userData.avatarUrl)
          } else {
            const savedAvatar = localStorage.getItem(`user_avatar_${userData.id}`)
            if (savedAvatar) {
              setAvatarPreview(savedAvatar)
            }
          }
        }

        setSavedAddresses(getSavedShippingAddresses())
      } finally {
        setReady(true)
      }
    }
    init()
  }, [router])

  // Sync avatarPreview với user.avatarUrl khi user state thay đổi
  useEffect(() => {
    if (user?.avatarUrl && !avatarPreview) {
      setAvatarPreview(user.avatarUrl)
      // Cache vào localStorage
      if (user.id && typeof window !== "undefined") {
        localStorage.setItem(`user_avatar_${user.id}`, user.avatarUrl)
      }
    }
  }, [user?.avatarUrl, user?.id, avatarPreview])

  useEffect(() => {
    const loadEnterprise = async () => {
      if (!user?.enterpriseId) {
        setEnterprise(null)
        return
      }
      try {
        const detail = await getEnterprise(user.enterpriseId)
        setEnterprise(detail)
      } catch (err) {
        console.warn("Không thể tải thông tin doanh nghiệp:", err)
        setEnterprise(null)
      }
    }
    loadEnterprise()
  }, [user?.enterpriseId])

  const formattedCreatedAt = useMemo(() => {
    if (!user?.createdAt) return null
    try {
      const date = new Date(user.createdAt)
      // Format đẹp hơn: "dd/mm/yyyy, HH:mm"
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch {
      return user.createdAt
    }
  }, [user?.createdAt])

  const formattedCreatedAtDisplay = useMemo(() => {
    if (!user?.createdAt) {
      return {
        text: "Chưa xác định",
        isEmpty: true
      }
    }
    try {
      const date = new Date(user.createdAt)
      // Format ngày đẹp: "Ngày dd tháng mm năm yyyy"
      const dateStr = new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)

      // Format với ngày tháng năm bằng chữ
      const day = date.getDate()
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')

      const monthNames = [
        "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
        "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"
      ]

      return {
        text: `Ngày ${day} ${monthNames[month - 1]} năm ${year}, ${hours}:${minutes}`,
        isEmpty: false,
        raw: dateStr
      }
    } catch {
      return {
        text: user.createdAt || "Chưa xác định",
        isEmpty: !user.createdAt
      }
    }
  }, [user?.createdAt])

  const roleLabel = useMemo(() => {
    switch ((user?.role || "").toLowerCase()) {
      case "systemadmin":
        return "Quản trị hệ thống"
      case "enterpriseadmin":
        return "Quản trị doanh nghiệp"
      case "customer":
        return "Khách hàng"
      default:
        return user?.role || "Không xác định"
    }
  }, [user?.role])


  const handleSaveAddress = async () => {
    if (!shippingAddress.trim()) {
      setError("Vui lòng nhập địa chỉ giao hàng")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Include name field as backend requires it for validation
      const updatedUser = await updateCurrentUser({
        name: user?.name || "",
        shippingAddress: shippingAddress.trim()
      })
      setUser(updatedUser)

      // Đồng bộ địa chỉ mới vào danh sách địa chỉ đã lưu
      if (shippingAddress.trim()) {
        syncMainAddressFromBackend(shippingAddress.trim())
        setSavedAddresses(getSavedShippingAddresses())
      }

      setIsEditingAddress(false)
      setSuccess("Đã cập nhật địa chỉ giao hàng thành công!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật địa chỉ giao hàng"

      // Check if it's a 403 or 404 error (endpoint might not exist or permission denied)
      if (errorMessage.includes("403") || errorMessage.includes("404")) {
        setError("Backend chưa hỗ trợ cập nhật địa chỉ giao hàng. Vui lòng liên hệ quản trị viên.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên")
      return
    }

    setSavingProfile(true)
    setError(null)
    setSuccess(null)

    try {
      // Chuẩn bị date of birth nếu có đầy đủ ngày/tháng/năm
      let dateOfBirthISO: string | undefined = undefined
      if (dateOfBirth.day && dateOfBirth.month && dateOfBirth.year) {
        try {
          const dob = new Date(
            parseInt(dateOfBirth.year),
            parseInt(dateOfBirth.month) - 1,
            parseInt(dateOfBirth.day)
          )
          if (!isNaN(dob.getTime())) {
            dateOfBirthISO = dob.toISOString()
          }
        } catch {
          // Ignore date parsing errors
        }
      }

      // Chuẩn bị payload với tất cả các trường có thể cập nhật
      const updatePayload: UpdateUserDto = {
        name: name.trim(),
      }

      // Chỉ thêm các trường có giá trị
      if (phoneNumber.trim()) {
        updatePayload.phoneNumber = phoneNumber.trim()
      }
      if (gender) {
        updatePayload.gender = gender
      }
      if (dateOfBirthISO) {
        updatePayload.dateOfBirth = dateOfBirthISO
      }

      // Nếu có avatar mới được chọn, lưu vào localStorage
      // (Avatar sẽ được upload riêng nếu backend hỗ trợ endpoint upload)
      if (avatarPreview && avatarFile && user?.id && typeof window !== "undefined") {
        localStorage.setItem(`user_avatar_${user.id}`, avatarPreview)
        // TODO: Upload avatar lên backend nếu có endpoint
        // updatePayload.avatarUrl = await uploadAvatar(avatarFile)
      } else if (avatarPreview && user?.id && typeof window !== "undefined") {
        // Nếu avatar đã có sẵn, giữ nguyên
        localStorage.setItem(`user_avatar_${user.id}`, avatarPreview)
      }

      // Log payload trước khi gửi
      console.log("📤 [UPDATE PROFILE] Gửi request với payload:", JSON.stringify(updatePayload, null, 2))

      const updatedUser = await updateCurrentUser(updatePayload)

      // Log response từ backend
      console.log("📥 [UPDATE PROFILE] Nhận response từ backend:", JSON.stringify(updatedUser, null, 2))

      // Kiểm tra xem dữ liệu có được cập nhật không
      const fieldsUpdated: string[] = []
      const fieldsNotInResponse: string[] = []

      if (updatedUser.name === name.trim()) fieldsUpdated.push("name")

      if (updatePayload.phoneNumber) {
        if (updatedUser.phoneNumber === phoneNumber.trim()) {
          fieldsUpdated.push("phoneNumber")
        } else if (!updatedUser.phoneNumber) {
          fieldsNotInResponse.push("phoneNumber")
        }
      }

      if (updatePayload.gender) {
        if (updatedUser.gender === gender) {
          fieldsUpdated.push("gender")
        } else if (!updatedUser.gender) {
          fieldsNotInResponse.push("gender")
        }
      }

      if (dateOfBirthISO) {
        if (updatedUser.dateOfBirth) {
          const updatedDob = new Date(updatedUser.dateOfBirth).toISOString()
          if (updatedDob === dateOfBirthISO) {
            fieldsUpdated.push("dateOfBirth")
          }
        } else {
          fieldsNotInResponse.push("dateOfBirth")
        }
      }

      console.log("✅ [UPDATE PROFILE] Các trường đã được cập nhật trong response:", fieldsUpdated)

      if (fieldsNotInResponse.length > 0) {
        console.warn(
          "⚠️ [UPDATE PROFILE] CẢNH BÁO: Backend không trả về các trường sau trong response:",
          fieldsNotInResponse,
          "\n→ Có thể backend không hỗ trợ các trường này hoặc chưa map vào response DTO.",
          "\n→ Kiểm tra backend: UserDto/UserResponse có include các trường này không?"
        )
      }

      // Merge user data với dữ liệu đã gửi (preserve nếu backend không trả về)
      const mergedUser: User = {
        ...updatedUser,
        // Preserve các giá trị đã gửi nếu backend không trả về
        phoneNumber: updatedUser.phoneNumber ?? (updatePayload.phoneNumber || phoneNumber || undefined),
        gender: updatedUser.gender ?? (updatePayload.gender || gender || undefined),
        dateOfBirth: updatedUser.dateOfBirth ?? (dateOfBirthISO || undefined),
      }

      setUser(mergedUser)

      // Cập nhật state: ưu tiên giá trị từ backend, nếu không có thì giữ nguyên giá trị đã gửi
      if (updatedUser.phoneNumber !== undefined) {
        setPhoneNumber(updatedUser.phoneNumber)
      } else if (updatePayload.phoneNumber) {
        // Backend không trả về, giữ nguyên giá trị đã gửi
        // (Có thể backend đã lưu nhưng không trả về trong response)
        console.info("ℹ️ [UPDATE PROFILE] Backend không trả về phoneNumber, giữ nguyên giá trị đã gửi:", updatePayload.phoneNumber)
      }

      if (updatedUser.gender !== undefined) {
        setGender(updatedUser.gender)
      } else if (updatePayload.gender) {
        // Backend không trả về, giữ nguyên giá trị đã gửi
        console.info("ℹ️ [UPDATE PROFILE] Backend không trả về gender, giữ nguyên giá trị đã gửi:", updatePayload.gender)
      }

      if (updatedUser.dateOfBirth) {
        try {
          const dob = new Date(updatedUser.dateOfBirth)
          setDateOfBirth({
            day: dob.getDate().toString(),
            month: (dob.getMonth() + 1).toString(),
            year: dob.getFullYear().toString()
          })
        } catch {
          // Ignore date parsing errors
        }
      } else if (dateOfBirthISO) {
        // Backend không trả về, giữ nguyên giá trị đã gửi
        console.info("ℹ️ [UPDATE PROFILE] Backend không trả về dateOfBirth, giữ nguyên giá trị đã gửi")
        // Giữ nguyên dateOfBirth state hiện tại (đã được set từ form)
      }

      if (updatedUser.avatarUrl) {
        setAvatarPreview(updatedUser.avatarUrl)
      }

      setIsEditingProfile(false)
      setSuccess("Đã cập nhật thông tin hồ sơ thành công!")
      setTimeout(() => setSuccess(null), 3000)

      // Trigger window event để các component khác có thể reload avatar
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("profileUpdated"))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật thông tin hồ sơ"
      setError(errorMessage)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAddNewAddress = () => {
    if (!newAddressValue.trim()) {
      setError("Vui lòng nhập địa chỉ mới")
      return
    }

    addShippingAddress(newAddressValue.trim(), newAddressLabel.trim() || undefined, savedAddresses.length === 0)
    setSavedAddresses(getSavedShippingAddresses())
    setNewAddressLabel("")
    setNewAddressValue("")
    setIsAddingNewAddress(false)
    setSuccess("Đã thêm địa chỉ giao hàng mới!")
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleNewAddressFormSubmit = async (data: AddressFormData) => {
    // Form đã tự gọi API updateShippingAddressDetail trong handleSubmit
    // Chỉ cần reload user data và đóng form
    try {
      const updatedUser = await getCurrentUser()
      setUser(updatedUser)
      setShippingAddress(updatedUser.shippingAddress || "")

      // Đồng bộ địa chỉ mới vào danh sách địa chỉ đã lưu
      if (updatedUser.shippingAddress) {
        syncMainAddressFromBackend(updatedUser.shippingAddress)
        setSavedAddresses(getSavedShippingAddresses())
      }

      setShowNewAddressForm(false)
      setSuccess("Đã cập nhật địa chỉ giao hàng thành công!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      // Error đã được xử lý trong form, nhưng vẫn cần đóng form
      setShowNewAddressForm(false)
      console.error("Error reloading user data:", err)
    }
  }

  const handleDeleteAddress = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
      deleteShippingAddress(id)
      setSavedAddresses(getSavedShippingAddresses())
      setSuccess("Đã xóa địa chỉ!")
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleSetDefault = (id: string) => {
    setDefaultShippingAddress(id)
    setSavedAddresses(getSavedShippingAddresses())
    setSuccess("Đã đặt làm địa chỉ mặc định!")
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSetAsMainAddress = async (address: string) => {
    if (!address.trim()) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Cập nhật địa chỉ chính lên backend
      const updatedUser = await updateCurrentUser({
        name: user?.name || "",
        shippingAddress: address.trim()
      })
      setUser(updatedUser)
      setShippingAddress(address.trim())

      // Đồng bộ với danh sách địa chỉ đã lưu
      syncMainAddressFromBackend(address.trim())
      setSavedAddresses(getSavedShippingAddresses())

      setSuccess("Đã cập nhật địa chỉ giao hàng chính!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật địa chỉ giao hàng chính"
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const startEditingAddress = (address: SavedShippingAddress) => {
    setEditingAddressId(address.id)
    setEditingAddressValue(address.address)
    setEditingAddressLabelValue(address.label || "")
  }

  const cancelEditingAddress = () => {
    setEditingAddressId(null)
    setEditingAddressValue("")
    setEditingAddressLabelValue("")
  }

  const handleUpdateAddress = (id: string) => {
    if (!editingAddressValue.trim()) {
      setError("Vui lòng nhập địa chỉ")
      return
    }

    const updated = updateShippingAddress(id, {
      address: editingAddressValue.trim(),
      label: editingAddressLabelValue.trim() || undefined,
    })

    if (!updated) {
      setError("Không thể cập nhật địa chỉ. Vui lòng thử lại.")
      return
    }

    setSavedAddresses(getSavedShippingAddresses())
    setSuccess("Đã cập nhật địa chỉ!")
    setTimeout(() => setSuccess(null), 3000)
    cancelEditingAddress()
  }

  const handleChangePassword = async () => {
    // Reset errors
    setError(null)
    setSuccess(null)

    // Validation - khớp với BE
    if (!currentPassword.trim()) {
      setError("Mật khẩu hiện tại là bắt buộc.")
      return
    }

    if (!newPassword.trim()) {
      setError("Mật khẩu mới là bắt buộc.")
      return
    }

    // Kiểm tra độ dài: 6-100 ký tự (khớp với BE)
    if (newPassword.length < 6 || newPassword.length > 100) {
      setError("Mật khẩu mới phải có từ 6 đến 100 ký tự.")
      return
    }

    // Kiểm tra regex: phải có chữ hoa, chữ thường và số (khớp với BE)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/
    if (!passwordRegex.test(newPassword)) {
      setError("Mật khẩu mới phải chứa ít nhất một chữ hoa, một chữ thường và một số.")
      return
    }

    // Kiểm tra xác nhận mật khẩu
    if (!confirmPassword.trim()) {
      setError("Vui lòng xác nhận mật khẩu mới.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp với mật khẩu mới.")
      return
    }

    // Kiểm tra mật khẩu mới phải khác mật khẩu hiện tại (BE sẽ kiểm tra lại, nhưng validate sớm ở FE)
    if (currentPassword === newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.")
      return
    }

    setChangingPassword(true)

    try {
      const response = await changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmNewPassword: confirmPassword.trim(),
      })

      // Lưu token mới từ response (BE trả về AuthResponse với Token mới)
      const newToken = response.Token || response.token
      if (newToken) {
        const { setAuthToken } = await import("@/lib/auth")
        setAuthToken(newToken)
      }

      // Reset form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowPassword({ current: false, new: false, confirm: false })

      // Hiển thị thông báo thành công
      const successMessage = response.Message || response.message || "Đổi mật khẩu thành công. Vui lòng lưu token mới để tiếp tục sử dụng."
      setSuccess(successMessage)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      let errorMessage = "Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau."

      if (err instanceof Error) {
        const errMsg = err.message

        // Parse error message từ BE
        // BE trả về: "Mật khẩu hiện tại không đúng" (BadRequest)
        if (errMsg.includes("Mật khẩu hiện tại không đúng") || errMsg.includes("401") || errMsg.includes("Unauthorized")) {
          errorMessage = "Mật khẩu hiện tại không đúng"
        }
        // BE trả về: "Mật khẩu xác nhận không khớp với mật khẩu mới" (BadRequest)
        else if (errMsg.includes("Mật khẩu xác nhận không khớp") || errMsg.includes("không khớp")) {
          errorMessage = "Mật khẩu xác nhận không khớp với mật khẩu mới"
        }
        // BE trả về: "Mật khẩu mới phải có từ 6 đến 100 ký tự" (BadRequest)
        else if (errMsg.includes("6 đến 100 ký tự") || errMsg.includes("6-100")) {
          errorMessage = "Mật khẩu mới phải có từ 6 đến 100 ký tự"
        }
        // BE trả về: "Mật khẩu mới phải chứa ít nhất một chữ hoa, một chữ thường và một số" (BadRequest)
        else if (errMsg.includes("chữ hoa") || errMsg.includes("chữ thường") || errMsg.includes("số")) {
          errorMessage = "Mật khẩu mới phải chứa ít nhất một chữ hoa, một chữ thường và một số"
        }
        // BE trả về: "Mật khẩu mới phải khác mật khẩu hiện tại" (BadRequest)
        else if (errMsg.includes("Mật khẩu mới phải khác mật khẩu hiện tại")) {
          errorMessage = "Mật khẩu mới phải khác mật khẩu hiện tại"
        }
        // BE trả về: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại." (Unauthorized)
        else if (errMsg.includes("Không tìm thấy thông tin người dùng") || errMsg.includes("đăng nhập lại")) {
          errorMessage = "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
          // Redirect to login after 1.5s
          setTimeout(() => {
            router.push("/login?redirect=/account")
          }, 1500)
        }
        // 404 - endpoint không tồn tại
        else if (errMsg.includes("404") || errMsg.includes("Not Found")) {
          errorMessage = "Backend chưa hỗ trợ đổi mật khẩu. Endpoint /auth/change-password không tồn tại. Vui lòng liên hệ quản trị viên để được hỗ trợ."
        }
        // 403 - Forbidden
        else if (errMsg.includes("403") || errMsg.includes("Forbidden")) {
          errorMessage = "Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại."
        }
        // Nếu error message từ BE có format rõ ràng, dùng luôn
        else if (errMsg && !errMsg.includes("400") && !errMsg.includes("500")) {
          errorMessage = errMsg
        }
      }

      setError(errorMessage)
    } finally {
      setChangingPassword(false)
    }
  }

  const resetPasswordForm = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setShowPassword({ current: false, new: false, confirm: false })
  }

  // Verify Email handlers
  const handleSendVerificationOtp = async () => {
    if (!email) {
      setError("Email không hợp lệ")
      return
    }

    setSendingOtp(true)
    setError(null)
    setSuccess(null)

    try {
      await resendVerificationOtp({ email })
      setOtpSent(true)
      setOtpCountdown(60)
      setSuccess("Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.")
      setTimeout(() => setSuccess(null), 5000)

      // Countdown timer
      const interval = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể gửi mã OTP"
      setError(errorMessage)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!email) {
      setError("Email không hợp lệ")
      return
    }

    if (otpCode.length !== 6) {
      setError("Mã OTP phải có 6 chữ số")
      return
    }

    setVerifyingEmail(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await verifyEmail({ email, otpCode, purpose: "Register" })
      if (result.isEmailVerified) {
        setSuccess("Xác thực email thành công!")
        setTimeout(() => setSuccess(null), 3000)

        // Reload user data
        const updatedUser = await getCurrentUser()
        setUser(updatedUser)

        // Reset form
        setOtpSent(false)
        setOtpCode("")
        setOtpCountdown(0)

        // Switch back to profile
        setTimeout(() => setActiveMenu("profile"), 2000)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Mã OTP không hợp lệ hoặc đã hết hạn"
      setError(errorMessage)
    } finally {
      setVerifyingEmail(false)
    }
  }

  const handleMarkNotificationAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    )
  }

  const handleToggleNotificationRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: !item.read } : item
      )
    )
  }

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }

  const handleClearNotifications = () => {
    setNotifications([])
  }

  const handleDeleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id))
  }

  const unreadNotificationCount = notifications.filter((n) => !n.read).length

  const formatDateTime = (isoDate?: string) => {
    if (!isoDate) return ""
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoDate))
    } catch {
      return isoDate
    }
  }

  // Load notifications (mock data for now)
  useEffect(() => {
    if (activeMenu === "notifications" && ready) {
      setLoadingNotifications(true)
      // TODO: Load from API when available
      setTimeout(() => {
        setNotifications([
          { id: 1, title: "Đơn hàng đã được xác nhận", message: "Đơn hàng #12345 của bạn đã được xác nhận", date: new Date().toISOString(), read: false },
          { id: 2, title: "Sản phẩm mới", message: "Có sản phẩm mới phù hợp với sở thích của bạn", date: new Date(Date.now() - 86400000).toISOString(), read: false },
        ])
        setLoadingNotifications(false)
      }, 500)
    }
  }, [activeMenu, ready])

  if (!ready) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Đang tải thông tin tài khoản...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            {/* User Profile Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold mb-3 overflow-hidden relative border-2 border-white shadow-md">
                  {(avatarPreview || user?.avatarUrl) ? (
                    <Image
                      src={avatarPreview || user?.avatarUrl || ""}
                      alt={user?.name || "Avatar"}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized={
                        (() => {
                          const avatarUrl = avatarPreview || user?.avatarUrl || ""
                          return (
                            avatarUrl.includes("gialai-ocop-be.onrender.com") ||
                            avatarUrl.includes("res.cloudinary.com") ||
                            avatarUrl.startsWith("blob:")
                          )
                        })()
                      }
                    />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <div className="font-medium text-gray-900 mb-1">{user?.name || "Người dùng"}</div>
                <Link
                  href="/account"
                  className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Sửa Hồ Sơ
                </Link>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <nav className="py-2">
                {/* Thông Báo */}
                <button
                  type="button"
                  onClick={() => setActiveMenu("notifications")}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${activeMenu === "notifications"
                    ? "text-orange-500 bg-orange-50 border-l-4 border-orange-500"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="font-medium flex-1 text-left">Thông Báo</span>
                  {unreadNotificationCount > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500 text-white font-semibold">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Tài Khoản Của Tôi - Expandable */}
                <div>
                  <button
                    onClick={() => setExpandedMenu(expandedMenu === "account" ? "" : "account")}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">Tài Khoản Của Tôi</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${expandedMenu === "account" ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedMenu === "account" && (
                    <div className="bg-gray-50">
                      <Link
                        href="/account"
                        onClick={(e) => {
                          e.preventDefault()
                          setActiveMenu("profile")
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${activeMenu === "profile"
                          ? "text-orange-500 bg-orange-50 border-l-2 border-orange-500"
                          : "text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current ml-2"></span>
                        Hồ Sơ
                      </Link>
                      <Link
                        href="/account/address"
                        onClick={(e) => {
                          e.preventDefault()
                          setActiveMenu("address")
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${activeMenu === "address"
                          ? "text-orange-500 bg-orange-50 border-l-2 border-orange-500"
                          : "text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current ml-2"></span>
                        Địa Chỉ
                      </Link>
                      <Link
                        href="/account/password"
                        onClick={(e) => {
                          e.preventDefault()
                          setActiveMenu("password")
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${activeMenu === "password"
                          ? "text-orange-500 bg-orange-50 border-l-2 border-orange-500"
                          : "text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current ml-2"></span>
                        Đổi Mật Khẩu
                      </Link>
                      <Link
                        href="/wallet"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-gray-600 hover:bg-gray-100"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current ml-2"></span>
                        Ví của tôi
                      </Link>
                      {!user?.isEmailVerified && (
                        <Link
                          href="/account/verify-email"
                          onClick={(e) => {
                            e.preventDefault()
                            setActiveMenu("verify-email")
                          }}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${activeMenu === "verify-email"
                            ? "text-orange-500 bg-orange-50 border-l-2 border-orange-500"
                            : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current ml-2"></span>
                          Xác thực Email
                          <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                            Mới
                          </span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Đơn Mua */}
                <Link
                  href="/orders"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Đơn Mua</span>
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-700">{success}</p>
                </div>
              </div>
            )}

            {/* Conditional Content Based on activeMenu */}
            {activeMenu === "profile" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Hồ Sơ Của Tôi</h2>
                  <p className="text-sm text-gray-500 mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
                </div>

                <div className="p-6">
                  <div className="flex gap-8">
                    {/* Left Column - Form Fields */}
                    <div className="flex-1 space-y-6">
                      {/* Tên đăng nhập */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên đăng nhập
                        </label>
                        <input
                          type="text"
                          value={user?.email?.split("@")[0] || ""}
                          disabled
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                        />
                        <p className="mt-1.5 text-xs text-gray-500">Tên Đăng nhập chỉ có thể thay đổi một lần.</p>
                      </div>

                      {/* Tên */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên
                        </label>
                        {isEditingProfile ? (
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập tên"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={name}
                            disabled
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                          />
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          Email
                          {user?.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Đã xác thực
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Chưa xác thực
                            </span>
                          )}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={email}
                            disabled
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                          />
                          {!user?.isEmailVerified && (
                            <button
                              onClick={() => setActiveMenu("verify-email")}
                              className="text-sm text-orange-500 hover:text-orange-600 font-medium px-3 py-2.5"
                            >
                              Xác thực Email
                            </button>
                          )}
                        </div>
                        {!user?.isEmailVerified && (
                          <p className="mt-1.5 text-xs text-yellow-600">
                            Email chưa được xác thực. Vui lòng xác thực để bảo mật tài khoản.
                          </p>
                        )}
                      </div>

                      {/* Số điện thoại */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số điện thoại
                        </label>
                        {isEditingProfile ? (
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Nhập số điện thoại"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="tel"
                              value={phoneNumber || "Chưa cập nhật"}
                              disabled
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                            {phoneNumber && (
                              <button
                                onClick={() => setIsEditingProfile(true)}
                                className="text-sm text-orange-500 hover:text-orange-600 font-medium px-3 py-2.5"
                              >
                                Thay Đổi
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Giới tính */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          Giới tính
                          <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value="male"
                              checked={gender === "male"}
                              onChange={(e) => setGender(e.target.value)}
                              disabled={!isEditingProfile}
                              className="w-4 h-4 text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className={`text-sm ${!isEditingProfile ? "text-gray-600" : "text-gray-700"}`}>Nam</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value="female"
                              checked={gender === "female"}
                              onChange={(e) => setGender(e.target.value)}
                              disabled={!isEditingProfile}
                              className="w-4 h-4 text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className={`text-sm ${!isEditingProfile ? "text-gray-600" : "text-gray-700"}`}>Nữ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value="other"
                              checked={gender === "other"}
                              onChange={(e) => setGender(e.target.value)}
                              disabled={!isEditingProfile}
                              className="w-4 h-4 text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className={`text-sm ${!isEditingProfile ? "text-gray-600" : "text-gray-700"}`}>Khác</span>
                          </label>
                        </div>
                      </div>

                      {/* Ngày sinh */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          Ngày sinh
                          <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </label>
                        <div className="flex gap-3">
                          <select
                            value={dateOfBirth.day}
                            onChange={(e) => setDateOfBirth({ ...dateOfBirth, day: e.target.value })}
                            disabled={!isEditingProfile}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Ngày</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                          <select
                            value={dateOfBirth.month}
                            onChange={(e) => setDateOfBirth({ ...dateOfBirth, month: e.target.value })}
                            disabled={!isEditingProfile}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Tháng</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month}>{month}</option>
                            ))}
                          </select>
                          <select
                            value={dateOfBirth.year}
                            onChange={(e) => setDateOfBirth({ ...dateOfBirth, year: e.target.value })}
                            disabled={!isEditingProfile}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Năm</option>
                            {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Ngày tạo */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Ngày tạo
                        </label>
                        <div className={`px-4 py-2.5 border rounded-md ${formattedCreatedAtDisplay.isEmpty
                          ? "text-gray-400 bg-gray-50 border-gray-200 italic"
                          : "text-gray-900 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200 font-medium"
                          }`}>
                          {formattedCreatedAtDisplay.text}
                        </div>
                      </div>

                      {/* Nút Lưu */}
                      <div className="pt-4">
                        <button
                          onClick={isEditingProfile ? handleSaveProfile : () => setIsEditingProfile(true)}
                          disabled={savingProfile || (isEditingProfile && !name.trim())}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingProfile ? "Đang lưu..." : isEditingProfile ? "Lưu" : "Chỉnh sửa"}
                        </button>
                      </div>
                    </div>

                    {/* Right Column - Profile Picture Upload */}
                    <div className="w-80 flex-shrink-0">
                      <div className="flex flex-col items-center">
                        {/* Avatar Preview */}
                        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-5xl font-bold mb-4 overflow-hidden relative border-4 border-white shadow-lg">
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Avatar preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user?.name?.charAt(0)?.toUpperCase() || "U"
                          )}
                        </div>

                        {/* Image Uploader */}
                        <ImageUploader
                          folder="GiaLaiOCOP/Users"
                          currentImageUrl={avatarPreview || user?.avatarUrl || undefined}
                          onUploaded={async (imageUrl) => {
                            setAvatarPreview(imageUrl)
                            setAvatarFile(null) // No need to store file anymore
                            setError(null)

                            // Auto-save avatar URL to user profile
                            try {
                              setUploadingAvatar(true)
                              const updatedUser = await updateCurrentUser({
                                name: user?.name || "",
                                avatarUrl: imageUrl,
                              })
                              setUser(updatedUser)

                              // Update avatar preview
                              setAvatarPreview(updatedUser.avatarUrl || imageUrl)

                              // Remove old localStorage avatar if exists
                              if (user?.id && typeof window !== "undefined") {
                                localStorage.removeItem(`user_avatar_${user.id}`)
                              }

                              setSuccess("Đã upload và lưu avatar thành công!")
                              setTimeout(() => setSuccess(null), 3000)
                            } catch (err) {
                              // Avatar was uploaded but failed to save to profile
                              // Keep the preview so user can retry saving
                              const errorMessage = err instanceof Error ? err.message : "Không thể lưu avatar"
                              setError(`Avatar đã được upload nhưng không thể lưu vào hồ sơ: ${errorMessage}`)
                              // Still keep preview so user can save manually
                            } finally {
                              setUploadingAvatar(false)
                            }
                          }}
                          onRemove={() => {
                            setAvatarPreview(null)
                            setAvatarFile(null)
                            // Clear localStorage
                            if (user?.id && typeof window !== "undefined") {
                              localStorage.removeItem(`user_avatar_${user.id}`)
                            }
                          }}
                          showRemoveButton={!!avatarPreview}
                          placeholder="Chọn ảnh đại diện"
                          maxPreviewSize={160}
                          disabled={uploadingAvatar}
                        />

                        <div className="text-xs text-gray-500 text-center mt-2 space-y-1">
                          <p>Ảnh sẽ tự động upload và lưu</p>
                          <p>Kích thước tối đa: 10MB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === "address" && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Địa chỉ giao hàng</h2>
                    <p className="text-sm text-gray-500 mt-1">Quản lý địa chỉ mặc định và danh sách địa chỉ đã lưu</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {savedAddresses.length > 0 ? `${savedAddresses.length} địa chỉ đã lưu` : "Chưa có địa chỉ nào"}
                  </div>
                </div>
                <div className="p-6 space-y-8">
                  {/* Main shipping address */}
                  <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-orange-50 p-6 shadow-inner space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-orange-500 font-semibold">Địa chỉ giao hàng chính</p>
                        <h3 className="text-lg font-semibold text-gray-900 mt-1">Địa chỉ đang sử dụng cho đơn hàng</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Địa chỉ này sẽ được dùng mặc định khi bạn đặt hàng. Bạn có thể chỉnh sửa hoặc lấy nhanh bằng GPS.
                        </p>
                      </div>
                      {shippingAddress && (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white text-orange-600 border border-orange-100 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                          Đang sử dụng
                        </span>
                      )}
                    </div>
                    <textarea
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      disabled={!isEditingAddress}
                      rows={4}
                      placeholder="Nhập địa chỉ giao hàng mặc định của bạn"
                      className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${isEditingAddress ? "bg-white border-orange-300" : "bg-white/50 border-transparent text-gray-700"
                        }`}
                    />
                    <div className="flex flex-wrap gap-3">
                      {isEditingAddress ? (
                        <>
                          <button
                            onClick={handleSaveAddress}
                            disabled={saving}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                          >
                            {saving ? "Đang lưu..." : "Lưu địa chỉ"}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingAddress(false)
                              setShippingAddress(user?.shippingAddress || "")
                            }}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-orange-200 text-orange-600 font-medium hover:bg-orange-50 transition-colors"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditingAddress(true)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => setShowAddressMapModal(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-orange-200 text-orange-600 font-medium hover:bg-orange-50 transition-colors"
                            title="Chọn địa chỉ trên bản đồ"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                              {/* Folded map - main shape */}
                              <path d="M4 5.5C4 4.67 4.67 4 5.5 4h6.09c.28 0 .55.08.78.23L16 6.5l3.63-2.27c.23-.15.5-.23.78-.23H21.5c.83 0 1.5.67 1.5 1.5v13c0 .83-.67 1.5-1.5 1.5h-6.09c-.28 0-.55-.08-.78-.23L12 16.5l-3.63 2.27c-.23.15-.5.23-.78.23H5.5C4.67 19 4 18.33 4 17.5V5.5z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round" />
                              {/* Map fold line */}
                              <path d="M12 4v16M4 5.5h8m0 0h8"
                                stroke="currentColor"
                                strokeWidth="1"
                                opacity="0.3"
                                strokeLinecap="round" />
                              {/* Location pin - positioned on the map */}
                              <path d="M16 9.5c0 1.38-1.12 2.5-2.5 2.5S11 10.88 11 9.5 12.12 7 13.5 7 16 8.12 16 9.5z"
                                fill="currentColor" />
                              <circle cx="13.5" cy="9.5" r="1.5" fill="white" />
                              <path d="M13.5 11v3"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round" />
                            </svg>
                            <span>Chọn trên bản đồ</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Saved addresses */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Danh sách địa chỉ đã lưu</h3>
                        <p className="text-sm text-gray-500">Thêm tối đa các địa chỉ thường dùng để chuyển đổi nhanh khi đặt hàng.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowNewAddressForm(true)
                            setIsAddingNewAddress(false)
                            setError(null) // Clear error khi mở form
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200 text-orange-600 font-medium hover:bg-orange-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Thêm địa chỉ mới (Form đầy đủ)
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingNewAddress((prev) => !prev)
                            setShowNewAddressForm(false)
                            setNewAddressLabel("")
                            setNewAddressValue("")
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {isAddingNewAddress ? "Đóng form" : "Thêm nhanh"}
                        </button>
                      </div>
                    </div>

                    {showNewAddressForm && (
                      <div className="border-t border-gray-200 pt-6">
                        <NewAddressForm
                          onBack={() => {
                            setShowNewAddressForm(false)
                            setError(null)
                          }}
                          onSubmit={handleNewAddressFormSubmit}
                          initialData={{
                            fullName: user?.name || "",
                            phoneNumber: user?.phoneNumber || "",
                            provinceId: user?.provinceId || 0,
                            districtId: user?.districtId || 0,
                            wardId: user?.wardId || 0,
                            specificAddress: user?.addressDetail || "",
                          }}
                        />
                      </div>
                    )}

                    {isAddingNewAddress && !showNewAddressForm && (
                      <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Nhãn địa chỉ</label>
                            <input
                              type="text"
                              value={newAddressLabel}
                              onChange={(e) => setNewAddressLabel(e.target.value)}
                              placeholder="Ví dụ: Nhà riêng, Công ty..."
                              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Địa chỉ</label>
                            <textarea
                              value={newAddressValue}
                              onChange={(e) => setNewAddressValue(e.target.value)}
                              rows={3}
                              placeholder="Nhập địa chỉ cụ thể của bạn..."
                              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setIsAddingNewAddress(false)
                              setNewAddressLabel("")
                              setNewAddressValue("")
                            }}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-white transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleAddNewAddress}
                            className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                          >
                            Lưu địa chỉ
                          </button>
                        </div>
                      </div>
                    )}

                    {savedAddresses.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                        Bạn chưa lưu địa chỉ nào. Nhấn <span className="font-semibold text-orange-500">"Thêm địa chỉ mới"</span> để bắt đầu.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {savedAddresses.map((addr) => {
                          const isEditing = editingAddressId === addr.id
                          return (
                            <div
                              key={addr.id}
                              className={`rounded-2xl border p-5 shadow-sm ${addr.isDefault ? "border-orange-200 bg-orange-50/50" : "border-gray-200 bg-white"
                                }`}
                            >
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <div className="flex items-center gap-3">
                                    <p className="text-base font-semibold text-gray-900">
                                      {addr.label || "Địa chỉ không nhãn"}
                                    </p>
                                    {addr.isDefault && (
                                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">
                                        Mặc định
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{addr.address}</p>
                                  <p className="text-xs text-gray-400 mt-1">Đã lưu: {formatDateTime(addr.createdAt)}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {!addr.isDefault && (
                                    <button
                                      onClick={() => handleSetDefault(addr.id)}
                                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
                                    >
                                      Đặt mặc định
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleSetAsMainAddress(addr.address)}
                                    className="px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 text-sm hover:bg-orange-50"
                                  >
                                    Dùng làm địa chỉ chính
                                  </button>
                                  <button
                                    onClick={() => startEditingAddress(addr)}
                                    className="px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 text-sm hover:bg-indigo-50"
                                  >
                                    Chỉnh sửa
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAddress(addr.id)}
                                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>

                              {isEditing && (
                                <div className="mt-4 space-y-3 border-t pt-4">
                                  <div className="grid md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-sm font-medium text-gray-700">Nhãn</label>
                                      <input
                                        type="text"
                                        value={editingAddressLabelValue}
                                        onChange={(e) => setEditingAddressLabelValue(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-sm font-medium text-gray-700">Địa chỉ</label>
                                      <textarea
                                        value={editingAddressValue}
                                        onChange={(e) => setEditingAddressValue(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-3">
                                    <button
                                      onClick={cancelEditingAddress}
                                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      onClick={() => handleUpdateAddress(addr.id)}
                                      className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600"
                                    >
                                      Cập nhật
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeMenu === "password" && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Đổi mật khẩu</h2>
                    <p className="text-sm text-gray-500 mt-1">Nên đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn.</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700">Bảo mật</span>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-12 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="Nhập mật khẩu đang sử dụng"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                          className="absolute inset-y-0 right-3 text-sm text-gray-500 hover:text-gray-700"
                        >
                          {showPassword.current ? "Ẩn" : "Hiện"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showPassword.new ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-12 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="6-100 ký tự, có chữ hoa, chữ thường và số"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                          className="absolute inset-y-0 right-3 text-sm text-gray-500 hover:text-gray-700"
                        >
                          {showPassword.new ? "Ẩn" : "Hiện"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-12 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="Nhập lại mật khẩu vừa tạo"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute inset-y-0 right-3 text-sm text-gray-500 hover:text-gray-700"
                        >
                          {showPassword.confirm ? "Ẩn" : "Hiện"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
                    <p className="font-semibold text-gray-800 mb-1">Yêu cầu mật khẩu mới:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Độ dài từ 6 đến 100 ký tự</li>
                      <li>Phải chứa ít nhất một chữ hoa (A-Z)</li>
                      <li>Phải chứa ít nhất một chữ thường (a-z)</li>
                      <li>Phải chứa ít nhất một số (0-9)</li>
                      <li>Mật khẩu mới phải khác mật khẩu hiện tại</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={resetPasswordForm}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50"
                    >
                      {changingPassword ? "Đang cập nhật..." : "Đổi mật khẩu"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeMenu === "notifications" && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Thông báo</h2>
                    <p className="text-sm text-gray-500">
                      {unreadNotificationCount > 0
                        ? `${unreadNotificationCount} thông báo chưa đọc`
                        : "Tất cả thông báo đã được đọc"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleMarkAllNotificationsAsRead}
                      disabled={notifications.length === 0 || unreadNotificationCount === 0}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-40"
                    >
                      Đánh dấu đã đọc
                    </button>
                    <button
                      onClick={handleClearNotifications}
                      disabled={notifications.length === 0}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-40"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {loadingNotifications ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                      Bạn chưa có thông báo nào. Khi có hoạt động mới, chúng tôi sẽ gửi thông báo tại đây.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-5 transition-all ${item.read
                          ? "border-gray-200 bg-gray-50"
                          : "border-orange-200 bg-white shadow-sm"
                          }`}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {!item.read && <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />}
                              <p className="text-base font-semibold text-gray-900">{item.title}</p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{formatDateTime(item.date)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <button
                              onClick={() => handleToggleNotificationRead(item.id)}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                              {item.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                            </button>
                            <button
                              onClick={() => handleDeleteNotification(item.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

          </div>
        </div>
      </main>

      {/* Address Map Modal */}
      <AddressMapModal
        isOpen={showAddressMapModal}
        onClose={() => setShowAddressMapModal(false)}
        onSelect={(address) => {
          setShippingAddress(address)
          setIsEditingAddress(true)
          setShowAddressMapModal(false)
        }}
        initialAddress={shippingAddress}
      />
    </div>
  )
}

interface InfoFieldProps {
  label: string
  value?: string | number | null
  badge?: boolean
  badgeColor?: string
  icon?: "user" | "email" | "role" | "calendar" | "location" | "check" | "key" | "building" | "id" | "briefcase" | "phone" | "globe" | "map"
  isEmpty?: boolean
  isDate?: boolean
}

function InfoField({ label, value, badge, badgeColor, icon, isEmpty, isDate }: InfoFieldProps) {
  const display = value && value !== "" ? value : "(chưa cập nhật)"
  const isDisplayEmpty = isEmpty || (!value || value === "" || value === "(chưa cập nhật)")

  const iconMap = {
    user: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    email: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    role: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    calendar: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    location: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    check: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    key: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    building: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    id: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
    briefcase: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    phone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    globe: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    map: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  }

  if (badge) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          {icon && <span className="text-indigo-600">{iconMap[icon]}</span>}
          {label}
        </label>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${badgeColor || "bg-indigo-100 text-indigo-700"
            }`}
        >
          {display}
        </span>
      </div>
    )
  }
  // Xác định màu icon dựa trên trạng thái
  const iconColorClass = isDisplayEmpty
    ? "text-gray-400"
    : isDate
      ? "text-purple-500"
      : icon === "calendar"
        ? "text-indigo-500"
        : "text-gray-400"

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
        {icon && <span className={iconColorClass}>{iconMap[icon]}</span>}
        {label}
      </label>
      <div className={`text-base rounded-lg px-4 py-3 border transition-all ${isDisplayEmpty
        ? "text-gray-400 bg-gray-50 border-gray-200 italic font-medium"
        : isDate
          ? "text-gray-900 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200 shadow-sm font-semibold"
          : "text-gray-900 bg-gray-50 border-gray-200 font-semibold"
        }`}>
        {display}
      </div>
    </div>
  )
}



