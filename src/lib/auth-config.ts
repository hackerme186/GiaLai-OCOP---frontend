import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

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
        token.googleId = profile.sub
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken
        session.googleId = token.googleId
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
}

declare module "next-auth" {
  interface Session {
    accessToken?: string
    googleId?: string
  }
  
  interface JWT {
    accessToken?: string
    googleId?: string
  }
}
