'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { Star, ShoppingCart, Heart, TrendingUp, Clock } from 'lucide-react'
import { cloudinaryLoader } from '@/lib/cloudinary'

interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  comparePrice?: number
  images: Array<{
    url: string
    alt: string
    isPrimary: boolean
  }>
  rating: {
    average: number
    count: number
  }
  salesCount: number
  status: string
}

export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTrendingProducts()
  }, [])

  const fetchTrendingProducts = async () => {
    console.log('Starting fetchTrendingProducts...')
    try {
      const response = await fetch('/api/content/trending-products')
      console.log('TrendingProducts API response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('TrendingProducts API response:', data)
        console.log('Setting trending products:', data.length, 'items')
        setProducts(data)
      } else {
        console.error('TrendingProducts API response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch trending products:', error)
    } finally {
      console.log('Setting trending products isLoading to false')
      setIsLoading(false)
    }
  }

  const addToCart = async (productId: string) => {
    // TODO: Implement cart functionality
    console.log('Add to cart:', productId)
  }

  const addToWishlist = async (productId: string) => {
    // TODO: Implement wishlist functionality
    console.log('Add to wishlist:', productId)
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trending Now</h2>
            <p className="text-lg text-gray-600">Hot products everyone's talking about</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg animate-pulse">
                <div className="h-64 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Use API data if available, otherwise show hardcoded samples
  const displayProducts = products.length > 0 ? products : [
    {
      _id: '3',
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-tshirt',
      description: 'Ultra-soft premium cotton t-shirt designed for maximum comfort and durability.',
      price: 29.99,
      comparePrice: 39.99,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
          alt: 'Premium Cotton T-Shirt',
          isPrimary: true
        }
      ],
      rating: { average: 4.2, count: 203 },
      salesCount: 500,
      status: 'active'
    },
    {
      _id: '4',
      name: 'Vintage Denim Jacket',
      slug: 'vintage-denim-jacket',
      description: 'Classic vintage-style denim jacket with modern comfort and durability.',
      price: 89.99,
      comparePrice: 129.99,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1576871330329-35cdbb2b3ad1?w=800&q=80',
          alt: 'Vintage Denim Jacket',
          isPrimary: true
        }
      ],
      rating: { average: 4.6, count: 156 },
      salesCount: 280,
      status: 'active'
    }
  ]

  console.log('TrendingProducts render: displayProducts length =', displayProducts.length)
  
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-red-500 mr-3" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Trending Now
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hot products everyone's talking about
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((product, index) => {
            // Handle both image formats: array of strings or array of objects
            let primaryImage = null
            if (product.images && product.images.length > 0) {
              if (typeof product.images[0] === 'string') {
                primaryImage = { url: product.images[0], alt: product.name, isPrimary: true }
              } else {
                primaryImage = product.images.find((img: any) => img.isPrimary) || product.images[0]
              }
            }
            
            // Handle both price field naming conventions
            const comparePrice = product.comparePrice || (product as any).originalPrice
            const discount = comparePrice 
              ? Math.round(((comparePrice - product.price) / comparePrice) * 100)
              : 0

            return (
              <Card key={product._id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden relative">
                {/* Trending Badge */}
                <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  #{index + 1} Trending
                </div>

                <CardContent className="p-0">
                  <div className="relative">
                    <Link href={`/products/${product.slug}`}>
                      <div className="relative h-64 bg-gray-100 overflow-hidden">
                        <Image
                          src={primaryImage?.url || '/api/placeholder/300/300'}
                          alt={primaryImage?.alt || product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          loader={cloudinaryLoader}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        
                        {discount > 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
                            -{discount}%
                          </div>
                        )}
                        
                        <div className="absolute top-2 left-2 right-16 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.preventDefault()
                              addToWishlist(product._id)
                            }}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        className="w-full bg-white text-black hover:bg-gray-100"
                        onClick={() => addToCart(product._id)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating.average)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        ({product.rating.count})
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          ${product.price}
                        </span>
                        {comparePrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${comparePrice}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {product.salesCount} sold
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link href="/products?trending=true">
              View All Trending Products
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}