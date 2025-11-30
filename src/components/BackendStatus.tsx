"use client"

import { useState, useEffect } from 'react'
import { API_BASE_URL } from '@/lib/api'

export default function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const checkBackend = async () => {
      try {
        // Try to fetch from backend with longer timeout for Render cold start
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout for cold start
        
        const response = await fetch(`${API_BASE_URL}/products?pageSize=1`, {
          signal: controller.signal,
          cache: 'no-store'
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          setStatus('online')
          setShowBanner(false)
        } else {
          setStatus('offline')
          setShowBanner(true)
        }
      } catch (error) {
        setStatus('offline')
        setShowBanner(true)
      }
    }

    checkBackend()
    
    // Recheck every 30 seconds
    const interval = setInterval(checkBackend, 30000)
    
    return () => clearInterval(interval)
  }, [])

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
              <p>💡 Hoặc chạy local backend:</p>
              <code className="block mt-1 bg-yellow-100 px-2 py-1 rounded">
                cd E:\SE18\SEP\GiaLai-OCOP-BE && dotnet run
              </code>
            </div>
          </div>
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={() => setShowBanner(false)}
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

