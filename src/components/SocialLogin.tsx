"use client"

import { signIn } from "next-auth/react"
import Image from "next/image"
import { useState } from "react"

export default function SocialLogin() {
  const [googleImageError, setGoogleImageError] = useState(false)
  const [facebookImageError, setFacebookImageError] = useState(false)

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/home" })
  }

  const handleFacebookLogin = () => {
    // Facebook login functionality can be added here
    console.log("Facebook login clicked")
  }

  return (
    <>
      <div className="relative my-6 text-center text-sm text-gray-500">
        <span className="relative bg-white px-2">hoặc đăng nhập bằng</span>
        <div className="absolute inset-0 top-1/2 -z-10 border-t" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          {!googleImageError ? (
            <Image
              src="/Google_logo.svg"
              alt="Google"
              width={20}
              height={20}
              className="mr-2"
              onError={() => setGoogleImageError(true)}
            />
          ) : (
            <div className="mr-2 w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
              G
            </div>
          )}
          Google
        </button>
        <button
          type="button"
          onClick={handleFacebookLogin}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          {!facebookImageError ? (
            <Image
              src="/Facebook_icon.svg"
              alt="Facebook"
              width={20}
              height={20}
              className="mr-2"
              onError={() => setFacebookImageError(true)}
            />
          ) : (
            <div className="mr-2 w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
              f
            </div>
          )}
          Facebook
        </button>
      </div>
    </>
  )
}