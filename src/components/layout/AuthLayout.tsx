"use client"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  linkText: string
  linkAction: () => void
}

// Hàm tạo giá trị "ngẫu nhiên" nhưng deterministic dựa trên seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Làm tròn số với độ chính xác cố định để tránh hydration mismatch
function roundToFixed(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

// Tạo style cho mỗi particle dựa trên index (deterministic)
function getParticleStyle(index: number) {
  const seed = index * 123.456 // Seed cố định cho mỗi index
  
  // Tính toán các giá trị và làm tròn để đảm bảo nhất quán
  const width = seededRandom(seed) * 4 + 2
  const height = seededRandom(seed + 1) * 4 + 2
  const left = seededRandom(seed + 2) * 100
  const top = seededRandom(seed + 3) * 100
  const animationDelay = seededRandom(seed + 4) * 3
  const animationDuration = seededRandom(seed + 5) * 2 + 2
  
  return {
    width: `${roundToFixed(width, 2)}px`,
    height: `${roundToFixed(height, 2)}px`,
    left: `${roundToFixed(left, 2)}%`,
    top: `${roundToFixed(top, 2)}%`,
    animationDelay: `${roundToFixed(animationDelay, 2)}s`,
    animationDuration: `${roundToFixed(animationDuration, 2)}s`,
  }
}

export default function AuthLayout({ 
  children, 
  title,
  subtitle,
  linkText,
  linkAction
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Misty Mountain Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Background Image Overlay - Less Blur to Show More Detail */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/hero.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(3px) brightness(0.5) contrast(1.1)',
          }}
        />
        
        {/* Dark Misty Overlay Effects - More Transparent */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-gray-900/40 to-gray-800/30" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-purple-950/15" />
        
        {/* Very Subtle Mist Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5 blur-xl animate-pulse"
              style={getParticleStyle(i)}
            />
          ))}
        </div>
      </div>

      {/* Login Form - Directly on Background (No Container) */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {children}
      </div>
    </main>
  )
}
