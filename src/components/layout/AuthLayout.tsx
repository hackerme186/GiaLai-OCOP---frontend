"use client"
import Image from "next/image"
import AuthCard from "@/components/AuthCard"
import SocialLogin from "@/components/SocialLogin"
import { useRouter } from "next/navigation"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  linkText: string
  linkAction: () => void
}

export default function AuthLayout({ 
  children, 
  title,
  subtitle,
  linkText,
  linkAction
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen grid lg:grid-cols-3 grid-rows-2 lg:grid-rows-1 bg-gray-50">
      <div className="relative row-span-1 lg:col-span-2 h-64 lg:h-full overflow-hidden">
        <Image
          src="/hero.jpg" 
          alt="Hero"
          fill
          priority
          className="object-cover object-right"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="row-span-1 lg:col-span-1 flex items-center justify-center px-4 py-10">
        <AuthCard>
          <h2 className="text-center text-2xl font-bold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {subtitle}
          </p>

          <div className="h-4" />
          <div className="h-4" />

          {children}

          <SocialLogin />

          <p className="mt-6 text-center text-sm text-gray-600">
            <button
              type="button"
              onClick={linkAction}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {linkText}
            </button>
          </p>

          <p className="mt-4 text-center text-xs text-gray-500">
            Bằng cách tiếp tục, bạn đồng ý với chúng tôi{" "}
            <br />
            <a href="#" className="text-indigo-600 hover:underline">
              Điều khoản và điều kiện
            </a>{" "}
            và{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Quyền riêng tư
            </a>
            .
          </p>
        </AuthCard>
      </div>
    </main>
  )
}
