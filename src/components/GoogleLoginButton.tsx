"use client"
import { useState, useEffect, useRef } from "react"
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
      
      // Chuyển đổi error thành thông báo dễ hiểu cho người dùng
      const errorMessage = getUserFriendlyError(err)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load and initialize Google Identity Services SDK
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn("⚠️ [GoogleLogin] NEXT_PUBLIC_GOOGLE_CLIENT_ID chưa được cấu hình")
      return
    }

    if (!buttonRef.current) {
      return
    }

    // Check if SDK is already loaded
    if (window.google?.accounts?.id) {
      try {
        // Initialize Google SDK
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        })
        
        // Render Google button
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          width: "100%",
          type: "standard",
        })
      } catch (error: any) {
        console.error("❌ [GoogleLogin] Lỗi khởi tạo Google SDK:", error)
        onError?.("Không thể khởi tạo Google login. Vui lòng thử lại sau.")
      }
      return
    }

    // Load Google Identity Services script
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        try {
          // Initialize Google SDK
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSuccess,
          })
          
          // Render Google button
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            width: "100%",
            type: "standard",
          })
        } catch (error: any) {
          console.error("❌ [GoogleLogin] Lỗi khởi tạo Google SDK:", error)
          onError?.("Không thể khởi tạo Google login. Vui lòng thử lại sau.")
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
  }, [GOOGLE_CLIENT_ID, onError])

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full"></div>
      {isLoading && (
        <p className="text-center text-xs text-gray-600 mt-2">
          Đang xử lý đăng nhập...
        </p>
      )}
    </div>
  )
}
