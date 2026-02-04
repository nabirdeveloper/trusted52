import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await connectDB()

    // Force return hardcoded products to test frontend
    const hardcodedProducts = [
      {
        _id: '1',
        name: 'Wireless Headphones Pro',
        slug: 'wireless-headphones-pro',
        description: 'Premium wireless headphones with active noise cancellation',
        price: 299.99,
        comparePrice: 399.99,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
            alt: 'Wireless Headphones Pro',
            isPrimary: true
          }
        ],
        rating: { average: 4.5, count: 128 },
        status: 'active',
        featured: true
      },
      {
        _id: '2',
        name: 'Smart Watch Ultra',
        slug: 'smart-watch-ultra',
        description: 'Advanced smartwatch with health monitoring',
        price: 449.99,
        comparePrice: 549.99,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=800',
            alt: 'Smart Watch Ultra',
            isPrimary: true
          }
        ],
        rating: { average: 4.7, count: 89 },
        status: 'active',
        featured: true
      }
    ]

    return NextResponse.json(hardcodedProducts)

  } catch (error: any) {
    console.error('Error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}