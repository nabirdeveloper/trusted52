import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import bcrypt from "bcryptjs"
import connectDB from "./db/connect"
import User from "./models/User"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        isLogin: { label: "Is Login", type: "boolean" },
        isAdmin: { label: "Is Admin", type: "boolean" },
        secretKey: { label: "Secret Key", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        await connectDB()

        try {
          // Check if it's admin registration/login
          if (credentials.isAdmin === "true") {
            if (credentials.isLogin === "true") {
              // Admin login
              const admin = await User.findOne({ 
                email: credentials.email.toLowerCase(),
                role: 'admin'
              })

              if (!admin) {
                throw new Error("Admin not found")
              }

              const isPasswordValid = await admin.comparePassword(credentials.password)
              if (!isPasswordValid) {
                throw new Error("Invalid password")
              }

              if (!admin.isActive) {
                throw new Error("Admin account is deactivated")
              }

              return {
                id: admin._id.toString(),
                email: admin.email,
                name: admin.name,
                role: admin.role,
                avatar: admin.avatar,
                isActive: admin.isActive
              }
            } else {
              // Admin registration
              const existingAdmin = await User.findOne({ 
                email: credentials.email.toLowerCase(),
                role: 'admin'
              })

              if (existingAdmin) {
                throw new Error("Admin already exists")
              }

              // Verify secret key
              const adminSecretKey = process.env.ADMIN_SECRET_KEY
              if (!adminSecretKey || credentials.secretKey !== adminSecretKey) {
                throw new Error("Invalid secret key")
              }

              const admin = new User({
                name: credentials.name,
                email: credentials.email.toLowerCase(),
                password: credentials.password,
                role: 'admin'
              })

              await admin.save()

              return {
                id: admin._id.toString(),
                email: admin.email,
                name: admin.name,
                role: admin.role,
                avatar: admin.avatar,
                isActive: admin.isActive
              }
            }
          } else {
            // User registration/login
            if (credentials.isLogin === "true") {
              // User login
              const user = await User.findOne({ 
                email: credentials.email.toLowerCase(),
                role: 'user'
              })

              if (!user) {
                throw new Error("User not found")
              }

              if (!user.password) {
                throw new Error("User password not found - account may be registered with OAuth")
              }

              const isPasswordValid = await user.comparePassword(credentials.password)
              if (!isPasswordValid) {
                throw new Error("Invalid password")
              }

              if (!user.isActive) {
                throw new Error("Account is deactivated")
              }

              return {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                isActive: user.isActive
              }
            } else {
              // User registration
              const existingUser = await User.findOne({ 
                email: credentials.email.toLowerCase(),
                role: 'user'
              })

              if (existingUser) {
                throw new Error("User already exists")
              }

              const user = new User({
                name: credentials.name,
                email: credentials.email.toLowerCase(),
                password: credentials.password,
                role: 'user'
              })

              await user.save()

              return {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                isActive: user.isActive
              }
            }
          }
        } catch (error: any) {
          throw new Error(error.message || "Authentication failed")
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user && account) {
        token.id = user.id
        token.role = user.role
        token.avatar = user.avatar
        token.isActive = user.isActive
        
        // For OAuth providers, create/update user in database
        if (account.provider !== 'credentials') {
          await connectDB()
          
          const existingUser = await User.findOne({ email: user.email })
          if (!existingUser) {
            // Create new user for OAuth
            const newUser = new User({
              name: user.name,
              email: user.email,
              role: 'user',
              emailVerified: new Date()
            })
            await newUser.save()
            
            token.id = newUser._id.toString()
            token.role = newUser.role
            token.isActive = newUser.isActive
          } else {
            token.id = existingUser._id.toString()
            token.role = existingUser.role
            token.isActive = existingUser.isActive
          }
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string
        session.user.isActive = token.isActive as boolean
      }
      
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  }
}