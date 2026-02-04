import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Product from '@/lib/models/Product'
import Category from '@/lib/models/Category'

export async function GET() {
  try {
    await connectDB()
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'
    
    // Get all products and categories
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt').lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean()
    ])

    const currentDate = new Date().toISOString()

    // Generate XML sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`

    // Add product pages
    products.forEach(product => {
      const productUrl = `${baseUrl}/products/${product.slug}`
      const lastMod = product.updatedAt?.toISOString() || currentDate
      
      sitemap += `
  <url>
    <loc>${productUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    })

    // Add category pages
    categories.forEach(category => {
      const categoryUrl = `${baseUrl}/categories/${category.slug}`
      const lastMod = category.updatedAt?.toISOString() || currentDate
      
      sitemap += `
  <url>
    <loc>${categoryUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    })

    sitemap += '\n</urlset>'

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })

  } catch (error) {
    console.error('Sitemap Error:', error)
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' }
    })
  }
}