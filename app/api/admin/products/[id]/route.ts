import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import dbConnect from '@/lib/db/connect';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;

    const product = await Product.findById(id)
      .populate('categories', 'name slug');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;

    const data = await request.json();
    
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

    // Map frontend field names to model field names
    const mappedData = {
      ...data,
      images,
      categories: data.category ? [data.category] : [],
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
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

    const product = await Product.findByIdAndUpdate(
      id,
      mappedData,
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Product with this SKU or slug already exists' }, { status: 400 });
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}