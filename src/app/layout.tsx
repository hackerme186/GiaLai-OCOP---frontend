import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Auth UI",
  description: "Next.js + React + Tailwind authentication page",
}

export default function RootLayout({
  children,
  login,
}: {
  children: React.ReactNode
  login: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{login ?? children}</body>
    </html>
  )
}