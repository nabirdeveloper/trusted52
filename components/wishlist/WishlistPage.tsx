'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  ArrowLeft, 
  ShoppingCart, 
  Package,
  ArrowRight,
  Trash2,
  Eye
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProductCard from '@/components/products/ProductCard';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';

export function WishlistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, removeItem, clearWishlist, isInWishlist } = useWishlist();
  const { addItem } = useCart();

  // Check authentication and redirect if needed
  if (status === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/wishlist');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = (item: any) => {
    // Find a default variant (in a real app, you'd have proper variant handling)
    const defaultVariant = {
      _id: 'default',
      sku: 'DEFAULT-SKU',
      name: 'Default',
      attributes: {}
    };

    addItem({
      _id: item._id,
      name: item.name,
      slug: item.slug,
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
      discount: item.discount,
      inStock: item.inStock,
      variant: defaultVariant
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    removeItem(productId);
  };

  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      clearWishlist();
    }
  };

  const inStockItems = items.filter(item => item.inStock);
  const outOfStockItems = items.filter(item => !item.inStock);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-gray-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Your Wishlist is Empty
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Save your favorite products here so you can find them easily later.
            Start browsing and add items you love!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => router.push('/products')}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
            
            <Link href="/">
              <Button variant="outline" size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Save Favorites</h3>
              <p className="text-sm text-gray-600">Keep track of products you love</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Stock Alerts</h3>
              <p className="text-sm text-gray-600">Get notified when items are back in stock</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Quick Access</h3>
              <p className="text-sm text-gray-600">Easy checkout from saved items</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
            <p className="text-gray-600">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearWishlist}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Wishlist
            </Button>
          )}
        </div>
      </div>

      {/* In Stock Items */}
      {inStockItems.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Available Items ({inStockItems.length})</h2>
            <Alert className="max-w-md">
              <Heart className="h-4 w-4" />
              <AlertDescription>
                Great! These items are available for purchase
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {inStockItems.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                {/* Wishlist Quick Actions */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddToCart(item)}
                      className="h-8 w-8 p-0 bg-white shadow-md"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRemoveFromWishlist(item._id)}
                      className="h-8 w-8 p-0 bg-white shadow-md text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Product Card */}
                <ProductCard 
                  product={{
                    _id: item._id,
                    name: item.name,
                    slug: item.slug,
                    description: '',
                    price: item.price,
                    originalPrice: item.originalPrice,
                    discount: item.discount,
                    averageRating: item.averageRating,
                    reviewCount: item.reviewCount,
                    inStock: item.inStock,
                    image: item.image,
                    images: item.image ? [item.image] : [],
                    variants: [],
                    isNew: false,
                    isFeatured: false,
                    tags: []
                  }}
                />
                
                {/* Heart Badge */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-pink-500 hover:bg-pink-600">
                    <Heart className="h-3 w-3 mr-1 fill-current" />
                    Saved
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Out of Stock Items */}
      {outOfStockItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Out of Stock ({outOfStockItems.length})</h2>
            <Alert className="max-w-md">
              <Package className="h-4 w-4" />
              <AlertDescription>
                These items are currently out of stock. We'll notify you when they're available.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {outOfStockItems.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative opacity-75"
              >
                {/* Wishlist Quick Actions */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRemoveFromWishlist(item._id)}
                    className="h-8 w-8 p-0 bg-white shadow-md text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Product Card */}
                <ProductCard 
                  product={{
                    _id: item._id,
                    name: item.name,
                    slug: item.slug,
                    description: '',
                    price: item.price,
                    originalPrice: item.originalPrice,
                    discount: item.discount,
                    averageRating: item.averageRating,
                    reviewCount: item.reviewCount,
                    inStock: item.inStock,
                    image: item.image,
                    images: item.image ? [item.image] : [],
                    variants: [],
                    isNew: false,
                    isFeatured: false,
                    tags: []
                  }}
                />
                
                {/* Out of Stock Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-gray-500">
                    <Package className="h-3 w-3 mr-1" />
                    Out of Stock
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/products">
          <Button size="lg">
            <ArrowRight className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>
        
        {inStockItems.length > 0 && (
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => {
              // Add all in-stock items to cart
              inStockItems.forEach(item => handleAddToCart(item));
              router.push('/cart');
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add All to Cart
          </Button>
        )}
      </div>

      {/* Benefits Section */}
      <div className="mt-16 bg-gray-50 rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Wishlist Benefits
          </h2>
          <p className="text-gray-600">
            Get the most out of your saved items with these features
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Price Tracking</h3>
            <p className="text-sm text-gray-600">
              Monitor price changes on your saved items
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Stock Notifications</h3>
            <p className="text-sm text-gray-600">
              Get notified when out-of-stock items are back
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Quick Checkout</h3>
            <p className="text-sm text-gray-600">
              Move items from wishlist to cart instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}