import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || "USER",
        }
      }
    }),
    MicrosoftEntraID({
      id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile, email }) {
      // Allow credentials provider to always sign in
      if (account?.provider === "credentials") {
        return true
      }

      // For OAuth providers, check if user exists and link accounts
      if (account && user.email) {
        try {
          // Check if user with this email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          })

          if (existingUser) {
            // Check if this OAuth account is already linked
            const existingAccount = existingUser.accounts.find(
              (acc) => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
            )

            if (!existingAccount) {
              // Link the OAuth account to the existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: typeof account.refresh_token === 'string' ? account.refresh_token : null,
                  access_token: typeof account.access_token === 'string' ? account.access_token : null,
                  expires_at: typeof account.expires_at === 'number' ? account.expires_at : null,
                  token_type: typeof account.token_type === 'string' ? account.token_type : null,
                  scope: typeof account.scope === 'string' ? account.scope : null,
                  id_token: typeof account.id_token === 'string' ? account.id_token : null,
                  session_state: typeof account.session_state === 'string' ? account.session_state : null,
                },
              })
            }

            // Update user ID to the existing user so NextAuth uses it
            user.id = existingUser.id
            user.role = existingUser.role || "USER"
            return true
          }

          // If user doesn't exist, let NextAuth create it (normal flow)
          return true
        } catch (error) {
          console.error("Error in signIn callback:", error)
          // Allow sign-in to proceed even if linking fails
          return true
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
})
