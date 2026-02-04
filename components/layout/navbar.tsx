'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, ShoppingCart, Package, Heart, Menu, Search, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MobileMenu from './MobileMenu'
import SearchBar from '@/components/search/SearchBar'

export default function Navbar() {
  const { data: session } = useSession()
  const { totalItems } = useCart()
  const { itemCount: wishlistCount } = useWishlist()
  const [isHydrated, setIsHydrated] = useState(false)
  const [siteSettings, setSiteSettings] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    
    // Load from cache first
    const cachedSettings = localStorage.getItem('siteSettings')
    if (cachedSettings) {
      setSiteSettings(JSON.parse(cachedSettings))
      setIsLoading(false)
    }
    
    fetchSiteSettings()
  }, [])

  // Listen for storage changes (when settings are updated in admin)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'siteSettings') {
        if (e.newValue) {
          setSiteSettings(JSON.parse(e.newValue))
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const fetchSiteSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        const settings = data.site || {}
        setSiteSettings(settings)
        // Cache settings for future reloads
        localStorage.setItem('siteSettings', JSON.stringify(settings))
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error)
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
    // Close mobile menu when opening search
    if (!isSearchOpen) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      {/* Full Screen Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-0 right-0 bg-white shadow-lg z-60 border-b border-gray-200"
          >
            <div className="max-w-3xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-2xl">
                  <SearchBar 
                    showButton={true} 
                    placeholder="Search for products, brands, or keywords..." 
                    size="lg"
                    className="w-full"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(false)}
                  className="ml-4"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 overflow-hidden">
            {/* Logo - Left Side */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0 min-w-0">
              {isLoading ? (
                // Loading skeleton
                <>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 animate-pulse rounded-lg flex-shrink-0"></div>
                  <div className="h-5 w-16 sm:h-6 sm:w-24 bg-gray-200 animate-pulse rounded hidden sm:block"></div>
                </>
              ) : siteSettings.logo ? (
                <>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 bg-white border border-gray-200 shadow-sm">
                    <img
                      src={siteSettings.logo}
                      alt="Site Logo"
                      className="w-full h-full object-cover"
                      style={{ display: 'block' }}
                      onError={(e) => {
                        console.error('Logo failed to load:', siteSettings.logo);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 block sm:hidden">{(siteSettings.name || 'E-Commerce').substring(0, 8)}</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">{siteSettings.name || 'E-Commerce'}</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm sm:text-lg">{siteSettings.name?.charAt(0) || 'E'}</span>
                  </div>
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 block sm:hidden">{(siteSettings.name || 'E-Commerce').substring(0, 8)}</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">{siteSettings.name || 'E-Commerce'}</span>
                </>
              )}
            </Link>

            {/* Center - Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-blue-600 transition-colors">
                Products
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-blue-600 transition-colors">
                Categories
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
                Contact
              </Link>
            </div>

            {/* Right Side - Search & User Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* Search Icon - Mobile & Tablet */}
              <Button variant="ghost" size="sm" onClick={toggleSearch} className="lg:hidden">
                <Search className="h-5 w-5" />
              </Button>

              {/* Desktop Search - Large screens only */}
              <div className="hidden lg:block">
                <SearchBar 
                  placeholder="Quick search..." 
                  showButton={true} 
                  size="sm"
                  className="w-48 xl:w-64"
                />
              </div>

              {/* User Menu */}
              {session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={session.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || 'User')}&background=3b82f6&color=fff&size=128`} 
                          alt={session.user.name || ''} 
                        />
                        <AvatarFallback>
                          {session.user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{session.user.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {session.user.role === 'admin' ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/dashboard" className="flex items-center">
                            <Package className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/orders" className="flex items-center">
                            <Package className="mr-2 h-4 w-4" />
                            My Orders
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/wishlist" className="flex items-center">
                            <Heart className="mr-2 h-4 w-4" />
                            Wishlist ({isHydrated ? wishlistCount : 0})
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              )}

              {/* Wishlist - Desktop & Tablet */}
              <div className="hidden md:flex items-center">
                <Link href="/wishlist" className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {isHydrated && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Cart - Desktop & Tablet */}
              <div className="hidden md:flex items-center">
                <Link href="/cart" className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {isHydrated && totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </Link>
              </div>

              {/* Cart - Mobile only */}
              <div className="flex md:hidden">
                <Link href="/cart" className="relative p-1.5 text-gray-700 hover:text-blue-600 transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  {isHydrated && totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </Link>
              </div>

              {/* Wishlist - Mobile only */}
              <div className="flex md:hidden">
                <Link href="/wishlist" className="relative p-1.5 text-gray-700 hover:text-blue-600 transition-colors">
                  <Heart className="w-5 h-5" />
                  {isHydrated && wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden p-2"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        siteSettings={siteSettings}
        isLoading={isLoading}
      />
    </>
  )
}