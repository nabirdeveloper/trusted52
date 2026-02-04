import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await connectDB()

    // Get flash deals (products with comparePrice for discount)
    const flashDeals = await Product.find({
      $and: [
        {
          $or: [
            { status: 'active' },
            { isActive: true }
          ]
        },
        {
          $or: [
            { comparePrice: { $exists: true, $gt: 0 } },
            { originalPrice: { $exists: true, $gt: 0 } }
          ]
        },
        {
          $or: [
            { quantity: { $gt: 0 } },
            { totalStock: { $gt: 0 } }
          ]
        }
      ]
    })
    .populate('images') // Ensure images are populated
    .sort({ 'rating.average': -1, salesCount: -1 })
    .limit(8)
    .lean()

    return NextResponse.json(flashDeals)

  } catch (error: any) {
    console.error('Failed to fetch flash deals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flash deals' },
      { status: 500 }
    )
  }
}