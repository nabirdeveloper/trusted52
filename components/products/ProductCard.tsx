'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Eye, 
  Package,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image: string | null;
    images: string[];
    price: number;
    originalPrice: number;
    discount: number;
    averageRating: number;
    reviewCount: number;
    inStock: boolean;
    isNew: boolean;
    isFeatured: boolean;
    tags: string[];
    category?: {
      _id: string;
      name: string;
      slug: string;
    };
    variants?: any[];
  };
  viewMode?: 'grid' | 'list';
  className?: string;
}

export default function ProductCard({ 
  product, 
  viewMode = 'grid', 
  className = '' 
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { data: session } = useSession();

  const handleAddToCart = () => {
    addItem({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      inStock: product.inStock,
      variant: {
        _id: 'default',
        sku: `${product.slug}-default`,
        name: 'Default',
        attributes: {}
      }
    });
  };

  const handleWishlistToggle = () => {
    if (!session) {
      toast.error('Please sign in to save to wishlist');
      return;
    }

    const currentlyInWishlist = isInWishlist(product._id);
    
    if (currentlyInWishlist) {
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
        discount: product.discount,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
        inStock: product.inStock
      });
      toast.success('Added to wishlist');
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <Star className="h-3 w-3 fill-yellow-400/50 text-yellow-400" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />
        ))}
      </div>
    );
  };

  const ProductGridCard = () => (
    <motion.div
      className={`group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-green-500 hover:bg-green-600">
              <Sparkles className="h-3 w-3 mr-1" />
              New
            </Badge>
          )}
          {product.discount > 0 && (
            <Badge variant="destructive">
              {product.discount}% OFF
            </Badge>
          )}
          {!product.inStock && (
            <Badge variant="outline" className="bg-white">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <motion.div
          className="absolute top-2 right-2 flex flex-col gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            x: isHovered ? 0 : 20 
          }}
          transition={{ duration: 0.2 }}
        >
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
            onClick={handleWishlistToggle}
          >
            <Heart 
              className={`h-4 w-4 ${isInWishlist(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </Button>
          
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
            asChild
          >
            <Link href={`/products/${product.slug}`}>
              <Eye className="h-4 w-4 text-gray-600" />
            </Link>
          </Button>
        </motion.div>

        {/* Quick Add to Cart */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            y: isHovered ? 0 : 20 
          }}
          transition={{ duration: 0.2 }}
        >
          <Button
            size="sm"
            className="w-full bg-white text-black hover:bg-gray-100"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </motion.div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          {renderStars(product.averageRating)}
          <span className="text-sm text-gray-500 ml-2">
            ({product.reviewCount})
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          <Link href={`/products/${product.slug}`}>
            {product.name}
          </Link>
        </h3>

        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {product.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{product.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          {product.isFeatured && (
            <TrendingUp className="h-4 w-4 text-orange-500" />
          )}
        </div>
      </div>
    </motion.div>
  );

  const ProductListCard = () => (
    <motion.div
      className={`group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}
      whileHover={{ y: -2 }}
    >
      <div className="flex gap-4 p-4">
        {/* Product Image */}
        <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-50 rounded-lg">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-1 left-1">
            {product.isNew && (
              <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                New
              </Badge>
            )}
          </div>

          <div className="absolute top-1 right-1">
            {product.discount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {product.discount}% OFF
              </Badge>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
              <Link href={`/products/${product.slug}`}>
                {product.name}
              </Link>
            </h3>
            
            <div className="flex items-center gap-1 ml-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleWishlistToggle}
              >
                <Heart 
                  className={`h-3 w-3 ${isInWishlist(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            {renderStars(product.averageRating)}
            <span className="text-sm text-gray-500">
              ({product.reviewCount})
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Price and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                asChild
              >
                <Link href={`/products/${product.slug}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Link>
              </Button>
              
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return viewMode === 'grid' ? <ProductGridCard /> : <ProductListCard />;
}