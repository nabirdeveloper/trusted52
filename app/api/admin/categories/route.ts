import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const includeSubcategories = searchParams.get('includeSubcategories') === 'true';

    let categories;
    
    if (includeSubcategories) {
      categories = await Category.find({ parent: null })
        .populate({
          path: 'children',
          populate: {
            path: 'children'
          }
        })
        .sort({ displayOrder: 1, name: 1 });
    } else {
      categories = await Category.find({})
        .populate('parent', 'name slug')
        .sort({ displayOrder: 1, name: 1 });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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

    // Generate path based on parent
    let path = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let level = 0;
    
    if (data.parent && data.parent !== '') {
      const parentCategory = await Category.findById(data.parent);
      if (parentCategory) {
        path = `${parentCategory.path}/${path}`;
        level = parentCategory.level + 1;
      }
    }

    const category = new Category({
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: data.description || '',
      image: data.image || '',
      parent: data.parent && data.parent !== '' ? data.parent : undefined,
      level,
      path,
      seo: data.seo || {},
      isActive: data.isActive !== undefined ? data.isActive : true,
      displayOrder: data.displayOrder || 0,
      filters: data.filters || []
    });

    await category.save();

    // Update parent's children array
    if (data.parent && data.parent !== '') {
      await Category.findByIdAndUpdate(
        data.parent,
        { $push: { children: category._id } }
      );
    }

    const populatedCategory = await Category.findById(category._id)
      .populate('parent', 'name slug')
      .populate('children', 'name slug');

    return NextResponse.json(populatedCategory, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 400 });
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}