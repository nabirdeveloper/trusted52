'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { Star, ShoppingCart, Heart } from 'lucide-react'
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
  status: string
  featured: boolean
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
    console.log('FeaturedProducts component mounted')
  }, [])

  const fetchFeaturedProducts = async () => {
    console.log('Starting fetchFeaturedProducts...')
    try {
      const response = await fetch('/api/content/featured-products')
      console.log('API response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('FeaturedProducts API response:', data)
        console.log('Setting products:', data.length, 'items')
        setProducts(data)
      } else {
        console.error('API response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error)
    } finally {
      console.log('Setting isLoading to false')
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

  // Use API data if available, otherwise show hardcoded samples
  const displayProducts = products.length > 0 ? products : [
    {
      _id: '1',
      name: 'Wireless Headphones Pro',
      slug: 'wireless-headphones-pro',
      description: 'Premium wireless headphones with active noise cancellation and superior sound quality.',
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
      description: 'Advanced smartwatch with health monitoring, GPS tracking, and seamless smartphone integration.',
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

  if (isLoading) {
    return (
      <section className="py-0 bg-white">
        <div className="container mx-auto px-4">

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
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

  console.log('FeaturedProducts render: displayProducts length =', displayProducts.length)
  
  return (
    <section className="-mt-10 py-0 bg-gradient-to-br from-white to-gray-50">
      <div className="container mx-auto px-4">


        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {displayProducts.map((product) => {
            let primaryImage = null
            if (product.images && product.images.length > 0) {
              if (typeof product.images[0] === 'string') {
                primaryImage = { url: product.images[0], alt: product.name, isPrimary: true }
              } else {
                primaryImage = product.images.find((img: any) => img.isPrimary) || product.images[0]
              }
            }
            const discount = product.comparePrice 
              ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
              : 0

            return (
              <div
                key={product._id}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-white">
                  <CardContent className="p-0">
                    <div className="relative">
                      <Link href={`/products/${product.slug}`}>
                        <div className="relative h-64 bg-gray-100 overflow-hidden">
                          <Image
                            src={primaryImage?.url || '/api/placeholder/300/300'}
                            alt={primaryImage?.alt || product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            loader={cloudinaryLoader}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          
                          {discount > 0 && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                              -{discount}%
                            </div>
                          )}
                          
                          <div className="absolute top-2 right-2">
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
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
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
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-gray-900">
                            ${product.price}
                          </span>
                          {product.comparePrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.comparePrice}
                            </span>
                          )}
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
          className="text-center mt-0"
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 hover:scale-105 shadow-lg text-xs"
            asChild
          >
            <Link href="/products?featured=true">
              View All
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}