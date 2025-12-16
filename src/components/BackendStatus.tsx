"use client"

import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '@/lib/api'

const FAILURE_THRESHOLD = 3 // Số lần fail liên tiếp trước khi hiển thị cảnh báo
const CHECK_INTERVAL = 30000 // 30 giây
const STORAGE_KEY = 'backend_status_dismissed'

export default function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [showBanner, setShowBanner] = useState(false)
  const failureCountRef = useRef(0)
  const dismissedRef = useRef(false)

  useEffect(() => {
    // Kiểm tra xem user đã đóng banner chưa
    const checkDismissed = () => {
      if (typeof window !== 'undefined') {
        const dismissed = localStorage.getItem(STORAGE_KEY)
        const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
        // Reset sau 5 phút để có thể hiển thị lại nếu backend thực sự offline
        const fiveMinutes = 5 * 60 * 1000
        if (Date.now() - dismissedTime < fiveMinutes) {
          dismissedRef.current = true
        }
      }
    }
    
    checkDismissed()

    const checkBackend = async () => {
      // Nếu đã dismissed, chỉ check nhẹ nhàng, không hiển thị banner
      if (dismissedRef.current) {
        return
      }

      try {
        // Thử check một API endpoint thực tế (nhẹ nhàng) thay vì health check
        // Health check có thể không tồn tại hoặc có vấn đề CORS
        const testUrl = `${API_BASE_URL}/products?pageSize=1`
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
        
        const response = await fetch(testUrl, {
          signal: controller.signal,
          cache: 'no-store',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok || response.status < 500) {
          // Backend đang hoạt động (200-499 là OK, 500+ là lỗi server)
          setStatus('online')
          failureCountRef.current = 0
          setShowBanner(false)
        } else {
          // Lỗi 500+ - có thể là backend đang có vấn đề
          failureCountRef.current++
          if (failureCountRef.current >= FAILURE_THRESHOLD) {
            setStatus('offline')
            setShowBanner(true)
          }
        }
      } catch (error) {
        // Network error - có thể backend đang offline
        failureCountRef.current++
        if (failureCountRef.current >= FAILURE_THRESHOLD) {
          setStatus('offline')
          setShowBanner(true)
        }
      }
    }

    // Đợi 2 giây trước khi check lần đầu (để page load xong)
    const initialTimeout = setTimeout(() => {
      checkBackend()
    }, 2000)
    
    // Recheck every 30 seconds
    const interval = setInterval(checkBackend, CHECK_INTERVAL)
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const handleDismiss = () => {
    setShowBanner(false)
    dismissedRef.current = true
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Backend đang khởi động...
            </p>
            <p className="mt-1 text-sm text-yellow-700">
              Render free tier sleep sau 15 phút không hoạt động. Đợi 30-60 giây để backend wake up.
            </p>
            <div className="mt-2 text-xs text-yellow-600">
              <p>💡 Backend URL: {API_BASE_URL.replace('/api', '')}</p>
              <p className="mt-1">💡 Health check: {API_BASE_URL.replace('/api', '')}/health</p>
            </div>
          </div>
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

