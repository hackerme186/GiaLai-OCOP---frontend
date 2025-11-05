import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.googleId = (profile as any).sub
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = typeof token.accessToken === 'string' ? token.accessToken : undefined
        session.googleId = typeof token.googleId === 'string' ? token.googleId : undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
}

// ---- mở rộng kiểu cho NextAuth ----
declare module "next-auth" {
  interface Session {
    accessToken?: string
    googleId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    googleId?: string
  }
}
