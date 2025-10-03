"use client"
import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  className?: string
}

export default function AuthCard({ children, className }: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  )
}