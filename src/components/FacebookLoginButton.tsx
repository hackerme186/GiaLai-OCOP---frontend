"use client"
import { useState, useEffect } from "react"
import { loginWithFacebook } from "@/lib/api"
import { setAuthToken, getRoleFromToken, setUserProfile } from "@/lib/auth"
import { getCurrentUser } from "@/lib/api"
import { useRouter } from "next/navigation"
import { getUserFriendlyError } from "@/lib/errorHandler"

// Facebook SDK types
declare global {
  interface Window {
    FB?: {
      init: (config: { appId: string; version: string; cookie?: boolean; xfbml?: boolean }) => void
      login: (callback: (response: any) => void, options?: { scope?: string }) => void
      getLoginStatus: (callback: (response: any) => void) => void
    }
    fbAsyncInit?: () => void
  }
}

interface FacebookLoginButtonProps {
  onError?: (error: string) => void
}

export default function FacebookLoginButton({ onError }: FacebookLoginButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [isHttps, setIsHttps] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState<string>("")
  const [isRedirecting, setIsRedirecting] = useState(false)
  const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""

  // Check HTTPS on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocalhost = window.location.hostname === "localhost" || 
                         window.location.hostname === "127.0.0.1" ||
                         window.location.hostname.startsWith("192.168.") ||
                         window.location.hostname.startsWith("10.")
      
      const requiresHttps = window.location.protocol !== "https:" && !isLocalhost
      setIsHttps(!requiresHttps)

      if (requiresHttps) {
        console.warn("⚠️ [FacebookLogin] Facebook login yêu cầu HTTPS. Trang hiện tại đang sử dụng HTTP.")
        onError?.("Facebook login yêu cầu HTTPS. Vui lòng truy cập qua HTTPS hoặc sử dụng localhost.")
      }
    }
  }, [onError])

  // Load Facebook SDK
  useEffect(() => {
    if (!FACEBOOK_APP_ID) {
      console.warn("⚠️ [FacebookLogin] NEXT_PUBLIC_FACEBOOK_APP_ID chưa được cấu hình")
      return
    }

    // Check if SDK is already loaded
    if (window.FB) {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        version: "v18.0",
        cookie: true,
        xfbml: true,
      })
      setIsSDKLoaded(true)
      return
    }

    // Load Facebook SDK script
    window.fbAsyncInit = () => {
      if (window.FB) {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          version: "v18.0",
          cookie: true,
          xfbml: true,
        })
        setIsSDKLoaded(true)
      }
    }

    // Inject Facebook SDK script
    const script = document.createElement("script")
    script.src = "https://connect.facebook.net/en_US/sdk.js"
    script.async = true
    script.defer = true
    script.crossOrigin = "anonymous"
    document.body.appendChild(script)

    return () => {
      // Cleanup if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [FACEBOOK_APP_ID])

  if (!FACEBOOK_APP_ID) {
    return null
  }

  const handleFacebookClick = () => {
    if (!window.FB) {
      console.error("❌ [FacebookLogin] Facebook SDK chưa được tải")
      onError?.("Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau.")
      return
    }

    // Double-check HTTPS (Facebook requires HTTPS except for localhost)
    if (typeof window !== "undefined") {
      const isLocalhost = window.location.hostname === "localhost" || 
                         window.location.hostname === "127.0.0.1" ||
                         window.location.hostname.startsWith("192.168.") ||
                         window.location.hostname.startsWith("10.")
      
      if (window.location.protocol !== "https:" && !isLocalhost) {
        const errorMsg = "Facebook login yêu cầu HTTPS. Vui lòng truy cập qua HTTPS hoặc sử dụng localhost."
        console.error(`❌ [FacebookLogin] ${errorMsg}`)
        console.info("💡 Hướng dẫn:")
        console.info("1. Sử dụng localhost để test (http://localhost:3000)")
        console.info("2. Hoặc deploy lên hosting hỗ trợ HTTPS (Vercel, Netlify, etc.)")
        console.info("3. Hoặc sử dụng ngrok hoặc Cloudflare Tunnel để tạo HTTPS tunnel")
        onError?.(errorMsg)
        return
      }
    }

    setIsLoading(true)
    setLoadingMessage("Đang kết nối với Facebook...")
    console.log("🔐 [FacebookLogin] Bắt đầu đăng nhập với Facebook...")

    try {
      window.FB.login(
        (response: any) => {
          if (response.authResponse && response.authResponse.accessToken) {
            // Call async function without await (it will handle its own errors)
            handleFacebookResponse(response.authResponse.accessToken).catch((err) => {
              console.error("❌ [FacebookLogin] Error in handleFacebookResponse:", err)
              setIsLoading(false)
              setLoadingMessage("")
              setIsRedirecting(false)
            })
          } else {
            console.log("❌ [FacebookLogin] User cancelled login or did not fully authorize")
            setIsLoading(false)
            setLoadingMessage("")
            // User-friendly message for cancelled login
            onError?.("Đăng nhập Facebook đã bị hủy. Vui lòng thử lại nếu muốn tiếp tục.")
          }
        },
        { scope: "email,public_profile" }
      )
    } catch (error: any) {
      console.error("❌ [FacebookLogin] Error calling FB.login:", error)
      const errorMsg = error?.message || "Không thể khởi động Facebook login"
      
      // Check for HTTPS error
      if (errorMsg.includes("http pages") || errorMsg.includes("HTTPS")) {
        const detailedMsg = "Facebook login yêu cầu HTTPS. Vui lòng truy cập qua HTTPS hoặc sử dụng localhost."
        console.error(`❌ [FacebookLogin] ${detailedMsg}`)
        console.info("💡 Hướng dẫn:")
        console.info("1. Sử dụng localhost để test (http://localhost:3000)")
        console.info("2. Hoặc deploy lên hosting hỗ trợ HTTPS (Vercel, Netlify, etc.)")
        console.info("3. Hoặc sử dụng ngrok hoặc Cloudflare Tunnel để tạo HTTPS tunnel")
        onError?.(detailedMsg)
      } else {
        onError?.(errorMsg)
      }
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const handleFacebookResponse = async (accessToken: string) => {
    console.log("🔐 [FacebookLogin] Nhận được accessToken từ Facebook")
    console.log("📤 [FacebookLogin] AccessToken length:", accessToken.length)
    console.log("📤 [FacebookLogin] AccessToken preview:", accessToken.substring(0, 20) + "...")

    try {
      setLoadingMessage("Đang xác thực với server...")
      console.log("📤 [FacebookLogin] Gửi accessToken lên backend...")

      const res = await loginWithFacebook({ accessToken }) as any
      console.log("📥 [FacebookLogin] Response từ API:", res)
      console.log("📥 [FacebookLogin] Full response (JSON):", JSON.stringify(res, null, 2))

      // Extract token với nhiều format khác nhau
      const token = res?.token || res?.Token || res?.data?.token || res?.data?.Token
      console.log("🔑 [FacebookLogin] Token extracted:", token ? `${token.substring(0, 20)}...` : "NULL")
      console.log("🔑 [FacebookLogin] Response keys:", Object.keys(res || {}))

      if (!token) {
        console.error("❌ [FacebookLogin] Không tìm thấy token trong response")
        console.error("❌ [FacebookLogin] Response structure:", {
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
      console.log("💾 [FacebookLogin] Lưu token vào localStorage...")
      setAuthToken(token)

      // Verify token đã được lưu
      const savedToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      console.log("✅ [FacebookLogin] Token đã được lưu:", savedToken ? "YES" : "NO")
      if (savedToken) {
        console.log("✅ [FacebookLogin] Saved token preview:", savedToken.substring(0, 20) + "...")
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
      console.log("👤 [FacebookLogin] Role từ token:", role || "NOT FOUND")

      // If still no role, try to get from /me endpoint
      if (!role || role.trim() === "") {
        console.log("👤 [FacebookLogin] Role không tìm thấy, đang gọi /me endpoint...")
        try {
          const me = await getCurrentUser()
          console.log("👤 [FacebookLogin] User info từ /me:", me)
          role = extractRole(me) || (me.role || (me as any).roles)?.toString?.() || ""
          console.log("👤 [FacebookLogin] Role từ /me:", role || "NOT FOUND")
        } catch (err) {
          console.warn("⚠️ [FacebookLogin] Could not fetch user info:", err)
        }
      }

      // Normalize role
      const norm = role.toString().toLowerCase().trim()
      console.log("👤 [FacebookLogin] Normalized role:", norm)

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
        console.log("👤 [FacebookLogin] Đang lấy user profile...")
        const profile = await getCurrentUser()
        console.log("👤 [FacebookLogin] User profile:", profile)
        setUserProfile({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          enterpriseId: profile.enterpriseId ?? undefined,
          createdAt: profile.createdAt,
        })
        console.log("✅ [FacebookLogin] User profile đã được lưu")
      } catch (profileErr) {
        console.warn("⚠️ [FacebookLogin] Could not load user profile:", profileErr)
      }

      // Redirect based on role
      setIsRedirecting(true)
      setLoadingMessage("Đăng nhập thành công! Đang chuyển hướng...")
      console.log("🔀 [FacebookLogin] Đang redirect...")
      
      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (isSystemAdmin || isAdmin) {
        console.log("🔀 [FacebookLogin] Redirecting to /admin")
        router.replace("/admin")
      } else if (isEnterpriseAdmin) {
        console.log("🔀 [FacebookLogin] Redirecting to /enterprise-admin")
        router.replace("/enterprise-admin")
      } else {
        console.log("🔀 [FacebookLogin] Redirecting to /home")
        router.replace("/home")
      }

      console.log("✅ [FacebookLogin] Đăng nhập thành công!")
    } catch (err) {
      console.error("❌ [FacebookLogin] Lỗi đăng nhập:", err)
      
      // Log chi tiết error
      if (err instanceof Error) {
        console.error("❌ [FacebookLogin] Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
          cause: (err as any).cause
        })
      } else {
        console.error("❌ [FacebookLogin] Error object:", err)
      }
      
      // Chuyển đổi error thành thông báo dễ hiểu cho người dùng
      const errorMessage = getUserFriendlyError(err)
      
      setLoadingMessage("")
      setIsRedirecting(false)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
      if (!isRedirecting) {
        setLoadingMessage("")
      }
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleFacebookClick}
        disabled={isLoading || !isSDKLoaded || !isHttps}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed border border-blue-700 shadow-sm hover:shadow-md relative"
        title={!isHttps ? "Facebook login yêu cầu HTTPS. Vui lòng truy cập qua HTTPS hoặc sử dụng localhost." : undefined}
      >
        {isLoading && (
          <svg
            className="animate-spin h-5 w-5 text-white absolute left-4"
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
        )}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`flex-shrink-0 ${isLoading ? 'opacity-50' : ''}`}
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span className={isLoading ? 'opacity-50' : ''}>
          {isRedirecting ? 'Đang chuyển hướng...' : isLoading ? 'Đang xử lý...' : 'Facebook'}
        </span>
      </button>
      {loadingMessage && (
        <p className="text-center text-sm text-blue-100 mt-2 animate-pulse">
          {loadingMessage}
        </p>
      )}
      {!isSDKLoaded && FACEBOOK_APP_ID && (
        <p className="text-center text-xs text-yellow-300 mt-1">
          Đang tải Facebook SDK...
        </p>
      )}
    </div>
  )
}

