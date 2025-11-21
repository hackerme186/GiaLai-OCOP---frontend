"use client"

import React from "react"
import { SessionProvider } from "next-auth/react"
import { CartProvider } from "@/lib/cart-context"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - data is fresh for 30s
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnReconnect: true, // Refetch on reconnect
      retry: 2, // Retry failed requests 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
})

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}


