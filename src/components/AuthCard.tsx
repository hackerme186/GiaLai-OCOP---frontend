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
        "mx-auto w-full max-w-md rounded-2xl border-2 border-gray-300 bg-white/95 backdrop-blur-sm p-8 shadow-2xl",
        className
      )}
    >
      {children}
    </div>
  )
}