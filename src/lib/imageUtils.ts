/**
 * Image URL validation and utility functions
 */

/**
 * Kiểm tra xem URL ảnh có hợp lệ không (không phải placeholder)
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false
  }

  const trimmedUrl = url.trim().toLowerCase()

  // Các URL placeholder không hợp lệ
  const invalidPatterns = [
    'example.com',
    'placeholder',
    'default',
    'null',
    'undefined',
  ]

  // Kiểm tra nếu URL chỉ là protocol mà không có domain
  if (trimmedUrl === 'http://' || trimmedUrl === 'https://') {
    return false
  }

  // Kiểm tra các pattern không hợp lệ
  for (const pattern of invalidPatterns) {
    if (trimmedUrl.includes(pattern) && trimmedUrl.length < 50) {
      // Nếu URL ngắn và chứa pattern không hợp lệ, có thể là placeholder
      return false
    }
  }

  // URL hợp lệ nếu:
  // 1. Bắt đầu bằng / (local path từ public folder)
  // 2. Bắt đầu bằng http:// hoặc https:// (remote URL)
  return trimmedUrl.startsWith('/') || trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')
}

/**
 * Lấy URL ảnh hợp lệ hoặc fallback
 */
export function getImageUrl(
  url: string | null | undefined,
  fallback?: string
): string {
  if (isValidImageUrl(url)) {
    return url!
  }
  return fallback || '/hero.jpg'
}

/**
 * Kiểm tra xem URL có phải là Cloudinary URL không
 */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  return url.includes('res.cloudinary.com')
}

/**
 * Kiểm tra xem URL có phải là backend URL không
 */
export function isBackendUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  return (
    url.includes('gialai-ocop-be.onrender.com') ||
    url.includes('localhost')
  )
}

/**
 * Kiểm tra xem URL có cần các thuộc tính đặc biệt để tránh tracking prevention warnings không
 */
export function needsSpecialAttributes(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  return isCloudinaryUrl(url) || isBackendUrl(url)
}

/**
 * Lấy các thuộc tính cần thiết cho Image component để giảm tracking prevention warnings
 * Luôn dùng unoptimized cho Cloudinary để tránh timeout
 */
export function getImageAttributes(url: string | null | undefined): {
  unoptimized?: boolean
  crossOrigin?: 'anonymous' | 'use-credentials'
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url'
  loading?: 'lazy' | 'eager'
} {
  // Luôn dùng unoptimized cho Cloudinary để tránh timeout
  if (isCloudinaryUrl(url)) {
    return {
      unoptimized: true,
      crossOrigin: 'anonymous',
      referrerPolicy: 'no-referrer',
      loading: 'lazy', // Lazy load để giảm tải
    }
  }

  if (isBackendUrl(url)) {
    return {
      unoptimized: true,
      crossOrigin: 'anonymous',
      referrerPolicy: 'no-referrer',
    }
  }

  return {}
}

