import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/connect'
import Settings from '@/lib/models/Settings'

export async function GET() {
  try {
    await connectDB()

    let settings = await Settings.findOne()
    
    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({
        site: {
          name: 'Premium E-Commerce',
          description: 'Your trusted online shopping destination',
          contactEmail: 'info@example.com',
          contactPhone: '+1 (555) 123-4567',
          address: {
            street: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'United States'
          },
          socialLinks: {
            facebook: 'https://facebook.com/yourstore',
            twitter: 'https://twitter.com/yourstore',
            instagram: 'https://instagram.com/yourstore'
          }
        },
        homepage: {
          heroSlider: [
            {
              _id: 'default-1',
              title: 'Summer Sale',
              subtitle: 'Get up to 50% off on selected items',
              image: '/api/placeholder/1920/600',
              buttonText: 'Shop Now',
              buttonLink: '/products?sale=true',
              order: 1,
              isActive: true,
              position: 0
            },
            {
              _id: 'default-2',
              title: 'New Arrivals',
              subtitle: 'Check out our latest collection',
              image: '/api/placeholder/1920/600',
              buttonText: 'Explore',
              buttonLink: '/products?new=true',
              order: 2,
              isActive: true,
              position: 1
            },
            {
              _id: 'default-3',
              title: 'Flash Deals',
              subtitle: 'Limited time offers - Shop now!',
              image: '/api/placeholder/1920/600',
              buttonText: 'View Deals',
              buttonLink: '/products?flash=true',
              order: 3,
              isActive: true,
              position: 2
            },
            {
              _id: 'default-4',
              title: 'Premium Collection',
              subtitle: 'Discover our exclusive premium products',
              image: '/api/placeholder/1920/600',
              buttonText: 'Shop Premium',
              buttonLink: '/products?premium=true',
              order: 4,
              isActive: true,
              position: 3
            }
          ],
          categoryShowcase: [],
          featuredProducts: {
            productIds: [],
            title: 'Featured Products',
            showAllButton: true
          },
          trendingProducts: {
            productIds: [],
            title: 'Trending Now',
            showAllButton: true
          }
        },
        footer: {
          content: {
            about: 'We are your trusted partner for quality products and exceptional service. Shop with confidence.',
            quickLinks: [
              {
                title: 'Quick Links',
                links: [
                  { text: 'About Us', url: '/about' },
                  { text: 'Contact', url: '/contact' },
                  { text: 'Blog', url: '/blog' },
                  { text: 'Careers', url: '/careers' }
                ]
              },
              {
                title: 'Shop',
                links: [
                  { text: 'All Products', url: '/products' },
                  { text: 'Categories', url: '/categories' },
                  { text: 'Deals', url: '/deals' },
                  { text: 'New Arrivals', url: '/products?new=true' }
                ]
              }
            ],
            customerService: [
              {
                title: 'Customer Service',
                links: [
                  { text: 'Help Center', url: '/help' },
                  { text: 'Track Order', url: '/track-order' },
                  { text: 'Returns', url: '/returns' },
                  { text: 'Shipping Info', url: '/shipping' }
                ]
              },
              {
                title: 'Policies',
                links: [
                  { text: 'Privacy Policy', url: '/privacy' },
                  { text: 'Terms of Service', url: '/terms' },
                  { text: 'Cookie Policy', url: '/cookies' },
                  { text: 'FAQ', url: '/faq' }
                ]
              }
            ]
          },
          copyright: '© 2024 Premium E-Commerce. All rights reserved.',
          paymentMethods: ['visa', 'mastercard', 'amex', 'paypal']
        }
      })
    }

    const heroSlider = settings.homepage.heroSlider
      .filter((slide: any) => slide.isActive)
      .sort((a: any, b: any) => a.order - b.order)

    return NextResponse.json(heroSlider)

  } catch (error: any) {
    console.error('Failed to fetch hero slider:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hero slider content' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()

    const body = await request.json()
    const { slides } = body

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Invalid slides data' },
        { status: 400 }
      )
    }

    let settings = await Settings.findOne()
    
    if (!settings) {
      // Create settings if none exist
      settings = await Settings.create({
        homepage: {
          heroSlider: slides
        }
      })
    } else {
      // Update existing settings - map slides to match schema
      settings.homepage.heroSlider = slides.map((slide: any) => ({
        id: slide._id || slide.id || `slide-${Date.now()}-${Math.random()}`,
        title: slide.title,
        subtitle: slide.subtitle,
        image: slide.image,
        buttonText: slide.buttonText,
        buttonLink: slide.buttonLink,
        order: slide.order || slide.position + 1,
        isActive: slide.isActive
      }))
      await settings.save()
    }

    return NextResponse.json({
      success: true,
      message: 'Hero slider updated successfully',
      slides: settings.homepage.heroSlider
    })

  } catch (error: any) {
    console.error('Failed to update hero slider:', error)
    return NextResponse.json(
      { error: 'Failed to update hero slider content' },
      { status: 500 }
    )
  }
}