import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Category slug is required' },
        { status: 400 }
      );
    }

    // Find category by slug
    const category = await Category.findOne({ 
      slug, 
      isActive: true 
    })
      .populate({
        path: 'parentId',
        select: 'name slug'
      })
      .lean()
      .exec();

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    const search = searchParams.get('search') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const inStock = searchParams.get('inStock') === 'true';

    // Get all category IDs (this category + subcategories)
    const allCategoryIds = [category._id];
    
    // Find all subcategories recursively
    const findSubcategories = async (parentId: any) => {
      const subcategories = await Category.find({ 
        parentId, 
        isActive: true 
      }).select('_id').lean();
      
      for (const subcat of subcategories) {
        allCategoryIds.push(subcat._id);
        await findSubcategories(subcat._id);
      }
    };
    
    await findSubcategories(category._id);

    // Build product filter
    let filter: any = {
      categoryId: { $in: allCategoryIds },
      isActive: true,
      'variants.0': { $exists: true }
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    filter['variants.price'] = {
      $gte: minPrice,
      $lte: maxPrice
    };

    if (minRating > 0) {
      filter.averageRating = { $gte: minRating };
    }

    if (inStock) {
      filter['variants.inventory'] = { $gt: 0 };
    }

    // Get products in this category
    const products = await Product.find(filter)
      .select('name slug description images variants averageRating reviewCount isNew isFeatured tags createdAt')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await Product.countDocuments(filter);

    // Format products
    const formattedProducts = products.map(product => {
      const lowestPriceVariant = product.variants.reduce((min: any, variant: any) => {
        return variant.price < (min?.price || Infinity) ? variant : min;
      }, null);

      const totalStock = product.variants.reduce((total: number, variant: any) => {
        return total + (variant.inventory || 0);
      }, 0);

      return {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        image: product.images?.[0] || null,
        images: product.images,
        price: lowestPriceVariant?.price || 0,
        originalPrice: lowestPriceVariant?.originalPrice || lowestPriceVariant?.price || 0,
        discount: lowestPriceVariant?.originalPrice ? 
          Math.round(((lowestPriceVariant.originalPrice - lowestPriceVariant.price) / lowestPriceVariant.originalPrice) * 100) : 0,
        averageRating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0,
        inStock: totalStock > 0,
        totalStock,
        isNew: product.isNew || false,
        isFeatured: product.isFeatured || false,
        tags: product.tags || [],
        createdAt: product.createdAt
      };
    });

    // Get subcategories for filtering
    const subcategories = await Category.find({ 
      parentId: category._id, 
      isActive: true 
    })
      .select('name slug image')
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          parent: category.parentId,
          subcategories,
          filters: category.filters || [],
          seo: category.seo || {}
        },
        products: formattedProducts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
          limit
        },
        filters: {
          search,
          minPrice,
          maxPrice,
          minRating,
          sortBy,
          sortOrder,
          inStock
        }
      }
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}