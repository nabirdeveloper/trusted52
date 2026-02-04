'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Grid3x3 } from 'lucide-react'
import { cloudinaryLoader } from '@/lib/cloudinary'
import { motion, useInView } from 'framer-motion'
import type { Category } from '@/types'

export default function CategoryShowcase() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [maxSlides, setMaxSlides] = useState(0)
  const isInView = useInView(scrollContainerRef, { once: false, margin: "0px" })

  const [itemsPerView, setItemsPerView] = useState(8)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const updateItemsPerView = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth
        const newItemsPerView = width >= 1280 ? 8 : width >= 768 ? 6 : 4
        console.log('Setting itemsPerView:', newItemsPerView, 'at width:', width)
        setItemsPerView(newItemsPerView)
      }
    }
    
    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])
  
  useEffect(() => {
    const maxIndex = Math.max(0, categories.length - itemsPerView)
    setMaxSlides(maxIndex)
    console.log(`Categories: ${categories.length}, Items per view: ${itemsPerView}, Max slides: ${maxIndex}`)
  }, [categories.length, itemsPerView])

  useEffect(() => {
    console.log('=== Auto slide check ===', { 
      isInView, 
      isAutoPlaying, 
      categoriesLength: categories.length, 
      maxSlides, 
      itemsPerView 
    })
    
    if (isAutoPlaying && categories.length > 0) {
      console.log('Setting up interval for auto-slide')
      const interval = setInterval(() => {
        console.log('Interval triggered, current index:', currentIndex)
        setCurrentIndex((prev) => {
          const newIndex = maxSlides > 0 ? (prev + 1) % (maxSlides + 1) : 0
          console.log('Slide incremented to:', newIndex, 'maxSlides:', maxSlides)
          return newIndex
        })
      }, 4000)
      return () => {
        console.log('Clearing interval')
        clearInterval(interval)
      }
    }
  }, [isAutoPlaying, categories.length, maxSlides, currentIndex, isInView, itemsPerView])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/content/category-showcase')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error('Failed to fetch categories:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 5000)
  }

  const goToPrevious = () => {
    if (maxSlides > 0) {
      setCurrentIndex((prev) => (prev - 1 + maxSlides + 1) % (maxSlides + 1))
    }
  }

  const goToNext = () => {
    if (maxSlides > 0) {
      setCurrentIndex((prev) => (prev + 1) % (maxSlides + 1))
    }
  }

  if (isLoading) {
    return (
      <div className="py-8 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Loading Categories...</h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="py-8 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-orange-900 mb-4">No Categories Found</h2>
          <button onClick={fetchCategories} className="mt-4 bg-orange-600 text-white px-4 py-2 rounded">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollContainerRef} className=" -mt-26 bg-gradient-to-r from-gray-50 to-gray-100 overflow-hidden">
      <div className="container mx-auto px-2">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing products in every category
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Auto-slide: {isAutoPlaying ? 'ON' : 'OFF'} • {categories.length} categories • {itemsPerView} per view • {maxSlides} slides
          </p>
        </motion.div>

        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/4 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full w-10 h-10"
            onClick={goToPrevious}
            disabled={categories.length <= 1}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/4 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full w-10 h-10"
            onClick={goToNext}
            disabled={categories.length <= 1}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="relative overflow-hidden mx-4 sm:mx-6 md:mx-8">
            <motion.div
              animate={{
                x: -currentIndex * (100 / itemsPerView) + '%'
              }}
              transition={{ 
                duration: 0.8, 
                ease: [0.25, 0.46, 0.45, 0.94],
                type: "tween"
              }}
              className="flex gap-1"
            >
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="flex-shrink-0 px-1 flex items-center justify-center"
                  style={{ 
                    width: itemsPerView === 8 ? '12.5%' : 
                           itemsPerView === 6 ? '16.666667%' : 
                           itemsPerView === 4 ? '25%' : '50%'
                  }}
                >
                  <Link href={`/categories/${category.slug}`}>
                    <div className="relative w-16 h-16 mx-auto group cursor-pointer">
                      {category.image ? (
                        <div className="relative w-full h-full rounded-full overflow-hidden shadow-md border-3 border-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            loader={cloudinaryLoader}
                            sizes="96px"
                            style={{
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shadow-md border-3 border-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <Grid3x3 className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="absolute -bottom-1 left-0 right-0 text-center">
                        <div className="bg-white rounded-full px-2 py-0.5 shadow border border-gray-100 mx-auto inline-block">
                          <h3 className="text-gray-800 font-semibold text-xs text-center truncate max-w-[60px]">
                            {category.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Slide Indicators */}
          {maxSlides > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex justify-center items-center gap-2 mt-3"
            >
              {Array.from({ length: maxSlides + 1 }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-8 h-2 bg-blue-600 rounded-full'
                      : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-4"
          >
            <Button
              variant="outline"
              size="lg"
              className="hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 hover:scale-105 shadow-lg group"
              asChild
            >
              <Link href="/categories">
                <span className="flex items-center">
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  View All Categories
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}