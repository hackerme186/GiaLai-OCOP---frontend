"use client"

import { useState } from "react"
import AuthGuard from "@/components/AuthGuard"
import OCOPForm from "@/components/OCOPForm"
import { OcopRegistrationDto, submitOcopRegistration } from "@/lib/api"

export default function OCOPSRegisterPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: OcopRegistrationDto) => {
    try {
      setSubmitting(true)
      setError(null)
      await submitOcopRegistration(formData)
      setSubmitted(true)
    } catch (error) {
      console.error("Error submitting OCOP registration:", error)
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      {submitted ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h2>
            <p className="text-gray-600 mb-6">
              Hồ sơ đăng ký OCOP của bạn đã được gửi. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Gửi hồ sơ khác
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Đăng ký sản phẩm OCOP
              </h1>
              <p className="text-gray-600">
                Vui lòng điền đầy đủ thông tin để đăng ký sản phẩm OCOP của bạn
              </p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}
            <div className={submitting ? 'opacity-75 pointer-events-none' : ''}>
              <OCOPForm onSubmit={handleSubmit} />
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}
