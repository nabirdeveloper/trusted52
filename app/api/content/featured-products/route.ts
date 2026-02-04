import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Settings from '@/lib/models/Settings'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await connectDB()

    // Get settings for featured products
    let settings = await Settings.findOne()
    
    let featuredProductIds: string[] = []
    
    if (settings && 
        settings.homepage && 
        settings.homepage.featuredProducts && 
        settings.homepage.featuredProducts.productIds && 
        settings.homepage.featuredProducts.productIds.length > 0) {
      featuredProductIds = settings.homepage.featuredProducts.productIds
    } else {
      // If no settings, get featured products
      // Handle both field naming conventions (isFeatured/isActive and featured/status)
      const featuredProducts = await Product.find({ 
        $or: [
          { featured: true, status: 'active' },
          { isFeatured: true, isActive: true }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()

      return NextResponse.json(featuredProducts)
    }

    // Get featured products from settings
    const products = await Product.find({
      _id: { $in: featuredProductIds },
      $or: [
        { status: 'active' },
        { isActive: true }
      ]
    })
    .populate('images') // Ensure images are populated
    .sort({ createdAt: -1 })
    .limit(8)
    .lean()

    return NextResponse.json(products)

  } catch (error: any) {
    console.error('Failed to fetch featured products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    )
  }
}