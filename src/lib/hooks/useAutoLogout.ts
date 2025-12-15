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
 * 1. Không hoạt động trong X phút (idle timeout) - mặc định 15 phút
 * 2. Khi refresh trang, nếu thời gian không hoạt động đã vượt quá giới hạn sẽ tự động logout
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
  const lastResetTimeRef = useRef<number>(0)

  // Các route không cần check auto logout (public routes)
  // Chỉ các trang login/register mới là public, các trang khác cần check auto logout
  const publicRoutes = ['/login', '/register']
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
      timeoutRef.current = null
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
    console.log(`[AutoLogout] Setting timer for ${idleTimeInMinutes} minutes (${idleTimeInMs}ms)`)
    timeoutRef.current = setTimeout(() => {
      console.log(`[AutoLogout] Timeout reached, logging out...`)
      performLogout()
    }, idleTimeInMs)
  }, [idleTimeInMinutes, performLogout, isPublicRoute])

  // Track user activity
  useEffect(() => {
    if (isPublicRoute) {
      console.log(`[AutoLogout] Skipping - public route: ${pathname}`)
      return
    }

    const token = getAuthToken()
    if (!token) {
      console.log(`[AutoLogout] Skipping - no token`)
      return
    }

    console.log(`[AutoLogout] Initializing on route: ${pathname}, idleTime: ${idleTimeInMinutes} minutes`)

    const throttleDelay = 2000 // Chỉ reset timer tối đa mỗi 2 giây

    const handleActivity = (eventType: string) => {
      // Throttle để tránh reset quá nhiều lần (đặc biệt với mousemove)
      const now = Date.now()
      if (now - lastResetTimeRef.current < throttleDelay) {
        return
      }
      lastResetTimeRef.current = now
      console.log(`[AutoLogout] Activity detected: ${eventType}, resetting timer`)
      resetIdleTimer()
    }

    // Throttle riêng cho mousemove để tránh quá nhiều events
    let mouseMoveTimeout: NodeJS.Timeout | null = null
    const throttledMouseMove = () => {
      if (mouseMoveTimeout) return
      mouseMoveTimeout = setTimeout(() => {
        handleActivity('mousemove')
        mouseMoveTimeout = null
      }, throttleDelay)
    }

    // Tạo handlers cho các events khác
    const handleMouseDown = () => handleActivity('mousedown')
    const handleKeyPress = () => handleActivity('keypress')
    const handleScroll = () => handleActivity('scroll')
    const handleTouchStart = () => handleActivity('touchstart')
    const handleClick = () => handleActivity('click')

    // Add event listeners
    window.addEventListener('mousemove', throttledMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    window.addEventListener('keypress', handleKeyPress, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('click', handleClick, { passive: true })

    // Initial timer setup
    resetIdleTimer()

    // Cleanup
    return () => {
      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout)
      }
      window.removeEventListener('mousemove', throttledMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keypress', handleKeyPress)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('click', handleClick)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [resetIdleTimer, isPublicRoute, pathname, idleTimeInMinutes])

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

  // Lưu thời gian hoạt động cuối cùng vào sessionStorage để check khi refresh
  useEffect(() => {
    if (isPublicRoute) return

    const updateLastActivity = () => {
      sessionStorage.setItem('ocop_last_activity', Date.now().toString())
    }

    // Update last activity khi có hoạt động
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      window.addEventListener(event, updateLastActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateLastActivity)
      })
    }
  }, [isPublicRoute])

  // Check on mount if user should be logged out (sau khi refresh, check thời gian không hoạt động)
  useEffect(() => {
    if (isPublicRoute) return

    const lastActivityStr = sessionStorage.getItem('ocop_last_activity')
    if (lastActivityStr) {
      const lastActivity = parseInt(lastActivityStr, 10)
      const timeSinceLastActivity = Date.now() - lastActivity
      const idleTimeInMs = idleTimeInMinutes * 60 * 1000

      // Nếu thời gian không hoạt động vượt quá giới hạn, logout
      if (timeSinceLastActivity >= idleTimeInMs) {
        const token = getAuthToken()
        if (token) {
          logout()
          sessionStorage.removeItem('ocop_last_activity')
          router.push('/login')
          if (showToast) {
            showToast("Phiên đăng nhập đã hết hạn do không hoạt động.")
          }
        }
      } else {
        // Cập nhật lastActivityRef để tiếp tục đếm từ thời điểm hiện tại
        lastActivityRef.current = lastActivity
      }
    }
  }, [router, pathname, showToast, isPublicRoute, idleTimeInMinutes])

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

