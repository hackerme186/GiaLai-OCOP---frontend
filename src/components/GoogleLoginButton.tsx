"use client"
import { useState, useEffect, useRef, useCallback } from "react"
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
          initialize: (config: { client_id: string; callback: (response: any) => void }) => void
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

  const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
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

      const res = await loginWithGoogle({ idToken }) as any
      console.log("📥 [GoogleLogin] Response từ API:", res)

      // Extract token
      const token = res?.token || res?.Token || res?.data?.token || res?.data?.Token
      console.log("🔑 [GoogleLogin] Token extracted:", token ? `${token.substring(0, 20)}...` : "NULL")

      if (!token) {
        console.error("❌ [GoogleLogin] Không tìm thấy token trong response")
        throw new Error("Không nhận được token từ server. Vui lòng thử lại.")
      }

      // Save token
      console.log("💾 [GoogleLogin] Lưu token vào localStorage...")
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
      const errorMessage = err instanceof Error ? err.message : "Đăng nhập Google thất bại. Vui lòng thử lại."
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [router, onError])

  // Load Google Identity Services SDK
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn("⚠️ [GoogleLogin] NEXT_PUBLIC_GOOGLE_CLIENT_ID chưa được cấu hình")
      return
    }

    // Check if SDK is already loaded
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSuccess,
      })
      setIsSDKLoaded(true)
      return
    }

    // Load Google Identity Services script
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        })
        setIsSDKLoaded(true)
      }
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [GOOGLE_CLIENT_ID, handleGoogleSuccess])

  // Render Google button when SDK is loaded
  useEffect(() => {
    if (isSDKLoaded && buttonRef.current && window.google?.accounts?.id) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: "100%",
        type: "standard",
      })
    }
  }, [isSDKLoaded])

  if (!GOOGLE_CLIENT_ID) {
    return null
  }

  return (
    <div className="w-full">
      <div 
        ref={buttonRef}
        className={`google-login-wrapper ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
        style={{
          minHeight: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
      {isLoading && (
        <p className="text-center text-sm text-white/80 mt-2 animate-pulse">Đang xử lý...</p>
      )}
      <style jsx global>{`
        .google-login-wrapper {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }
        .google-login-wrapper > div {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }
        .google-login-wrapper iframe {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }
      `}</style>
    </div>
  )
}


