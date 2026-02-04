import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import connectDB from '@/lib/db/connect'
import User from '@/lib/models/User'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data to find current image
    await connectDB()
    const user = await User.findById(session.user.id)
    
    if (!user || !user.image) {
      return NextResponse.json({ error: 'No profile image found' }, { status: 404 })
    }

    // Extract public ID from Cloudinary URL
    const urlParts = user.image.split('/')
    const publicIdWithExtension = urlParts.slice(-2).join('/')
    const publicId = publicIdWithExtension.split('.')[0]

    // Delete from Cloudinary
    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        (error: any, result: any) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    // Update user in database
    await User.findByIdAndUpdate(
      session.user.id,
      { image: null }
    )

    return NextResponse.json({
      success: true,
      message: 'Profile image removed successfully'
    })

  } catch (error) {
    console.error('Profile image removal error:', error)
    return NextResponse.json(
      { error: 'Failed to remove profile image' },
      { status: 500 }
    )
  }
}