import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Settings from '@/lib/models/Settings'

export async function GET() {
  try {
    await connectDB()
    
    const settings = await Settings.findOne().lean()
    const seoSettings = settings?.seo || {}
    
    const robotsTxt = seoSettings.robotsTxt || `User-agent: *
Allow: /

# Sitemap
Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'}/sitemap.xml`

    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400'
      }
    })

  } catch (error) {
    console.error('Robots.txt Error:', error)
    return new NextResponse('User-agent: *\nDisallow: /', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}