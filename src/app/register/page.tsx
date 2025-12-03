"use client"
import { useRouter } from "next/navigation"
import AuthLayout from "@/components/layout/AuthLayout"
import RegisterForm from "@/components/RegisterForm"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <AuthLayout
      title=""
      subtitle=""
      linkText=""
      linkAction={() => router.push('/login')}
    >
      <RegisterForm />
    </AuthLayout>
  )
}