import { NextRequest, NextResponse } from 'next/server'
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

    return NextResponse.json({
      site: settings.site,
      footer: settings.footer
    })

  } catch (error: any) {
    console.error('Failed to fetch footer content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch footer content' },
      { status: 500 }
    )
  }
}