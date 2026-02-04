import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await connectDB()

    console.log('=== DIRECT DATABASE CHECK ===')
    
    // 1. Check connection - using mongoose.connection
    console.log('Database connected:', mongoose.connection.readyState === 1)
    
    // 2. Get ALL products 
    const allProducts = await Product.find({}).lean()
    console.log('All products count:', allProducts.length)
    
    // 3. Log first few products
    allProducts.slice(0, 3).forEach((product, index) => {
      console.log(`Product ${index + 1}:`, {
        name: product.name,
        status: product.status,
        featured: product.featured,
        isFeatured: product.isFeatured,
        slug: product.slug
      })
    })
    
    // 4. Test featured queries
    const featuredQuery1 = await Product.find({ featured: true }).lean()
    console.log('Query { featured: true }:', featuredQuery1.length)
    
    const featuredQuery2 = await Product.find({ featured: true, status: 'active' }).lean()
    console.log('Query { featured: true, status: "active" }:', featuredQuery2.length)
    
    // 5. Return whatever we find
    if (allProducts.length === 0) {
      // Return hardcoded test data if no products exist
      return NextResponse.json([
        {
          _id: 'test1',
          name: 'Wireless Headphones Pro',
          slug: 'wireless-headphones-pro',
          description: 'Premium wireless headphones with ANC',
          price: 299.99,
          comparePrice: 399.99,
          images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', alt: 'Headphones', isPrimary: true }],
          rating: { average: 4.5, count: 128 },
          status: 'active',
          featured: true
        }
      ])
    }
    
    return NextResponse.json(allProducts)

  } catch (error: any) {
    console.error('Error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}