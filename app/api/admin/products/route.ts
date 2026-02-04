import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import dbConnect from '@/lib/db/connect';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    const products = await Product.find(query)
      .populate('categories', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const data = await request.json();

    // Basic validation
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }
    if (!data.sku || data.sku.trim() === '') {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    }
    if (!data.description || data.description.trim() === '') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!data.price || data.price < 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }
    if (!data.category || data.category.trim() === '') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (data.stock === undefined || data.stock < 0) {
      return NextResponse.json({ error: 'Valid stock quantity is required' }, { status: 400 });
    }

    // Transform images array to match model structure
    // Handle both string array and object array formats
    const images = (data.images || []).map((img: any, index: number) => {
      if (typeof img === 'string') {
        return {
          url: img,
          alt: data.name || 'Product image',
          isPrimary: index === 0
        };
      } else {
        return {
          url: img.url || '',
          alt: img.alt || data.name || 'Product image',
          isPrimary: img.isPrimary || index === 0
        };
      }
    });

    // Transform attributes object to array format
    const attributes = data.attributes ? Object.entries(data.attributes).map(([name, value]) => ({
      name,
      value: String(value),
      type: 'text'
    })) : [];

    // Map frontend field names to model field names
    const mappedData = {
      ...data,
      images,
      categories: data.category ? [data.category] : [],
      attributes,
      quantity: data.stock || 0, // Map stock to quantity
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Handle field name mappings
    if (data.salePrice) {
      mappedData.comparePrice = data.salePrice;
    }
    if (data.stock !== undefined) {
      mappedData.quantity = data.stock;
      mappedData.trackQuantity = true;
    }

    const product = new Product(mappedData);

    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('categories', 'name slug');

    return NextResponse.json(populatedProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Product with this SKU or slug already exists' }, { status: 400 });
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}