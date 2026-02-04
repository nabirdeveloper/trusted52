'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { cloudinaryLoader } from '@/lib/cloudinary'
import { useRouter } from 'next/navigation'

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  image: string
  buttonText: string
  buttonLink: string
  order: number
  isActive: boolean
}

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [isTransitioning, setIsTransitioning] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchHeroSlides()
  }, [])

  useEffect(() => {
    if (!isPaused && slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          if (prev === slides.length) {
            return slides.length + 1
          }
          return prev + 1
        })
      }, 4000)

      return () => clearInterval(interval)
    }
  }, [slides.length, isPaused])

  useEffect(() => {
    if (currentSlide === slides.length + 1) {
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentSlide(1)
        setTimeout(() => {
          setIsTransitioning(true)
        }, 50)
      }, 700)
    }
  }, [currentSlide, slides.length])

  const fetchHeroSlides = async () => {
    try {
      const response = await fetch('/api/content/hero-slider')
      if (response.ok) {
        const data = await response.json()
        setSlides(data.filter((slide: HeroSlide) => slide.isActive).sort((a: HeroSlide, b: HeroSlide) => a.order - b.order))
        if (data.length > 0) {
          setCurrentSlide(1)
        }
      }
    } catch (error) {
      console.error('Failed to fetch hero slides:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const nextSlide = () => {
    if (currentSlide === slides.length) {
      setCurrentSlide(slides.length + 1)
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentSlide(1)
        setTimeout(() => {
          setIsTransitioning(true)
        }, 50)
      }, 700)
    } else {
      setCurrentSlide(prev => prev + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide === 1) {
      setCurrentSlide(0)
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentSlide(slides.length)
        setTimeout(() => {
          setIsTransitioning(true)
        }, 50)
      }, 700)
    } else {
      setCurrentSlide(prev => prev - 1)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index + 1)
  }

  const handleButtonClick = (link: string) => {
    if (link.startsWith('/')) {
      router.push(link)
    } else {
      window.open(link, '_blank')
    }
  }

  if (isLoading) {
    return (
      <div className="relative h-[20vh] sm:h-[25vh] md:h-[30vh] lg:h-[35vh] xl:h-[40vh] bg-gray-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30 z-10"></div>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="relative h-[30vh] sm:h-[35vh] md:h-[40vh] lg:h-[45vh] xl:h-[50vh] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center z-20 px-4 sm:px-6 md:px-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 leading-tight">
            Welcome to Our Store
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Discover amazing products at great prices
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4">
            Shop Now
          </Button>
        </div>
      </div>
    )
  }

  const getActiveSlide = () => {
    if (currentSlide === 0) return slides[slides.length - 1]
    if (currentSlide === slides.length + 1) return slides[0]
    if (currentSlide >= 1 && currentSlide <= slides.length) return slides[currentSlide - 1]
    return slides[0]
  }

  const activeSlide = getActiveSlide()

  return (
    <div 
      ref={containerRef}
      className="relative h-[30vh] sm:h-[35vh] md:h-[40vh] lg:h-[45vh] xl:h-[50vh] overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide Container */}
      <div className="relative h-full">
        <div 
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
            transitionDuration: isTransitioning ? '700ms' : '0ms'
          }}
        >
          {/* Clone last slide for infinite loop */}
          <div className="flex-shrink-0 w-full h-full relative">
            <Image
              src={slides[slides.length - 1]?.image || '/api/placeholder/1920/600'}
              alt={slides[slides.length - 1]?.title}
              fill
              className="object-cover"
              loader={cloudinaryLoader}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent z-10"></div>
          </div>

          {/* Main slides */}
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex-shrink-0 w-full h-full relative"
            >
              <Image
                src={slide.image || '/api/placeholder/1920/600'}
                alt={slide.title}
                fill
                className="object-cover"
                priority={index === 0}
                loader={cloudinaryLoader}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent z-10"></div>
              
              {/* Slide Content */}
              <div className="absolute inset-0 z-20 flex items-center">
                <div className="container mx-auto px-4 sm:px-6 md:px-8">
                  <div className="max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight">
                      {slide.title}
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/95 mb-4 sm:mb-6 md:mb-8 leading-relaxed max-w-2xl">
                      {slide.subtitle}
                    </p>
                    {slide.buttonText && slide.buttonLink && (
                      <div className="inline-block">
                        <Button 
                          size="lg" 
                          className="bg-white text-black hover:bg-gray-100 text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold"
                          onClick={() => handleButtonClick(slide.buttonLink)}
                        >
                          {slide.buttonText}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Clone first slide for infinite loop */}
          <div className="flex-shrink-0 w-full h-full relative">
            <Image
              src={slides[0]?.image || '/api/placeholder/1920/600'}
              alt={slides[0]?.title}
              fill
              className="object-cover"
              loader={cloudinaryLoader}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent z-10"></div>
          </div>
        </div>
      </div>

       {/* Navigation Arrows */}
       {slides.length > 1 && (
         <>
           <Button
             variant="ghost"
             size="icon"
             className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100 rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
             onClick={prevSlide}
           >
             <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
           </Button>
           
           <Button
             variant="ghost"
             size="icon"
             className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100 rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
             onClick={nextSlide}
           >
             <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
           </Button>
         </>
       )}

       {/* Slide Indicators */}
       {slides.length > 1 && (
         <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-2 sm:space-x-3">
           {slides.map((_, index) => {
             const isActive = currentSlide === index + 1 || 
                            (index === 0 && currentSlide === slides.length + 1) ||
                            (index === slides.length - 1 && currentSlide === 0)
             return (
               <button
                 key={index}
                 onClick={() => goToSlide(index)}
                 className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full transition-all duration-500 ${
                   isActive
                     ? 'bg-white w-6 sm:w-8 md:w-10 shadow-lg'
                     : 'bg-white/40 hover:bg-white/60 hover:w-3 sm:hover:w-4 md:hover:w-6'
                 }`}
               />
             )
           })}
         </div>
       )}
    </div>
  )
}