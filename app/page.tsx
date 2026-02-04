import { Suspense } from 'react'
import HeroSlider from '@/components/sections/HeroSlider'
import CategoryShowcase from '@/components/sections/CategoryShowcase'
import FeaturedProducts from '@/components/sections/FeaturedProducts'
import TrendingProducts from '@/components/sections/TrendingProducts'
import FlashDeals from '@/components/sections/FlashDeals'
import Newsletter from '@/components/sections/Newsletter'
import Footer from '@/components/layout/Footer'
import SearchBar from '@/components/search/SearchBar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      
      <main>
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse" />}>
        
          <HeroSlider />
        </Suspense>

        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse" />}>
          <CategoryShowcase />
        </Suspense>
          
        
        <Suspense fallback={<div className="h-96  bg-gray-100 animate-pulse" />}>
          <FeaturedProducts />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse" />}>
          <FlashDeals />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse" />}>
          <TrendingProducts />
        </Suspense>
        
        <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse" />}>
          <Newsletter />
        </Suspense>
      </main>
      
      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse" />}>
        <Footer />
      </Suspense>
    </div>
  )
}
