import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"   // example provider

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  // optional: custom pages, callbacks, etc.
})