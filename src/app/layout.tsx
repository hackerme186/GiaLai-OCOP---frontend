import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
// import BackendStatus from "@/components/BackendStatus"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "OCOP Gia Lai",
  description: "Sàn thương mại điện tử sản phẩm OCOP Gia Lai",
}

// RootLayout chỉ nhận children
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          {/* <BackendStatus /> */}
        </Providers>
      </body>
    </html>
  )
}
