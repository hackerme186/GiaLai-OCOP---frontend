"use client"

export default function SocialLogin() {
  return (
    <>
      <div className="relative my-6 text-center text-sm text-gray-500">
        <span className="relative bg-white px-2">or continue with</span>
        <div className="absolute inset-0 top-1/2 -z-10 border-t" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Google
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Facebook
        </button>
      </div>
    </>
  )
}
