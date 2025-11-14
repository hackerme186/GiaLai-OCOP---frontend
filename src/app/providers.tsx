"use client"

import React from "react"
import { SessionProvider } from "next-auth/react"
import { CartProvider } from "@/lib/cart-context"

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <CartProvider>
        {children}
      </CartProvider>
    </SessionProvider>
  )
}


