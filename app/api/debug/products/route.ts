import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await connectDB()
    
    // Count total products
    const totalProducts = await Product.countDocuments()
    
    // Get first few products (any status)
    const allProducts = await Product.find().limit(5).select('name slug status').lean()
    
    // Get only active products
    const activeProducts = await Product.find({ status: 'active' }).limit(5).select('name slug status').lean()
    
    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        activeProductsCount: await Product.countDocuments({ status: 'active' }),
        allProducts,
        activeProducts,
        environment: {
          MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
        }
      }
    })
  } catch (error: any) {
    console.error('Debug API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack,
        environment: {
          MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
        }
      },
      { status: 500 }
    )
  }
}