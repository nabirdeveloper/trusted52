import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const category = await Category.findById(id)
      .populate('parent', 'name slug')
      .populate('subcategories', 'name slug');

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
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

    const data = await request.json();
    const { id } = await params;
    const oldCategory = await Category.findById(id);
    
    if (!oldCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

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

    const category = await Category.findByIdAndUpdate(
      id,
      {
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
      },
      { new: true, runValidators: true }
    )
      .populate('parent', 'name slug')
      .populate('children', 'name slug');

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 400 });
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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
    // Check if category has children
    const hasChildren = await Category.findOne({ parent: id });
    if (hasChildren) {
      return NextResponse.json({ error: 'Cannot delete category with subcategories' }, { status: 400 });
    }

    // Get category to update parent
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Remove from parent's children array
    if (category.parent) {
      await Category.findByIdAndUpdate(
        category.parent,
        { $pull: { children: id } }
      );
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}