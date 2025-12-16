"use client"
import Image from "next/image"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ 
  children
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background Image - Blurred Green Field */}
      <div className="absolute inset-0">
        <Image
          src="/hero.jpg"
          alt="Background"
          fill
          className="object-cover blur-sm"
          priority
          quality={90}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
      </div>
      
      {/* Faint hexagons and circles on the left side */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Hexagons */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`hex-${i}`}
            className="absolute opacity-10"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + i * 25}%`,
              width: '80px',
              height: '80px',
              background: 'white',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
          />
        ))}
        {/* Circles */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className="absolute rounded-full bg-white/10"
            style={{
              left: `${5 + i * 12}%`,
              top: `${30 + i * 20}%`,
              width: `${60 + i * 20}px`,
              height: `${60 + i * 20}px`,
            }}
          />
        ))}
      </div>

      {/* Login Form Content - Directly on background */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {children}
      </div>
    </main>
  )
}
