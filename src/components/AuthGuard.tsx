"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isLoggedIn } from "@/lib/auth"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isLoggedIn()) {
      router.replace("/login")
    }
  }, [router])

  if (!mounted) return null
  if (!isLoggedIn()) return null
  return <>{children}</>
}


