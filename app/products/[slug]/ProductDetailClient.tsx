'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  Shield, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ShoppingBag,
  ZoomIn,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import toast from 'react-hot-toast'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'

interface Product {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  sku: string
  price: number
  comparePrice: number
  weight?: number
  images: Array<{
    _id: string
    url: string
    alt: string
    isPrimary: boolean
    position: number
  }>
  categories: Array<{
    _id: string
    name: string
    slug: string
  }>
  attributes: Array<{
    name: string
    value: string
    type: string
    options?: string[]
  }>
  variants: Array<{
    _id: string
    name: string
    price: number
    comparePrice?: number
    attributes: Record<string, any>
    quantity: number
  }>
  rating: {
    average: number
    count: number
  }
  quantity: number
  trackQuantity: boolean
  allowBackorder: boolean
  requiresShipping: boolean
  tags: string[]
}

interface Review {
  _id: string
  user: {
    _id: string
    name: string
    image?: string
  }
  rating: number
  title: string
  content: string
  helpful: number
  verified: boolean
  createdAt: string
}

interface ProductDetailClientProps {
  product: Product
  relatedProducts: any[]
  reviews: Review[]
  userPurchased: boolean
  session: any
}

export default function ProductDetailClient({ 
  product, 
  relatedProducts, 
  reviews, 
  userPurchased,
  session 
}: ProductDetailClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [zoomImageIndex, setZoomImageIndex] = useState(0)
  const [isImageZoomed, setIsImageZoomed] = useState(false)
  const { addItem } = useCart()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)

  const selectedImage = product.images[selectedImageIndex]
  const discount = product.comparePrice && product.comparePrice > product.price 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  const stockStatus: 'in-stock' | 'low-stock' | 'backorder' | 'out-of-stock' = 
    product.quantity > 20 ? 'in-stock' : 
    product.quantity > 0 ? 'low-stock' : 
    product.allowBackorder ? 'backorder' : 'out-of-stock'

  const stockStatusInfo = {
    'in-stock': {
      text: 'In Stock',
      color: 'text-green-600 bg-green-100',
      icon: CheckCircle
    },
    'low-stock': {
      text: `Only ${product.quantity} left`,
      color: 'text-yellow-600 bg-yellow-100',
      icon: AlertTriangle
    },
    'backorder': {
      text: 'Available on Backorder',
      color: 'text-blue-600 bg-blue-100',
      icon: Clock
    },
    'out-of-stock': {
      text: 'Out of Stock',
      color: 'text-red-600 bg-red-100',
      icon: AlertTriangle
    }
  }

  const StockIcon = stockStatusInfo[stockStatus].icon

  const handleAddToCart = async () => {
    if (!session) {
      toast.error('Please sign in to add items to cart')
      return
    }

    if (stockStatus === 'out-of-stock') {
      toast.error('Product is out of stock')
      return
    }

    setIsLoading(true)
    try {
      // Add to local cart store first for immediate UI feedback
      addItem({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images[0]?.url || null,
        price: product.price,
        originalPrice: product.comparePrice || product.price,
        discount: product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0,
        variant: {
          _id: selectedVariant || 'default',
          sku: product.sku,
          name: 'Default',
          attributes: {}
        },
        inStock: product.quantity > 0 || product.allowBackorder
      })

      // Also call API for server-side persistence (optional)
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          variantId: selectedVariant,
          quantity
        })
      })

      if (response.ok) {
        toast.success(`${product.name} added to cart`)
        setQuantity(1)
      } else {
        throw new Error('Failed to sync with server')
      }
    } catch (error) {
      toast.error('Failed to add to cart')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWishlist = async () => {
    if (!session) {
      toast.error('Please sign in to save to wishlist')
      return
    }

    try {
      const currentlyInWishlist = isInWishlist(product._id)
      
      if (currentlyInWishlist) {
        removeFromWishlist(product._id)
        toast.success('Removed from wishlist')
      } else {
        addToWishlist({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images[0]?.url || null,
          price: product.price,
          originalPrice: product.comparePrice || product.price,
          discount: product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0,
          averageRating: product.rating?.average || 0,
          reviewCount: product.rating?.count || 0,
          inStock: product.quantity > 0
        })
        toast.success('Added to wishlist')
      }

      // Also call API for server-side persistence (optional)
      const response = await fetch('/api/wishlist', {
        method: currentlyInWishlist ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id })
      })

      if (!response.ok) {
        throw new Error('Failed to sync with server')
      }
    } catch (error) {
      toast.error('Failed to update wishlist')
    }
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `Check out ${product.name} on our store!`
    
    const shareUrls: Record<string, string> = {
      facebook: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)} ${encodeURIComponent(url)}`
    }
    
    window.open(shareUrls[platform], '_blank', 'width=600,height=400')
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({product.rating.count})</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <a href="/" className="hover:text-gray-900">Home</a>
        <span>/</span>
        <a href="/products" className="hover:text-gray-900">Products</a>
        {product.categories[0] && (
          <>
            <span>/</span>
            <a href={`/categories/${product.categories[0].slug}`} className="hover:text-gray-900">
              {product.categories[0].name}
            </a>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-zoom-in">
              <img
                src={selectedImage?.url || '/placeholder-image.jpg'}
                alt={selectedImage?.alt || product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  setZoomImageIndex(selectedImageIndex)
                  setIsImageZoomed(true)
                }}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discount > 0 && (
                  <Badge className="bg-red-500 text-white">
                    -{discount}% OFF
                  </Badge>
                )}
                {product.tags.includes('New') && (
                  <Badge className="bg-green-500 text-white">
                    New Arrival
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Carousel */}
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={image._id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === index ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Product Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Product Title and Rating */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            {renderStars(product.rating.average)}
          </div>

          {/* Price */}
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-gray-900">
              ${product.price}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  ${product.comparePrice}
                </span>
                <Badge variant="destructive">
                  Save {discount}%
                </Badge>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <Badge className={`${stockStatusInfo[stockStatus].color} flex items-center gap-1`}>
              <StockIcon className="h-3 w-3" />
              {stockStatusInfo[stockStatus].text}
            </Badge>
            {stockStatus === 'in-stock' && (
              <span className="text-sm text-gray-600">
                Usually ships within 24 hours
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-700 leading-relaxed">
            {product.shortDescription || product.description?.substring(0, 200)}...
          </p>

          {/* Product Options */}
          <div className="space-y-4">
            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Options</label>
                <Select value={selectedVariant || ''} onValueChange={setSelectedVariant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map((variant) => (
                      <SelectItem key={variant._id} value={variant._id}>
                        {variant.name} - ${variant.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={stockStatus === 'out-of-stock' || isLoading}
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              {isLoading ? 'Adding...' : 'Add to Cart'}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleWishlist}
              className={isInWishlist(product._id) ? 'bg-red-50 border-red-200' : ''}
            >
              <Heart className={`h-5 w-5 ${isInWishlist(product._id) ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShareMenuOpen(true)}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 py-6 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck className="h-4 w-4" />
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4" />
              <span>Easy Returns</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="h-4 w-4" />
              <span>Secure Packaging</span>
            </div>
          </div>

          {/* Product Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Product Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-16"
      >
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-8">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold mb-4">Product Description</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="specifications" className="mt-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Specifications</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">SKU</span>
                    <span>{product.sku}</span>
                  </div>
                  {product.weight && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Weight</span>
                      <span>{product.weight}kg</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Shipping</span>
                    <span>{product.requiresShipping ? 'Required' : 'Not Required'}</span>
                  </div>
                </div>
                
                {product.attributes && product.attributes.length > 0 && (
                  <div className="space-y-3">
                    {product.attributes.map((attr) => (
                      <div key={attr.name} className="flex justify-between py-2 border-b">
                        <span className="font-medium">{attr.name}</span>
                        <span>{attr.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-8">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Customer Reviews</h2>
                {userPurchased && (
                  <Button>Write a Review</Button>
                )}
              </div>
              
              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="border-b pb-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.user.image} />
                          <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{review.user.name}</span>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                          {renderStars(review.rating)}
                          <h4 className="font-medium mt-2">{review.title}</h4>
                          <p className="text-gray-700 mt-2">{review.content}</p>
                          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                            <button className="hover:text-blue-600">
                              Helpful ({review.helpful})
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {isImageZoomed && (
          <Dialog open={isImageZoomed} onOpenChange={setIsImageZoomed}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              <div className="relative">
                <button
                  onClick={() => setIsImageZoomed(false)}
                  className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg"
                >
                  ×
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <img
                      src={product.images[zoomImageIndex]?.url}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 p-4 max-h-[90vh] overflow-y-auto">
                    {product.images.map((image, index) => (
                      <img
                        key={image._id}
                        src={image.url}
                        alt={image.alt}
                        onClick={() => setZoomImageIndex(index)}
                        className={`w-full h-24 object-cover rounded cursor-pointer border-2 ${
                          zoomImageIndex === index ? 'border-blue-500' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareMenuOpen && (
          <Dialog open={shareMenuOpen} onOpenChange={setShareMenuOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Product</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-2"
                >
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('twitter')}
                  className="flex items-center gap-2"
                >
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('pinterest')}
                  className="flex items-center gap-2"
                >
                  Pinterest
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('whatsapp')}
                  className="flex items-center gap-2"
                >
                  WhatsApp
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}