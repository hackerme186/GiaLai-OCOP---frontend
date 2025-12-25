"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { loginWithGoogle } from "@/lib/api"
import { setAuthToken, getRoleFromToken, setUserProfile } from "@/lib/auth"
import { getCurrentUser } from "@/lib/api"
import { useRouter } from "next/navigation"
import { getUserFriendlyError } from "@/lib/errorHandler"

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { 
            client_id: string
            callback: (response: any) => void
          }) => void
          renderButton: (element: HTMLElement, config: { 
            theme?: string
            size?: string
            text?: string
            width?: string
            type?: string
            shape?: string
            logo_alignment?: string
          }) => void
        }
      }
    }
  }
}

interface GoogleLoginButtonProps {
  onError?: (error: string) => void
}

export default function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const onErrorRef = useRef(onError)
  const routerRef = useRef(router)
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  // Keep refs updated
  useEffect(() => {
    onErrorRef.current = onError
    routerRef.current = router
  }, [onError, router])

  const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      console.error("❌ [GoogleLogin] Không nhận được credential từ Google")
      onErrorRef.current?.("Đăng nhập Google thất bại. Vui lòng thử lại.")
      return
    }

    setIsLoading(true)
    console.log("🔐 [GoogleLogin] Bắt đầu đăng nhập với Google...")

    try {
      const idToken = credentialResponse.credential || credentialResponse
      console.log("📤 [GoogleLogin] Gửi idToken lên backend...")
      console.log("📤 [GoogleLogin] ID Token length:", idToken.length)
      console.log("📤 [GoogleLogin] ID Token preview:", idToken.substring(0, 50) + "...")

      const res = await loginWithGoogle({ idToken }) as any
      console.log("📥 [GoogleLogin] Response từ API:", res)
      console.log("📥 [GoogleLogin] Full response (JSON):", JSON.stringify(res, null, 2))

      // Extract token với nhiều format khác nhau
      const token = res?.token || res?.Token || res?.data?.token || res?.data?.Token
      console.log("🔑 [GoogleLogin] Token extracted:", token ? `${token.substring(0, 20)}...` : "NULL")
      console.log("🔑 [GoogleLogin] Response keys:", Object.keys(res || {}))

      if (!token) {
        console.error("❌ [GoogleLogin] Không tìm thấy token trong response")
        console.error("❌ [GoogleLogin] Response structure:", {
          hasToken: !!res?.token,
          hasTokenCapital: !!res?.Token,
          hasDataToken: !!res?.data?.token,
          hasDataTokenCapital: !!res?.data?.Token,
          responseKeys: Object.keys(res || {}),
          responseType: typeof res,
          responseIsArray: Array.isArray(res)
        })
        throw new Error("Không nhận được token từ server. Vui lòng thử lại.")
      }

      // Save token
      console.log("💾 [GoogleLogin] Lưu token vào localStorage...")
      setAuthToken(token)

      // Verify token đã được lưu
      const savedToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      console.log("✅ [GoogleLogin] Token đã được lưu:", savedToken ? "YES" : "NO")
      if (savedToken) {
        console.log("✅ [GoogleLogin] Saved token preview:", savedToken.substring(0, 20) + "...")
      }

      // Wait a bit to ensure token is saved
      await new Promise(resolve => setTimeout(resolve, 100))

      // Extract role
      const extractRole = (obj: any): string => {
        if (!obj) return ""
        const u = obj.user || obj.data || obj
        const direct = u.role || u.userRole || u.authorities || u.permission || u.permissions
        if (Array.isArray(direct)) return (direct[0] || "").toString()
        if (typeof direct === 'string') return direct
        if (Array.isArray(u.roles)) return (u.roles[0] || "").toString()
        return ""
      }

      let role = getRoleFromToken(token) || extractRole(res)
      console.log("👤 [GoogleLogin] Role từ token:", role || "NOT FOUND")

      // If still no role, try to get from /me endpoint
      if (!role || role.trim() === "") {
        console.log("👤 [GoogleLogin] Role không tìm thấy, đang gọi /me endpoint...")
        try {
          const me = await getCurrentUser()
          console.log("👤 [GoogleLogin] User info từ /me:", me)
          role = extractRole(me) || (me.role || (me as any).roles)?.toString?.() || ""
          console.log("👤 [GoogleLogin] Role từ /me:", role || "NOT FOUND")
        } catch (err) {
          console.warn("⚠️ [GoogleLogin] Could not fetch user info:", err)
        }
      }

      // Normalize role
      const norm = role.toString().toLowerCase().trim()
      console.log("👤 [GoogleLogin] Normalized role:", norm)

      // Check roles
      const isSystemAdmin = norm === 'systemadmin' || norm === 'sysadmin'
      const isEnterpriseAdmin = norm === 'enterpriseadmin'
      const isAdmin = isSystemAdmin ||
        norm === 'admin' ||
        norm === 'administrator' ||
        norm === 'role_admin' ||
        norm === 'admin_role'

      // Get user profile
      try {
        console.log("👤 [GoogleLogin] Đang lấy user profile...")
        const profile = await getCurrentUser()
        console.log("👤 [GoogleLogin] User profile:", profile)
        setUserProfile({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          enterpriseId: profile.enterpriseId ?? undefined,
          createdAt: profile.createdAt,
        })
        console.log("✅ [GoogleLogin] User profile đã được lưu")
      } catch (profileErr) {
        console.warn("⚠️ [GoogleLogin] Could not load user profile:", profileErr)
      }

      // Redirect based on role
      console.log("🔀 [GoogleLogin] Đang redirect...")
      if (isSystemAdmin || isAdmin) {
        console.log("🔀 [GoogleLogin] Redirecting to /admin")
        routerRef.current.replace("/admin")
      } else if (isEnterpriseAdmin) {
        console.log("🔀 [GoogleLogin] Redirecting to /enterprise-admin")
        routerRef.current.replace("/enterprise-admin")
      } else {
        console.log("🔀 [GoogleLogin] Redirecting to /home")
        routerRef.current.replace("/home")
      }

      console.log("✅ [GoogleLogin] Đăng nhập thành công!")
    } catch (err) {
      console.error("❌ [GoogleLogin] Lỗi đăng nhập:", err)
      
      // Log chi tiết error
      if (err instanceof Error) {
        console.error("❌ [GoogleLogin] Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
          cause: (err as any).cause
        })
      } else {
        console.error("❌ [GoogleLogin] Error object:", err)
      }
      
      // Log thêm thông tin về error nếu có
      if (err && typeof err === 'object') {
        const errorObj = err as any
        if (errorObj.status) {
          console.error("❌ [GoogleLogin] Error status:", errorObj.status)
        }
        if (errorObj.response) {
          console.error("❌ [GoogleLogin] Error response:", errorObj.response)
        }
        if (errorObj.isAuthError) {
          console.error("❌ [GoogleLogin] Authentication error detected")
        }
        if (errorObj.isNetworkError) {
          console.error("❌ [GoogleLogin] Network error detected:", errorObj.originalError)
        }
      }
      
      // Chuyển đổi error thành thông báo dễ hiểu cho người dùng
      const errorMessage = getUserFriendlyError(err)
      onErrorRef.current?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const scriptLoadedRef = useRef(false)

  const initializeGoogleSDK = useCallback(() => {
    if (!window.google?.accounts?.id) {
      console.warn("⚠️ [GoogleLogin] window.google.accounts.id chưa sẵn sàng")
      return false
    }

    if (!buttonRef.current) {
      console.warn("⚠️ [GoogleLogin] buttonRef.current chưa sẵn sàng")
      return false
    }

    if (isInitialized) {
      return true // Already initialized
    }

    try {
      console.log("🔧 [GoogleLogin] Đang khởi tạo Google SDK...")
      
      // Initialize Google SDK
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSuccess,
      })
      
      console.log("🔧 [GoogleLogin] Đang render Google button...")
      
      // Render hidden Google button
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: "100%",
        type: "standard",
      })
      
      // Hide the Google button - use multiple attempts to ensure it's hidden
      const hideButton = () => {
        if (buttonRef.current) {
          const googleButton = buttonRef.current.querySelector('div[role="button"]') as HTMLElement
          if (googleButton) {
            googleButton.style.display = 'none'
            googleButton.style.visibility = 'hidden'
            googleButton.style.position = 'absolute'
            googleButton.style.opacity = '0'
            googleButton.style.width = '0'
            googleButton.style.height = '0'
            googleButton.style.pointerEvents = 'none'
            return true
          }
        }
        return false
      }

      // Try to hide immediately
      if (!hideButton()) {
        // If not found, try again after a short delay
        setTimeout(() => {
          hideButton()
        }, 50)
        
        // And again after longer delay for production
        setTimeout(() => {
          hideButton()
        }, 300)
        
        // Final attempt
        setTimeout(() => {
          hideButton()
        }, 1000)
      }
      
      setIsSDKLoaded(true)
      setIsInitialized(true)
      console.log("✅ [GoogleLogin] Google SDK đã được khởi tạo thành công")
      return true
    } catch (error: any) {
      console.error("❌ [GoogleLogin] Lỗi khởi tạo Google SDK:", error)
      onErrorRef.current?.("Không thể khởi tạo Google login. Vui lòng thử lại sau.")
      return false
    }
  }, [GOOGLE_CLIENT_ID, handleGoogleSuccess, isInitialized])

  // Load Google SDK script
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return
    }

    if (!GOOGLE_CLIENT_ID) {
      console.warn("⚠️ [GoogleLogin] NEXT_PUBLIC_GOOGLE_CLIENT_ID chưa được cấu hình")
      return
    }

    // Check if SDK is already loaded
    if (window.google?.accounts?.id) {
      console.log("✅ [GoogleLogin] Google SDK đã được load sẵn")
      setTimeout(() => {
        initializeGoogleSDK()
      }, 100)
      return
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (existingScript) {
      console.log("📝 [GoogleLogin] Script đã tồn tại trong DOM, đợi load...")
      
      const checkSDK = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkSDK)
          initializeGoogleSDK()
        }
      }, 100)

      const timeout = setTimeout(() => {
        clearInterval(checkSDK)
      }, 10000)

      return () => {
        clearInterval(checkSDK)
        clearTimeout(timeout)
      }
    }

    // Prevent multiple script loads
    if (scriptLoadedRef.current) {
      return
    }

    console.log("📥 [GoogleLogin] Bắt đầu load Google SDK script...")
    scriptLoadedRef.current = true

    // Create and load script
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.id = "google-gsi-script"
    
    // Remove crossOrigin to avoid CORS issues
    // script.crossOrigin = "anonymous"
    
    let loadTimeout: NodeJS.Timeout | null = null
    
    script.onload = () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout)
      }
      console.log("✅ [GoogleLogin] Google SDK script đã load thành công")
      setIsSDKLoaded(true)
      
      // Wait for SDK to be available
      const checkSDK = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkSDK)
          console.log("✅ [GoogleLogin] window.google.accounts.id đã sẵn sàng")
          setTimeout(() => {
            initializeGoogleSDK()
          }, 100)
        }
      }, 50)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkSDK)
        if (!window.google?.accounts?.id) {
          console.error("❌ [GoogleLogin] Script đã load nhưng window.google.accounts.id không có sau 5 giây")
          onErrorRef.current?.("Google SDK đã load nhưng không khởi tạo được. Vui lòng refresh trang.")
        }
      }, 5000)
    }
    
    script.onerror = (error) => {
      if (loadTimeout) {
        clearTimeout(loadTimeout)
      }
      scriptLoadedRef.current = false
      console.error("❌ [GoogleLogin] Lỗi load Google SDK script:", error)
      console.error("❌ [GoogleLogin] Script src:", script.src)
      console.error("❌ [GoogleLogin] Script parent:", script.parentNode)
      
      // Try to diagnose the issue
      fetch("https://accounts.google.com/gsi/client", { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
          console.log("✅ [GoogleLogin] Có thể fetch Google URL (no-cors)")
        })
        .catch((err) => {
          console.error("❌ [GoogleLogin] Không thể fetch Google URL:", err)
        })
      
      onErrorRef.current?.("Không thể tải Google SDK. Vui lòng kiểm tra kết nối internet hoặc thử refresh trang.")
    }
    
    // Set timeout
    loadTimeout = setTimeout(() => {
      if (!window.google?.accounts?.id) {
        console.warn("⚠️ [GoogleLogin] Script load timeout sau 15 giây")
        script.onerror?.(new Event('timeout') as any)
      }
    }, 15000)
    
    // Append script to DOM
    try {
      // Wait for DOM to be ready
      const appendScript = () => {
        try {
          if (document.head) {
            document.head.appendChild(script)
            console.log("✅ [GoogleLogin] Script đã được thêm vào <head>")
          } else if (document.body) {
            document.body.appendChild(script)
            console.log("✅ [GoogleLogin] Script đã được thêm vào <body>")
          } else {
            console.error("❌ [GoogleLogin] Không tìm thấy <head> hoặc <body>")
          }
        } catch (error) {
          console.error("❌ [GoogleLogin] Lỗi khi thêm script vào DOM:", error)
          scriptLoadedRef.current = false
          onErrorRef.current?.("Không thể thêm Google SDK script. Vui lòng thử lại.")
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', appendScript, { once: true })
      } else {
        appendScript()
      }
    } catch (error) {
      console.error("❌ [GoogleLogin] Lỗi khi setup script:", error)
      scriptLoadedRef.current = false
      onErrorRef.current?.("Không thể setup Google SDK. Vui lòng thử lại.")
    }

    return () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout)
      }
      // Don't remove script on cleanup
    }
  }, [GOOGLE_CLIENT_ID, initializeGoogleSDK])

  const handleGoogleClick = () => {
    if (!window.google?.accounts?.id) {
      console.error("❌ [GoogleLogin] Google SDK chưa được tải")
      onErrorRef.current?.("Google SDK chưa sẵn sàng. Vui lòng thử lại sau.")
      return
    }

    if (!isInitialized) {
      console.error("❌ [GoogleLogin] Google SDK chưa được khởi tạo")
      onErrorRef.current?.("Google login chưa sẵn sàng. Vui lòng thử lại sau.")
      return
    }

    if (!buttonRef.current) {
      console.error("❌ [GoogleLogin] Button ref không tồn tại")
      onErrorRef.current?.("Không thể khởi động Google login. Vui lòng thử lại.")
      return
    }

    setIsLoading(true)
    
    // Try multiple ways to find and trigger the Google button
    const triggerGoogleButton = () => {
      // Method 1: Find by role="button"
      let googleButton = buttonRef.current?.querySelector('div[role="button"]') as HTMLElement
      
      // Method 2: Find by iframe
      if (!googleButton) {
        const iframe = buttonRef.current?.querySelector('iframe')
        if (iframe) {
          googleButton = iframe as HTMLElement
        }
      }
      
      // Method 3: Find any clickable element
      if (!googleButton) {
        const clickable = buttonRef.current?.querySelector('[tabindex="0"]') as HTMLElement
        if (clickable) {
          googleButton = clickable
        }
      }

      if (googleButton) {
        // Try click first
        googleButton.click()
        
        // If that doesn't work, try dispatching events
        setTimeout(() => {
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          })
          googleButton?.dispatchEvent(clickEvent)
        }, 50)
        
        return true
      }
      
      return false
    }

    // Try to trigger immediately
    if (!triggerGoogleButton()) {
      // If not found, wait a bit and try again (for production delays)
      setTimeout(() => {
        if (!triggerGoogleButton()) {
          console.error("❌ [GoogleLogin] Không tìm thấy Google button")
          onErrorRef.current?.("Không thể khởi động Google login. Vui lòng thử lại.")
          setIsLoading(false)
        }
      }, 200)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={isLoading || !isSDKLoaded || !isInitialized || !GOOGLE_CLIENT_ID}
        className="w-14 h-14 rounded-full bg-[#DB4437] text-white flex items-center justify-center hover:bg-[#C23321] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl relative"
        title={!isInitialized ? "Đang tải Google login..." : "Đăng nhập bằng Google"}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-6 w-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="flex-shrink-0"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
      </button>
      <div ref={buttonRef} className="hidden" aria-hidden="true"></div>
      {isLoading && (
        <p className="text-center text-xs text-white/80 mt-2">
          Đang xử lý...
        </p>
      )}
      {!isSDKLoaded && GOOGLE_CLIENT_ID && (
        <p className="text-center text-xs text-white/60 mt-1">
          Đang tải...
        </p>
      )}
    </div>
  )
}
