import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/connect"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type")
    
    let name: string
    let email: string
    let password: string
    let phone: string | undefined
    let isAdmin = 'false'
    let secretKey: string | undefined
    let avatarFile: File | null = null

    if (contentType?.includes("multipart/form-data")) {
      // Handle FormData (with avatar upload)
      const formData = await req.formData()
      name = formData.get('name') as string
      email = formData.get('email') as string
      password = formData.get('password') as string
      phone = formData.get('phone') as string || undefined
      isAdmin = formData.get('isAdmin') as string || 'false'
      secretKey = formData.get('secretKey') as string || undefined
      avatarFile = formData.get('avatar') as File || null
    } else {
      // Handle JSON (legacy)
      const body = await req.json()
      name = body.name
      email = body.email
      password = body.password
      phone = body.phone
      isAdmin = body.isAdmin || 'false'
      secretKey = body.secretKey
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    await connectDB()

    const role = isAdmin === 'true' ? 'admin' : 'user'

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim(),
      role
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: `${role === 'admin' ? 'Admin' : 'User'} with this email already exists` },
        { status: 400 }
      )
    }

    // If admin registration, verify secret key
    if (isAdmin === 'true') {
      const adminSecretKey = process.env.ADMIN_SECRET_KEY
      if (!adminSecretKey || secretKey !== adminSecretKey) {
        return NextResponse.json(
          { error: "Invalid admin secret key" },
          { status: 403 }
        )
      }
    }

    // Handle avatar upload if present
    let avatarUrl: string | undefined
    if (avatarFile && avatarFile.size > 0) {
      try {
        const bytes = await avatarFile.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'avatars',
              public_id: `user-${Date.now()}`,
              format: 'webp',
              quality: 'auto:good',
              fetch_format: 'auto',
              crop: 'fill',
              gravity: 'face',
              width: 400,
              height: 400,
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          ).end(buffer)
        })

        avatarUrl = (uploadResult as any).secure_url
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError)
        // Continue without avatar if upload fails
      }
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone || undefined,
      role,
      avatar: avatarUrl
    })

    await user.save()

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      isActive: user.isActive
    }

    return NextResponse.json(
      { 
        message: `${role === 'admin' ? 'Admin' : 'User'} registered successfully`,
        user: userResponse
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}