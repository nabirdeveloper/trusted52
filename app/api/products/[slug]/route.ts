import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/connect'
import Product from '@/lib/models/Product'
import Category from '@/lib/models/Category'
import Review from '@/lib/models/Review'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Product slug is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find the product by slug and populate related data
    const product = await Product.findOne({ 
      slug, 
      status: 'active' 
    })
      .populate('categories', 'name slug image')
      .lean()

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get related products from same categories
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      categories: { $in: product.categories },
      status: 'active'
    })
    .populate('categories', 'name slug')
    .limit(8)
    .lean()

    // Get reviews for this product
    const reviews = await Review.find({ 
      productId: product._id,
      isApproved: true 
    })
    .populate('userId', 'name image')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

    // Format product data
    const formattedProduct = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      sku: product.sku,
      price: product.price,
      comparePrice: product.comparePrice,
      cost: product.cost,
      weight: product.weight,
      dimensions: product.dimensions,
      images: product.images?.map((img: any) => ({
        _id: img._id,
        url: img.url,
        alt: img.alt || product.name,
        isPrimary: img.isPrimary,
        position: img.position
      })) || [],
      primaryImage: product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url,
      categories: product.categories?.map((cat: any) => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image
      })) || [],
      tags: product.tags || [],
      attributes: product.attributes || [],
      variants: product.variants?.map((variant: any) => ({
        _id: variant._id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        comparePrice: variant.comparePrice,
        cost: variant.cost,
        weight: variant.weight,
        attributes: variant.attributes || {},
        image: variant.image,
        position: variant.position,
        quantity: variant.quantity
      })) || [],
      rating: {
        average: Math.round(product.rating?.average || 0 * 10) / 10,
        count: product.rating?.count || 0
      },
      quantity: product.quantity || 0,
      trackQuantity: product.trackQuantity || false,
      allowBackorder: product.allowBackorder || false,
      requiresShipping: product.requiresShipping || true,
      taxable: product.taxable || false,
      featured: product.featured || false,
      digital: product.digital || false,
      seo: {
        title: product.seo?.title || product.name,
        description: product.seo?.description || product.shortDescription,
        keywords: product.seo?.keywords || [],
        canonical: product.seo?.canonical
      },
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString()
    }

    // Format related products
    const formattedRelatedProducts = relatedProducts.map((relProduct: any) => ({
      _id: relProduct._id,
      name: relProduct.name,
      slug: relProduct.slug,
      image: relProduct.images?.find((img: any) => img.isPrimary)?.url || relProduct.images?.[0]?.url,
      price: relProduct.price,
      comparePrice: relProduct.comparePrice,
      rating: {
        average: Math.round(relProduct.rating?.average || 0 * 10) / 10,
        count: relProduct.rating?.count || 0
      },
      quantity: relProduct.quantity || 0
    }))

    // Format reviews
    const formattedReviews = reviews.map((review: any) => ({
      _id: review._id,
      user: {
        _id: review.userId._id,
        name: review.userId.name,
        image: review.userId.image
      },
      rating: review.rating,
      title: review.title,
      content: review.content,
      helpful: review.helpful || 0,
      verified: review.verified || false,
      createdAt: review.createdAt?.toISOString()
    }))

    // Calculate stock status
    const totalStock = product.variants?.reduce((total: number, variant: any) => 
      total + (variant.quantity || 0), product.quantity || 0)
    
    const stockStatus = totalStock > 20 ? 'in-stock' : 
                     totalStock > 0 ? 'low-stock' : 
                     product.allowBackorder ? 'backorder' : 'out-of-stock'

    return NextResponse.json({
      success: true,
      data: {
        product: formattedProduct,
        relatedProducts: formattedRelatedProducts,
        reviews: formattedReviews,
        stockStatus,
        totalStock
      }
    })

  } catch (error: any) {
    console.error('Product API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}