"use client"
import { useState, useEffect, useRef } from "react"
import { loginWithGoogle } from "@/lib/api"
import { setAuthToken, getRoleFromToken, setUserProfile } from "@/lib/auth"
import { getCurrentUser } from "@/lib/api"
import { useRouter } from "next/navigation"

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { 
            client_id: string
            callback: (response: any) => void
            use_fedcm_for_prompt?: boolean
          }) => void
          prompt: () => void
          renderButton: (element: HTMLElement, config: { theme?: string; size?: string; text?: string; width?: string; type?: string }) => void
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
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      console.error("❌ [GoogleLogin] Không nhận được credential từ Google")
      onError?.("Đăng nhập Google thất bại. Vui lòng thử lại.")
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
        router.replace("/admin")
      } else if (isEnterpriseAdmin) {
        console.log("🔀 [GoogleLogin] Redirecting to /enterprise-admin")
        router.replace("/enterprise-admin")
      } else {
        console.log("🔀 [GoogleLogin] Redirecting to /home")
        router.replace("/home")
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
      
      const errorMessage = err instanceof Error ? err.message : "Đăng nhập Google thất bại. Vui lòng thử lại."
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load Google Identity Services SDK
  useEffect(() => {
    // 🔍 Debug: Log thông tin để kiểm tra
    console.log("🔍 [GoogleLogin Debug] ========================================")
    console.log("🔍 [GoogleLogin Debug] Client ID:", GOOGLE_CLIENT_ID)
    console.log("🔍 [GoogleLogin Debug] Client ID Length:", GOOGLE_CLIENT_ID.length)
    console.log("🔍 [GoogleLogin Debug] Current Origin:", window.location.origin)
    console.log("🔍 [GoogleLogin Debug] Expected Origins:", [
      "http://localhost:3000",
      "https://gialai-ocop-frontend-2.onrender.com"
    ])
    console.log("🔍 [GoogleLogin Debug] Origin Match:", [
      "http://localhost:3000",
      "https://gialai-ocop-frontend-2.onrender.com"
    ].includes(window.location.origin))
    console.log("🔍 [GoogleLogin Debug] ========================================")
    
    if (!GOOGLE_CLIENT_ID) {
      console.warn("⚠️ [GoogleLogin] NEXT_PUBLIC_GOOGLE_CLIENT_ID chưa được cấu hình")
      return
    }

    // Helper function to show origin error
    const showOriginError = (origin: string) => {
      const errorMsg = `Origin "${origin}" chưa được cấu hình trong Google Cloud Console.`
      console.error(`❌ [GoogleLogin] ${errorMsg}`)
      console.error("🔍 [GoogleLogin Debug] Thông tin hiện tại:")
      console.error(`   - Origin hiện tại: ${origin}`)
      console.error(`   - Client ID: ${GOOGLE_CLIENT_ID}`)
      console.error(`   - Expected Origins: http://localhost:3000, https://gialai-ocop-frontend-2.onrender.com`)
      console.info("💡 Hướng dẫn fix:")
      console.info("1. Vào https://console.cloud.google.com/apis/credentials")
      console.info("2. Chọn OAuth 2.0 Client ID: 658763607878-8bcd3e17rnbv0jd925skma8904nhfutt")
      console.info(`3. Kiểm tra "Authorized JavaScript origins" có "${origin}" chưa`)
      console.info(`4. Kiểm tra "Authorized redirect URIs" có "${origin}" chưa`)
      console.info("5. ⚠️ QUAN TRỌNG: Đảm bảo KHÔNG có trailing slash '/' ở cuối URI")
      console.info("6. ⚠️ QUAN TRỌNG: Đảm bảo KHÔNG có wildcard '*' ở cuối URI")
      console.info("7. Click 'SAVE' và đợi 10-15 phút để Google cập nhật")
      console.info("8. Hard refresh trình duyệt: Ctrl + Shift + R")
      console.info("9. Xóa cache và cookies cho domain này")
      console.info("10. Thử lại")
      console.info("")
      console.info("🔧 Nếu vẫn lỗi sau 15 phút:")
      console.info("   - Thử Incognito mode (Ctrl + Shift + N)")
      console.info("   - Kiểm tra FedCM: chrome://settings/content/federatedIdentityApi")
      console.info("   - Thử trình duyệt khác")
      onError?.(errorMsg + " Vui lòng xem console để biết hướng dẫn chi tiết.")
    }

    // Listen for Google SDK errors (GSI_LOGGER)
    const handleGSIError = (event: ErrorEvent) => {
      const errorMessage = event.message || event.error?.message || event.error?.toString() || ""
      const errorString = errorMessage.toString().toLowerCase()
      
      // Check for various forms of origin errors
      if (errorString.includes("origin is not allowed") ||
        errorString.includes("gsi_logger") ||
        errorString.includes("the given origin is not allowed") ||
        errorString.includes("invalid origin") ||
        errorString.includes("unauthorized origin")) {
        const currentOrigin = window.location.origin
        showOriginError(currentOrigin)
      }
    }

    // Listen for unhandled promise rejections (GSI errors can also come as promise rejections)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || ""
      const errorString = errorMessage.toString().toLowerCase()
      
      // Check for various forms of origin errors
      if (errorString.includes("origin is not allowed") ||
        errorString.includes("gsi_logger") ||
        errorString.includes("the given origin is not allowed") ||
        errorString.includes("invalid origin") ||
        errorString.includes("unauthorized origin")) {
        const currentOrigin = window.location.origin
        showOriginError(currentOrigin)
      }
    }

    // Also listen for console.error messages (GSI_LOGGER logs to console as "[GSI_LOGGER]: ...")
    const originalConsoleError = console.error
    const handleConsoleError = (...args: any[]) => {
      const errorString = args.map(arg => String(arg)).join(" ").toLowerCase()
      // Only intercept GSI_LOGGER messages to avoid interfering with other errors
      if (errorString.includes("[gsi_logger]") || 
          (errorString.includes("gsi_logger") && errorString.includes("origin is not allowed"))) {
        const currentOrigin = window.location.origin
        showOriginError(currentOrigin)
      }
      // Always call original console.error to preserve normal error logging
      originalConsoleError.apply(console, args)
    }

    window.addEventListener("error", handleGSIError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    console.error = handleConsoleError

    return () => {
      window.removeEventListener("error", handleGSIError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      console.error = originalConsoleError
    }
  }, [GOOGLE_CLIENT_ID, onError])

  // Initialize Google SDK
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return
    }

    // Check if SDK is already loaded
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
          // 🔧 Disable FedCM để tránh lỗi NetworkError
          use_fedcm_for_prompt: false,
        })
        setIsSDKLoaded(true)
      } catch (error: any) {
        console.error("❌ [GoogleLogin] Lỗi khởi tạo Google SDK:", error)
        const errorMessage = error?.message || error?.toString() || ""
        // Check for origin error
        if (errorMessage.includes("origin is not allowed") ||
          errorMessage.includes("GSI_LOGGER") ||
          errorMessage.includes("The given origin is not allowed")) {
          const currentOrigin = window.location.origin
          const errorMsg = `Origin "${currentOrigin}" chưa được cấu hình trong Google Cloud Console.`
          console.error(`❌ [GoogleLogin] ${errorMsg}`)
          console.info("💡 Hướng dẫn fix:")
          console.info("1. Vào https://console.cloud.google.com/apis/credentials")
          console.info("2. Chọn OAuth 2.0 Client ID của bạn")
          console.info(`3. Thêm "${currentOrigin}" vào "Authorized JavaScript origins"`)
          console.info(`4. Thêm "${currentOrigin}" vào "Authorized redirect URIs"`)
          console.info("5. Đợi vài phút để Google cập nhật cấu hình")
          console.info("6. Refresh trang và thử lại")
          onError?.(errorMsg + " Vui lòng xem console để biết hướng dẫn chi tiết.")
        } else {
          onError?.("Không thể khởi tạo Google login. Vui lòng thử lại sau.")
        }
      }
      return
    }

    // Load Google Identity Services script
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSuccess,
            // 🔧 Disable FedCM để tránh lỗi NetworkError
            use_fedcm_for_prompt: false,
          })
          setIsSDKLoaded(true)
        } catch (error: any) {
          console.error("❌ [GoogleLogin] Lỗi khởi tạo Google SDK:", error)
          const errorMessage = error?.message || error?.toString() || ""
          // Check for origin error
          if (errorMessage.includes("origin is not allowed") ||
            errorMessage.includes("GSI_LOGGER") ||
            errorMessage.includes("The given origin is not allowed")) {
            const currentOrigin = window.location.origin
            const errorMsg = `Origin "${currentOrigin}" chưa được cấu hình trong Google Cloud Console.`
            console.error(`❌ [GoogleLogin] ${errorMsg}`)
            console.info("💡 Hướng dẫn fix:")
            console.info("1. Vào https://console.cloud.google.com/apis/credentials")
            console.info("2. Chọn OAuth 2.0 Client ID của bạn")
            console.info(`3. Thêm "${currentOrigin}" vào "Authorized JavaScript origins"`)
            console.info(`4. Thêm "${currentOrigin}" vào "Authorized redirect URIs"`)
            console.info("5. Đợi vài phút để Google cập nhật cấu hình")
            console.info("6. Refresh trang và thử lại")
            onError?.(errorMsg + " Vui lòng xem console để biết hướng dẫn chi tiết.")
          } else {
            onError?.("Không thể khởi tạo Google login. Vui lòng thử lại sau.")
          }
        }
      } else {
        console.error("❌ [GoogleLogin] Google SDK đã load nhưng không có window.google.accounts.id")
        onError?.("Không thể khởi tạo Google login. Vui lòng thử lại sau.")
      }
    }
    script.onerror = () => {
      console.error("❌ [GoogleLogin] Không thể tải Google Identity Services SDK")
      onError?.("Không thể tải Google SDK. Vui lòng kiểm tra kết nối internet.")
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [GOOGLE_CLIENT_ID])

  // Inject CSS để đảm bảo Google button có full width
  useEffect(() => {
    const styleId = 'google-button-full-width-style'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      /* Force Google Sign-In button to full width */
      div[id*="google-signin"] {
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
      }
      div[role="button"][id*="google-signin"],
      div[role="button"][aria-label*="Sign in with Google"] {
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
      }
      /* Target Google button container */
      iframe[id*="google-signin"] {
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  // Render Google button vào div ref
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !isSDKLoaded || !buttonRef.current) return

    // Clear previous button if exists
    if (buttonRef.current.firstChild) {
      buttonRef.current.innerHTML = ''
    }

    try {
      window.google?.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: '100%',
        type: 'standard',
      })
      
      // Force full width bằng cách override CSS của Google button
      setTimeout(() => {
        if (buttonRef.current) {
          // Tìm tất cả các element có thể là Google button
          const allDivs = buttonRef.current.querySelectorAll('div')
          allDivs.forEach((div) => {
            const divElement = div as HTMLElement
            divElement.style.width = '100%'
            divElement.style.minWidth = '100%'
            divElement.style.maxWidth = '100%'
          })
          
          // Tìm iframe (Google button có thể được render trong iframe)
          const iframes = buttonRef.current.querySelectorAll('iframe')
          iframes.forEach((iframe) => {
            const iframeElement = iframe as HTMLElement
            iframeElement.style.width = '100%'
            iframeElement.style.minWidth = '100%'
            iframeElement.style.maxWidth = '100%'
          })
        }
      }, 200)
      
      console.log("✅ [GoogleLogin] Button đã được render")
    } catch (error: any) {
      console.error("❌ [GoogleLogin] Lỗi render button:", error)
    }
  }, [GOOGLE_CLIENT_ID, isSDKLoaded])

  // Button sẽ tự động trigger khi user click vào button được render bởi Google SDK
  // Không cần handleGoogleClick function vì Google SDK đã handle click event

  return (
    <div className="w-full">
      {/* 🔧 Render Google button trực tiếp để tránh FedCM issues */}
      <div 
        ref={buttonRef}
        className="w-full"
        style={{ 
          minHeight: '40px',
          width: '100%'
        }}
      />
      {!isSDKLoaded && (
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-700 rounded-lg font-semibold opacity-60 cursor-not-allowed border border-gray-300 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Đang tải Google...</span>
        </button>
      )}
      {isLoading && (
        <p className="text-center text-sm text-gray-600 mt-2 animate-pulse">Đang xử lý...</p>
      )}
    </div>
  )
}
