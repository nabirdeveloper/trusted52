import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Settings from '@/lib/models/Settings'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await connectDB()

    // Get settings for trending products
    let settings = await Settings.findOne()
    
    let trendingProductIds: string[] = []
    
    if (settings && 
        settings.homepage && 
        settings.homepage.trendingProducts && 
        settings.homepage.trendingProducts.productIds && 
        settings.homepage.trendingProducts.productIds.length > 0) {
      trendingProductIds = settings.homepage.trendingProducts.productIds
    } else {
      // If no settings, get trending products (high sales count)
      // Handle both field naming conventions
      const trendingProducts = await Product.find({ 
        $or: [
          { trending: true, status: 'active' },
          { isTrending: true, isActive: true }
        ]
      })
      .sort({ salesCount: -1, 'rating.average': -1 })
      .limit(8)
      .lean()

      return NextResponse.json(trendingProducts)
    }

    // Get trending products from settings
    const products = await Product.find({
      _id: { $in: trendingProductIds },
      $or: [
        { status: 'active' },
        { isActive: true }
      ]
    })
    .populate('images') // Ensure images are populated
    .sort({ salesCount: -1, 'rating.average': -1 })
    .limit(8)
    .lean()

    return NextResponse.json(products)

  } catch (error: any) {
    console.error('Failed to fetch trending products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending products' },
      { status: 500 }
    )
  }
}