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
      {/* Fantasy Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-700">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url('/hero.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Fantasy Overlay Effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-amber-500/20" />
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-orange-600/10" />
        
        {/* Animated Fireflies / Magical Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-yellow-300/60 blur-sm animate-pulse"
              style={getParticleStyle(i)}
            />
          ))}
        </div>
      </div>

      {/* Glassmorphism Login Form Container */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div 
          className="backdrop-blur-xl bg-white/15 rounded-3xl border border-white/30 shadow-2xl p-8 md:p-10"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          }}
        >
          {children}
        </div>
      </div>
    </main>
  )
}
