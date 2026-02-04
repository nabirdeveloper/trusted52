'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { Star, ShoppingCart, Heart, Zap, Clock, Timer } from 'lucide-react'
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
  quantity: number
  status: string
}

export default function FlashDeals() {
  const [products, setProducts] = useState<Product[]>([])
  const calculateTimeLeft = () => {
    const now = new Date()
    const endTime = new Date()
    endTime.setHours(23, 59, 59, 999)
    
    const difference = endTime.getTime() - now.getTime()
    
    if (difference > 0) {
      return {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }
    
    return { hours: 0, minutes: 0, seconds: 0 }
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFlashDeals()
    console.log('FlashDeals component mounted')

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const fetchFlashDeals = async () => {
    console.log('Starting fetchFlashDeals...')
    try {
      const response = await fetch('/api/content/flash-deals')
      console.log('FlashDeals API response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('FlashDeals API response:', data)
        const filteredProducts = data.filter((product: Product) => (product.quantity || (product as any).totalStock || 0) > 0)
        console.log('Setting flash deals products:', filteredProducts.length, 'items')
        setProducts(filteredProducts)
      } else {
        console.error('FlashDeals API response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch flash deals:', error)
    } finally {
      console.log('Setting flash deals isLoading to false')
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
      <section className="py-12 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-orange-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">Flash Deals</h2>
            </div>
            <div className="flex justify-center space-x-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 min-w-[80px] animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
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

  // If no products from API, show hardcoded samples
  const displayProducts = products.length > 0 ? products.filter(p => p.name && p.price) : [
    {
      _id: '5',
      name: 'Wireless Earbuds Pro',
      slug: 'wireless-earbuds-pro',
      description: 'Premium wireless earbuds with active noise cancellation and premium sound quality.',
      price: 149.99,
      comparePrice: 199.99,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1484704879700-f032a568a944?w=800&q=80',
          alt: 'Wireless Earbuds Pro',
          isPrimary: true
        }
      ],
      rating: { average: 4.3, count: 89 },
      quantity: 75,
      status: 'active'
    },
    {
      _id: '6',
      name: 'Smart Fitness Tracker',
      slug: 'smart-fitness-tracker',
      description: 'Advanced fitness tracker with heart rate monitoring and GPS tracking.',
      price: 79.99,
      comparePrice: 119.99,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1575311376930-6b842977e739?w=800&q=80',
          alt: 'Smart Fitness Tracker',
          isPrimary: true
        }
      ],
      rating: { average: 4.1, count: 67 },
      quantity: 120,
      status: 'active'
    }
  ]

  return (
    <section className="py-12 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4">
        <div 
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div>
              <Zap className="h-8 w-8 text-orange-500 mr-3" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Flash Deals
            </h2>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Limited time offers - Don't miss out!
          </p>
          
          {/* Animated Countdown Timer */}
          <div className="flex justify-center space-x-4">
            <div 
              className="bg-white rounded-lg p-4 shadow-lg min-w-[80px] border border-orange-200"
            >
              <div className="text-2xl font-bold text-red-600">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600">Hours</div>
            </div>
            <div className="text-2xl font-bold text-gray-400 mt-4">:</div>
            <div 
              className="bg-white rounded-lg p-4 shadow-lg min-w-[80px] border border-orange-200"
            >
              <div className="text-2xl font-bold text-red-600">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
            <div className="text-2xl font-bold text-gray-400 mt-4">:</div>
            <div 
              className="bg-white rounded-lg p-4 shadow-lg min-w-[80px] border border-orange-200"
            >
              <div className="text-2xl font-bold text-red-600">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600">Seconds</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((product) => {
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
            
            // Handle both quantity field naming conventions
            const quantity = product.quantity || (product as any).totalStock || 0

            return (
              <div
                key={product._id}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-white">
                  {/* Flash Deal Badge */}
                  <div 
                    className="absolute top-2 left-2 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg"
                  >
                    <Zap className="h-3 w-3 mr-1 animate-pulse" />
                    -{discount}%
                  </div>

                  <CardContent className="p-0">
                    <div className="relative">
                      <Link href={`/products/${product.slug}`}>
                        <div className="relative h-48 bg-gray-100 overflow-hidden">
                          <Image
                            src={primaryImage?.url || '/api/placeholder/300/300'}
                            alt={primaryImage?.alt || product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            loader={cloudinaryLoader}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          
                            {quantity <= 5 && (
                            <div 
                              className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse"
                            >
                              Only {quantity} left!
                            </div>
                          )}
                          
                          <div 
                            className="absolute top-12 left-2 right-16"
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="bg-white/90 hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg"
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
                      
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4"
                      >
                        <Button
                          className="w-full bg-white text-black hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg"
                          onClick={() => addToCart(product._id)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                           {product.name || 'Product'}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(product.rating?.average || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 ml-2">
                          ({product.rating.count})
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-red-600">
                            ${product.price}
                          </span>
                          {comparePrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ${comparePrice}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-xs text-orange-600">
                          <Timer className="h-3 w-3 mr-1" />
                          Limited
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        <div
          className="text-center mt-8"
        >
          <Button 
            variant="outline" 
            size="lg" 
            className="hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all duration-300 hover:scale-105 shadow-lg"
            asChild
          >
            <Link href="/products?flash-deals=true">
              View All Flash Deals
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}