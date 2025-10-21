"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { isLoggedIn } from "@/lib/auth"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkAuth = async () => {
      const authStatus = await isLoggedIn()
      setIsAuthenticated(authStatus)
      if (!authStatus && status !== "loading") {
        router.replace("/login")
      }
    }
    
    if (status === "authenticated") {
      setIsAuthenticated(true)
    } else if (status === "unauthenticated") {
      checkAuth()
    }
  }, [router, status, session])

  if (!mounted || status === "loading") return null
  if (!isAuthenticated) return null
  return <>{children}</>
}


