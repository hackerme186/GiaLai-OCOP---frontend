"use client"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/layout/AuthLayout"
import RegisterForm from "@/components/RegisterForm"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <AuthLayout
      title="Tạo tài khoản OCOP-Gia Lai"
      subtitle="Đăng ký để trải nghiệm"
      linkText="Bạn đã có tài khoản? Đăng nhập"
      linkAction={() => router.push('/login')}
    >
      <RegisterForm />
    </AuthLayout>
  )
}