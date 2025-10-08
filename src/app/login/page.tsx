"use client"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/layout/AuthLayout"
import LoginForm from "@/components/LoginForm"

export default function LoginPage() {
  const router = useRouter()

  return (
    <AuthLayout
      title="Chào mừng đến OCOP-Gia Lai"
      subtitle="Đăng nhập để tiếp tục"
      linkText="Bạn chưa có tài khoản? Tạo tài khoản"
      linkAction={() => router.push('/register')}
    >
      <LoginForm />
    </AuthLayout>
  )
}