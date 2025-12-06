"use client"
import { useState, useEffect } from "react"
import { loginWithFacebook } from "@/lib/api"
import { setAuthToken, getRoleFromToken, setUserProfile } from "@/lib/auth"
import { getCurrentUser } from "@/lib/api"
import { useRouter } from "next/navigation"

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
  const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""

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



  const handleFacebookResponse = async (response: any) => {
    if (!response.accessToken) {
      console.log("❌ [FacebookLogin] User cancelled login or did not fully authorize")

      return
    }

    setIsLoading(true)
    console.log("🔐 [FacebookLogin] Bắt đầu đăng nhập với Facebook...")

    window.FB.login(
      async (response: any) => {
        if (response.authResponse && response.authResponse.accessToken) {
          await handleFacebookResponse(response.authResponse.accessToken)
        } else {
          console.log("❌ [FacebookLogin] User cancelled login or did not fully authorize")
          setIsLoading(false)
        }
      },
      { scope: "email,public_profile" }
    )
  }

  const handleFacebookResponse = async (accessToken: string) => {
    console.log("🔐 [FacebookLogin] Nhận được accessToken từ Facebook")

    try {
      console.log("📤 [FacebookLogin] Gửi accessToken lên backend...")

      const res = await loginWithFacebook({ accessToken }) as any
      console.log("📥 [FacebookLogin] Response từ API:", res)

      // Extract token
      const token = res?.token || res?.Token || res?.data?.token || res?.data?.Token
      console.log("🔑 [FacebookLogin] Token extracted:", token ? `${token.substring(0, 20)}...` : "NULL")

      if (!token) {
        console.error("❌ [FacebookLogin] Không tìm thấy token trong response")
        throw new Error("Không nhận được token từ server. Vui lòng thử lại.")
      }

      // Save token
      console.log("💾 [FacebookLogin] Lưu token vào localStorage...")
      setAuthToken(token)

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
      console.log("🔀 [FacebookLogin] Đang redirect...")
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
      const errorMessage = err instanceof Error ? err.message : "Đăng nhập Facebook thất bại. Vui lòng thử lại."
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleFacebookClick}
        disabled={isLoading || !isSDKLoaded}
        className="facebook-login-button"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="flex-shrink-0"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span>Facebook</span>
      </button>
      {isLoading && (
        <p className="text-center text-sm text-white/90 mt-2">Đang xử lý...</p>
      )}
      <style jsx global>{`
        .facebook-login-button {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 10px !important;
          padding: 14px 16px !important;
          min-height: 48px !important;
          height: 48px !important;
          max-height: 48px !important;
          border-radius: 0.5rem !important;
          border: none !important;
          background: #1877f2 !important;
          color: white !important;
          font-weight: 600 !important;
          font-size: 15px !important;
          cursor: pointer !important;
          box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3) !important;
          transition: all 0.2s ease !important;
          box-sizing: border-box !important;
        }
        .facebook-login-button:hover:not(:disabled) {
          background-color: #166fe5 !important;
          box-shadow: 0 6px 16px rgba(24, 119, 242, 0.4) !important;
          transform: translateY(-1px) !important;
        }
        .facebook-login-button:active:not(:disabled) {
          transform: translateY(0) !important;
        }
        .facebook-login-button:disabled {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
        }
        .facebook-login-button:focus {
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(24, 119, 242, 0.3) !important;
        }
        .facebook-login-button svg,
        .facebook-login-button .fa-facebook {
          flex-shrink: 0 !important;
          width: 20px !important;
          height: 20px !important;
        }
      `}</style>
    </div>
  )
}

