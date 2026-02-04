import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/connect'
import Product from '@/lib/models/Product'
import Category from '@/lib/models/Category'
import Settings from '@/lib/models/Settings'

export async function GET() {
  try {
    await connectDB()
    
    // Get SEO settings from database
    const settings = await Settings.findOne().lean()
    const seoSettings = settings?.seo || {}

    return NextResponse.json({
      success: true,
      data: {
        defaultTitle: seoSettings.defaultTitle || 'Premium E-Commerce Store',
        defaultDescription: seoSettings.defaultDescription || 'Best online shopping experience with quality products',
        defaultKeywords: seoSettings.defaultKeywords || 'shopping, ecommerce, online store',
        ogSiteName: seoSettings.ogSiteName || 'Premium E-Commerce',
        defaultOgImage: seoSettings.defaultOgImage || '/images/default-og.jpg',
        generateSitemap: seoSettings.generateSitemap ?? true,
        robotsTxt: seoSettings.robotsTxt || 'User-agent: *\nAllow: /'
      }
    })

  } catch (error) {
    console.error('SEO Settings GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SEO settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { defaultTitle, defaultDescription, defaultKeywords, ogSiteName, defaultOgImage, generateSitemap, robotsTxt } = body

    await connectDB()

    // Update SEO settings
    await Settings.findOneAndUpdate(
      {},
      {
        'seo.defaultTitle': defaultTitle,
        'seo.defaultDescription': defaultDescription,
        'seo.defaultKeywords': defaultKeywords,
        'seo.ogSiteName': ogSiteName,
        'seo.defaultOgImage': defaultOgImage,
        'seo.generateSitemap': generateSitemap,
        'seo.robotsTxt': robotsTxt
      },
      { upsert: true, new: true }
    )

    // Generate sitemap if requested
    if (generateSitemap) {
      await generateSitemap()
    }

    return NextResponse.json({
      success: true,
      message: 'SEO settings updated successfully'
    })

  } catch (error) {
    console.error('SEO Settings PUT Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update SEO settings' },
      { status: 500 }
    )
  }
}

async function generateSitemap() {
  try {
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

    // Write sitemap to public directory
    const fs = require('fs').promises
    const path = require('path')
    const publicDir = path.join(process.cwd(), 'public')
    
    await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8')
    
    console.log('Sitemap generated successfully')
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }
}

// Robots.txt endpoint
export async function GET_ROBOTS() {
  try {
    await connectDB()
    
    const settings = await Settings.findOne().lean()
    const seoSettings = settings?.seo || {}
    
    const robotsTxt = seoSettings.robotsTxt || `User-agent: *
Allow: /

# Sitemap
Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`

    return new Response(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400'
      }
    })

  } catch (error) {
    console.error('Robots.txt Error:', error)
    return new Response('User-agent: *\nDisallow: /', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}