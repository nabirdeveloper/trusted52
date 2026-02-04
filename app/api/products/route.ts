import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Product from '@/lib/models/Product'
import Category from '@/lib/models/Category'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Search filters
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
    const minRating = parseFloat(searchParams.get('minRating') || '0')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1
    const inStock = searchParams.get('inStock') === 'true'

    // Build filter query
    let filter: any = {
      status: 'active'
    }

    // Search query - search in name, description, tags
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { 'variants.sku': { $regex: search, $options: 'i' } }
      ]
    }

    // Category filter
    if (category && category !== 'all') {
      const categoryDoc = await Category.findOne({ slug: category, status: 'active' })
      if (categoryDoc) {
        filter.categories = categoryDoc._id
      }
    }

    // Price range filter - combine with existing filters
    if (minPrice > 0 || maxPrice < 999999) {
      const priceFilter = {
        $or: [
          { price: { $gte: minPrice, $lte: maxPrice } },
          { comparePrice: { $gte: minPrice, $lte: maxPrice } }
        ]
      }
      // If we already have filters, add price filter to them
      if (filter.$or) {
        filter = {
          ...filter,
          $and: [filter, priceFilter]
        }
      } else {
        filter = {
          ...filter,
          ...priceFilter
        }
      }
    }

    // Rating filter
    if (minRating > 0) {
      filter['rating.average'] = { $gte: minRating }
    }

    // Availability filter
    if (inStock) {
      filter.quantity = { $gt: 0 }
    }

    // Sorting
    const sortField = sortBy === 'price' || sortBy === '-price' ? 'price' : sortBy
    const sortDirection = sortBy === 'price' && sortOrder === -1 ? 1 : sortBy === '-price' && sortOrder === 1 ? -1 : sortOrder

    // Count total matching products for pagination
    const totalProducts = await Product.countDocuments(filter)

    // Fetch products with filters and sorting
    const products = await Product.find(filter)
      .populate('categories', 'name slug')
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()

    // Format product data for frontend
    const formattedProducts = products.map(product => {
      const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0]

      return {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        image: primaryImage?.url || null,
        images: product.images?.map((img: any) => img.url) || [],
        price: product.price,
        originalPrice: product.comparePrice || product.price,
        discount: product.comparePrice && product.comparePrice > product.price 
          ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
          : 0,
        averageRating: Math.round(product.rating?.average || 0),
        reviewCount: product.rating?.count || 0,
        inStock: (product.quantity || 0) > 0,
        isNew: product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 1000),
        isFeatured: product.featured || false,
        tags: product.tags || [],
        createdAt: product.createdAt.toISOString()
      }
    })

    const totalPages = Math.ceil(totalProducts / limit)

    return NextResponse.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          hasNextPage: page * limit < totalProducts,
          hasPreviousPage: page > 1,
          limit
        },
        filters: {
          search,
          category,
          minPrice,
          maxPrice,
          minRating,
          sortBy,
          sortOrder,
          inStock
        }
      }
    })

  } catch (error: any) {
    console.error('Products API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}