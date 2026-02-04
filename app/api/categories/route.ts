import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Category from '@/lib/models/Category';

export async function GET() {
  try {
    await dbConnect();

    // Get all parent categories (categories without a parent)
    const categories = await Category.find({
      parentId: null,
      isActive: true
    })
      .populate({
        path: 'children',
        match: { isActive: true },
        select: 'name slug image parentId'
      })
      .select('name slug image description parentId')
      .lean()
      .exec();

    // Format categories with recursive structure
    const formatCategories = (cats: any[]): any[] => {
      return cats.map(cat => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        description: cat.description,
        subcategories: cat.children || [],
        url: `/categories/${cat.slug}`
      }));
    };

    const formattedCategories = formatCategories(categories);

    return NextResponse.json({
      success: true,
      data: {
        categories: formattedCategories
      }
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}