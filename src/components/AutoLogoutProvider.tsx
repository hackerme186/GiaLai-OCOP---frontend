"use client"

import { useAutoLogout } from "@/lib/hooks/useAutoLogout"
import { useToast } from "@/components/Toast"

/**
 * Provider component để tự động đăng xuất khi:
 * 1. Không hoạt động trong X phút (default: 15 phút)
 * 2. Đóng tab/trình duyệt/refresh
 */
export default function AutoLogoutProvider({ 
  children,
  idleTimeInMinutes = 15 
}: { 
  children: React.ReactNode
  idleTimeInMinutes?: number 
}) {
  const { showToast, ToastContainer } = useToast()

  // Sử dụng hook auto logout với toast integration
  useAutoLogout({
    idleTimeInMinutes,
    showToast: (message: string) => {
      showToast(message, "info") // Hiển thị toast với type "info"
    },
  })

  return (
    <>
      {children}
      <ToastContainer />
    </>
  )
}

