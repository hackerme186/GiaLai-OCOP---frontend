"use client"

import { useState } from "react"
import Link from "next/link"
import AuthGuard from "@/components/AuthGuard"
import OCOPForm from "@/components/OCOPForm"
import { CreateEnterpriseApplicationDto, createEnterpriseApplication } from "@/lib/api"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

export default function OCOPSRegisterPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: CreateEnterpriseApplicationDto) => {
    try {
      setSubmitting(true)
      setError(null)
      await createEnterpriseApplication(formData)
      setSubmitted(true)
    } catch (error) {
      console.error("❌ Lỗi khi gửi đăng ký OCOP:", error)
      
      // Parse error message to extract validation errors
      let errorMessage = "Đã xảy ra lỗi khi gửi đăng ký"
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Check if error message contains validation errors (400 with JSON)
        if (errorMessage.includes("400")) {
          // Try to parse validation errors from error message
          try {
            // Extract JSON from error message if it contains validation errors
            const jsonMatch = errorMessage.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const errorData = JSON.parse(jsonMatch[0])
              if (errorData.errors && typeof errorData.errors === 'object') {
                // Build a user-friendly error message from validation errors
                const validationErrors: string[] = []
                Object.keys(errorData.errors).forEach((field) => {
                  const fieldErrors = errorData.errors[field]
                  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
                    validationErrors.push(...fieldErrors)
                  }
                })
                
                if (validationErrors.length > 0) {
                  errorMessage = "⚠️ Vui lòng kiểm tra lại các thông tin sau:\n\n" + validationErrors.join("\n")
                } else {
                  errorMessage = "⚠️ Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập."
                }
              } else {
                errorMessage = "⚠️ Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập."
              }
            } else {
              errorMessage = "⚠️ Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập."
            }
          } catch (parseError) {
            // If parsing fails, use generic error message
            errorMessage = "⚠️ Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập."
          }
        } else if (errorMessage.includes("EmailContact")) {
          errorMessage = "⚠️ Email liên hệ không đúng định dạng. Vui lòng nhập email hợp lệ (ví dụ: contact@company.com)"
        }
      }
      
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <Header />
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
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-center font-medium"
              >
                Trở về trang chủ
              </Link>
              <button
                onClick={() => setSubmitted(false)}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Gửi hồ sơ khác
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Đăng ký OCOP
              </h1>
              <p className="text-gray-600">
                Vui lòng điền đầy đủ thông tin để đăng ký OCOP của bạn
              </p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}
            <div className={submitting ? 'pointer-events-none' : ''}>
              <div className={submitting ? 'opacity-75' : ''}>
                <OCOPForm onSubmit={handleSubmit} />
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </AuthGuard>
  )
}
