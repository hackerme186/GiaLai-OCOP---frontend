"use client"
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  sizes?: string
  fill?: boolean
  quality?: number
  placeholder?: "blur" | "empty"
  onLoad?: () => void
}

const ImageOptimizer = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className = "",
  sizes = "100vw",
  fill = false,
  quality = 75,
  placeholder = "empty",
  onLoad
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={`relative ${className} ${isLoading ? 'animate-pulse bg-gray-200' : ''}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`duration-700 ease-in-out ${
          isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'
        }`}
        sizes={sizes}
        fill={fill}
        quality={quality}
        placeholder={placeholder}
        onLoadingComplete={() => {
          setIsLoading(false)
          onLoad?.()
        }}
      />
    </div>
  )
}

export default ImageOptimizer

