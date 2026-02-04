import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await connectDB()

    // Test the simple query directly
    const featuredProducts = await Product.find({ 
      featured: true, 
      status: 'active' 
    })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean()

    console.log('Featured products found:', featuredProducts.length)

    return NextResponse.json(featuredProducts)

  } catch (error: any) {
    console.error('Failed to fetch featured products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    )
  }
}