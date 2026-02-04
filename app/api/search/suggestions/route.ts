import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Product from '@/lib/models/Product';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { query } = await request.json();
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
        { 'variants.sku': { $regex: query, $options: 'i' } }
      ]
    })
    .populate('categoryId', 'name slug')
    .select('name slug images variants tags categoryId')
    .limit(10)
    .lean()
    .exec();

    const suggestions = products.map(product => {
      const lowestPriceVariant = product.variants.reduce((min: any, variant: any) => {
        return variant.price < (min?.price || Infinity) ? variant : min;
      }, null);

      return {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0] || null,
        price: lowestPriceVariant?.price || 0,
        category: (product as any).categoryId?.name || '',
        tags: product.tags || []
      };
    });

    return NextResponse.json({
      success: true,
      data: { suggestions }
    });

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}