import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/connect"
import User from "@/lib/models/User"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, secretKey } = await req.json()

    if (!name || !email || !password || !secretKey) {
      return NextResponse.json(
        { error: "All fields including secret key are required" },
        { status: 400 }
      )
    }

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: "Invalid admin secret key" },
        { status: 401 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Admin password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email, role: 'admin' })
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 400 }
      )
    }

    // Create new admin
    const admin = new User({
      name,
      email,
      password,
      role: 'admin'
    })

    await admin.save()

    // Remove password from response
    const adminResponse = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      isActive: admin.isActive
    }

    return NextResponse.json(
      { 
        message: "Admin registered successfully",
        admin: adminResponse
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Admin registration error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}