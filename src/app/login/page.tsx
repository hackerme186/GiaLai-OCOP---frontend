"use client"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/layout/AuthLayout"
import LoginForm from "@/components/LoginForm"

export default function LoginPage() {
  const router = useRouter()

  return (
    <AuthLayout
      title="Login"
      subtitle=""
      linkText=""
      linkAction={() => router.push('/register')}
    >
      <LoginForm />
    </AuthLayout>
  )
}