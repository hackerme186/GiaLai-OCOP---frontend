"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { logout, getAuthToken } from "@/lib/auth"

interface UseAutoLogoutOptions {
  idleTimeInMinutes?: number // Default: 15 minutes
  onLogout?: () => void // Callback khi logout
  showToast?: (message: string) => void // Callback để hiển thị toast
}

/**
 * Hook tự động đăng xuất khi:
 * 1. Không hoạt động trong X phút (idle timeout)
 * 2. Đóng tab/trình duyệt/refresh (beforeunload)
 */
export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
  const {
    idleTimeInMinutes = 15,
    onLogout,
    showToast,
  } = options

  const router = useRouter()
  const pathname = usePathname()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isLoggingOutRef = useRef(false)

  // Các route không cần check auto logout (public routes)
  const publicRoutes = ['/login', '/register', '/', '/home']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Hàm logout với redirect và notification
  const performLogout = useCallback(() => {
    // Prevent multiple logout calls
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    // Clear token
    logout()

    // Show notification
    const message = "Phiên đăng nhập đã hết hạn do không hoạt động."
    if (showToast) {
      showToast(message)
    } else {
      // Fallback: alert nếu không có toast system
      alert(message)
    }

    // Callback
    if (onLogout) {
      onLogout()
    }

    // Redirect to login (chỉ khi không phải public route)
    if (!isPublicRoute) {
      router.push('/login')
    }

    // Reset flag after a delay
    setTimeout(() => {
      isLoggingOutRef.current = false
    }, 1000)
  }, [router, pathname, onLogout, showToast, isPublicRoute])

  // Reset idle timer khi có hoạt động
  const resetIdleTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Chỉ set timer nếu đã đăng nhập
    const token = getAuthToken()
    if (!token || isPublicRoute) {
      return
    }

    // Update last activity time
    lastActivityRef.current = Date.now()

    // Set new timeout
    const idleTimeInMs = idleTimeInMinutes * 60 * 1000
    timeoutRef.current = setTimeout(() => {
      performLogout()
    }, idleTimeInMs)
  }, [idleTimeInMinutes, performLogout, isPublicRoute])

  // Track user activity
  useEffect(() => {
    if (isPublicRoute) return

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    const handleActivity = () => {
      resetIdleTimer()
    }

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Initial timer setup
    resetIdleTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [resetIdleTimer, isPublicRoute])

  // Handle visibility change (tab switch, minimize, etc.)
  useEffect(() => {
    if (isPublicRoute) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - pause timer (optional, có thể để tiếp tục đếm)
        // Hoặc có thể logout ngay khi tab bị ẩn
      } else {
        // Tab is visible again - check if too much time has passed
        const token = getAuthToken()
        if (!token) return

        const timeSinceLastActivity = Date.now() - lastActivityRef.current
        const idleTimeInMs = idleTimeInMinutes * 60 * 1000

        if (timeSinceLastActivity >= idleTimeInMs) {
          performLogout()
        } else {
          resetIdleTimer()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [idleTimeInMinutes, performLogout, resetIdleTimer, isPublicRoute])

  // Handle beforeunload (close tab/browser/refresh)
  useEffect(() => {
    if (isPublicRoute) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Lưu flag để biết là user đã đóng tab/refresh
      // Không clear token ngay ở đây vì beforeunload có giới hạn
      // Sẽ check và clear khi page load lại
      const token = getAuthToken()
      if (token) {
        sessionStorage.setItem('ocop_logout_on_close', 'true')
        // Lưu thời gian để check khi mở lại
        sessionStorage.setItem('ocop_last_activity', Date.now().toString())
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isPublicRoute])

  // Check on mount if user should be logged out (after refresh/close)
  useEffect(() => {
    if (isPublicRoute) return

    const shouldLogout = sessionStorage.getItem('ocop_logout_on_close')
    if (shouldLogout === 'true') {
      sessionStorage.removeItem('ocop_logout_on_close')
      
      // Clear token khi page load lại sau khi đóng tab/refresh
      const token = getAuthToken()
      if (token) {
        logout()
        
        // Redirect to login
        router.push('/login')
        if (showToast) {
          showToast("Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.")
        }
      }
    }
  }, [router, pathname, showToast, isPublicRoute])

  // Reset timer khi route thay đổi (đảm bảo không logout khi chỉ đổi route trong SPA)
  useEffect(() => {
    if (isPublicRoute) {
      // Clear timer nếu vào public route
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Reset timer khi route thay đổi (nhưng vẫn là protected route)
    const token = getAuthToken()
    if (token) {
      // Reset last activity time và timer
      lastActivityRef.current = Date.now()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      const idleTimeInMs = idleTimeInMinutes * 60 * 1000
      timeoutRef.current = setTimeout(() => {
        performLogout()
      }, idleTimeInMs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, idleTimeInMinutes, isPublicRoute])

  return {
    resetIdleTimer, // Expose để có thể reset manually nếu cần
  }
}

