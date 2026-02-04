'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { 
  X, 
  Menu, 
  Home, 
  Package, 
  ShoppingBag, 
  Heart, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories: Category[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  siteSettings: any;
  isLoading: boolean;
}

export default function MobileMenu({ isOpen, onClose, siteSettings, isLoading }: MobileMenuProps) {
  const { data: session } = useSession();
  const { totalItems } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
    onClose();
  };

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: ShoppingBag, label: 'Products', href: '/products' },
    { icon: Menu, label: 'Categories', href: '/categories', hasSubmenu: true },
  ];

  const accountItems = session?.user ? [
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Package, label: 'My Orders', href: '/orders' },
    { icon: Heart, label: 'Wishlist', href: '/wishlist', badge: wishlistCount },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ] : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-55"
            onClick={onClose}
          />

          {/* Mobile Menu */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-72 sm:w-80 bg-white shadow-xl z-60 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-5 w-20 bg-gray-200 animate-pulse rounded"></div>
                  </>
                ) : siteSettings.logo ? (
                  <>
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white border border-gray-200">
                      <img
                        src={siteSettings.logo}
                        alt="Site Logo"
                        className="w-full h-full object-cover"
                        style={{ display: 'block' }}
                        onError={(e) => {
                          console.error('Mobile menu logo failed to load:', siteSettings.logo);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      {siteSettings.name || 'E-Commerce'}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {siteSettings.name?.charAt(0) || 'E'}
                      </span>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      {siteSettings.name || 'E-Commerce'}
                    </span>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* User Info */}
            {session?.user && (
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={session.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || 'User')}&background=3b82f6&color=fff&size=128`} 
                      alt={session.user.name || ''} 
                    />
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {session.user.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

             {/* Main Navigation */}
             <nav className="p-3 sm:p-4">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <div key={item.href}>
                     <Link
                       href={item.href}
                       onClick={onClose}
                       className="flex items-center space-x-2 sm:space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
                     >
                       <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                       <span className="flex-1 text-sm sm:text-base">{item.label}</span>
                       {item.hasSubmenu && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />}
                     </Link>
                  </div>
                ))}

                {/* Categories Submenu */}
                <div className="mt-4">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Shop by Category
                  </div>
                  {categories.map((category) => (
                    <div key={category._id} className="mb-1">
                      <button
                        onClick={() => toggleCategory(category._id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <span className="text-sm">{category.name}</span>
                        {expandedCategories.has(category._id) ? (
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </button>
                      {expandedCategories.has(category._id) && category.subcategories.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-6 pr-3"
                        >
                          {category.subcategories.map((subcat) => (
                             <Link
                               key={subcat._id}
                               href={`/categories/${subcat.slug}`}
                               onClick={onClose}
                               className="block py-1 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
                             >
                               {subcat.name}
                             </Link>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Section */}
              {session?.user && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    My Account
                  </div>
                  <div className="space-y-1">
                    {accountItems.map((item) => (
                       <Link
                         key={item.href}
                         href={item.href}
                         onClick={onClose}
                         className="flex items-center space-x-2 sm:space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
                       >
                         <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                         <span className="flex-1 text-sm sm:text-base">{item.label}</span>
                         {isHydrated && item.badge && item.badge > 0 && (
                           <Badge variant="secondary" className="h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 text-xs">
                             {item.badge > 9 ? '9+' : item.badge}
                           </Badge>
                         )}
                       </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* Cart & Wishlist Quick Access */}
            <div className="p-3 sm:p-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <Link href="/wishlist" onClick={onClose}>
                  <Button variant="outline" className="w-full justify-center text-sm">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Wishlist</span>
                    <span className="sm:hidden">♥</span>
                    {isHydrated && wishlistCount > 0 && (
                      <Badge variant="secondary" className="ml-1 sm:ml-2 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 text-xs">
                        {wishlistCount > 9 ? '9+' : wishlistCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/search" onClick={onClose}>
                  <Button variant="outline" className="w-full justify-center text-sm">
                    <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Search</span>
                    <span className="sm:hidden">🔍</span>
                  </Button>
                </Link>
              </div>
              
              <div className="mt-2">
                <Link href="/cart" onClick={onClose}>
                  <Button variant="outline" className="w-full justify-center text-sm">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Cart
                    {isHydrated && totalItems > 0 && (
                      <Badge variant="secondary" className="ml-1 sm:ml-2 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 text-xs">
                        {totalItems > 9 ? '9+' : totalItems}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Auth Section */}
            {!session?.user && (
              <div className="p-3 sm:p-4 border-t border-gray-200">
                <div className="space-y-2">
                  <Link href="/auth/login" onClick={onClose}>
                    <Button variant="outline" className="w-full text-sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={onClose}>
                    <Button className="w-full text-sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Sign Out */}
            {session?.user && (
              <div className="p-3 sm:p-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Sign Out
                </Button>
              </div>
            )}

            {/* Admin Link */}
            {session?.user?.role === 'admin' && (
              <div className="p-3 sm:p-4 border-t border-gray-200">
                <Link href="/admin/dashboard" onClick={onClose}>
                  <Button variant="outline" className="w-full text-sm">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}