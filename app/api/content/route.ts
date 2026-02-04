import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Test endpoints that return hardcoded data
  const endpoints = {
    'featured-products': [
      {
        _id: '1',
        name: 'Wireless Headphones Pro',
        slug: 'wireless-headphones-pro',
        description: 'Premium wireless headphones with active noise cancellation.',
        price: 299.99,
        comparePrice: 399.99,
        images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', alt: 'Wireless Headphones Pro', isPrimary: true }],
        rating: { average: 4.5, count: 128 },
        status: 'active',
        featured: true
      },
      {
        _id: '2',
        name: 'Smart Watch Ultra',
        slug: 'smart-watch-ultra',
        description: 'Advanced smartwatch with health monitoring.',
        price: 449.99,
        comparePrice: 549.99,
        images: [{ url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=800', alt: 'Smart Watch Ultra', isPrimary: true }],
        rating: { average: 4.7, count: 89 },
        status: 'active',
        featured: true
      }
    ],
    'trending-products': [
      {
        _id: '3',
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-tshirt',
        description: 'Ultra-soft premium cotton t-shirt.',
        price: 29.99,
        comparePrice: 39.99,
        images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', alt: 'Premium Cotton T-Shirt', isPrimary: true }],
        rating: { average: 4.2, count: 203 },
        status: 'active',
        featured: false
      },
      {
        _id: '4',
        name: 'Vintage Denim Jacket',
        slug: 'vintage-denim-jacket',
        description: 'Classic vintage-style denim jacket.',
        price: 89.99,
        comparePrice: 129.99,
        images: [{ url: 'https://images.unsplash.com/photo-1576871330329-35cdbb2b3ad1?w=800&q=80', alt: 'Vintage Denim Jacket', isPrimary: true }],
        rating: { average: 4.6, count: 156 },
        status: 'active',
        featured: false
      }
    ],
    'flash-deals': [
      {
        _id: '5',
        name: 'Wireless Earbuds Pro',
        slug: 'wireless-earbuds-pro',
        description: 'Premium wireless earbuds with ANC.',
        price: 149.99,
        comparePrice: 199.99,
        images: [{ url: 'https://images.unsplash.com/photo-1484704879700-f032a568a944?w=800&q=80', alt: 'Wireless Earbuds Pro', isPrimary: true }],
        rating: { average: 4.3, count: 89 },
        status: 'active',
        featured: false
      },
      {
        _id: '6',
        name: 'Smart Fitness Tracker',
        slug: 'smart-fitness-tracker',
        description: 'Advanced fitness tracker with GPS.',
        price: 79.99,
        comparePrice: 119.99,
        images: [{ url: 'https://images.unsplash.com/photo-1575311376930-6b842977e739?w=800&q=80', alt: 'Smart Fitness Tracker', isPrimary: true }],
        rating: { average: 4.1, count: 67 },
        status: 'active',
        featured: false
      }
    ]
  }

  // Return hardcoded data based on endpoint
  const url = new URL(req.url || '', `http://localhost:3001`)
  const pathname = url.pathname
  
  if (pathname === '/api/content/featured-products') {
    return NextResponse.json(endpoints['featured-products'])
  } else if (pathname === '/api/content/trending-products') {
    return NextResponse.json(endpoints['trending-products'])
  } else if (pathname === '/api/content/flash-deals') {
    return NextResponse.json(endpoints['flash-deals'])
  } else {
    return NextResponse.json({ error: 'Unknown endpoint' })
  }
}