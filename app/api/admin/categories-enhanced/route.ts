import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/connect'
import Category from '@/lib/models/CategoryEnhanced'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()

    // Build category tree manually since static method may not be available
    const buildTree = (categories: any[], parentId: string | null = null): any[] => {
      return categories
        .filter(cat => {
          if (parentId === null) {
            return !cat.parentId
          }
          return cat.parentId?.toString() === parentId
        })
        .map(cat => ({
          ...cat,
          children: buildTree(categories, cat._id.toString())
        }))
    }

    const categoryTree = buildTree(categories)

    return NextResponse.json({
      success: true,
      data: {
        categories,
        categoryTree
      }
    })

  } catch (error) {
    console.error('Categories API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, image, parentId, metaTitle, metaDescription, isActive, sortOrder } = body

    await connectDB()

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required fields' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const categoryData = {
      name: name.trim(),
      slug: generatedSlug,
      description: description?.trim(),
      image: image?.trim(),
      parentId: parentId || null,
      level: parentId ? 2 : 1, // If has parent, it's a subcategory
      metaTitle: metaTitle?.trim(),
      metaDescription: metaDescription?.trim(),
      isActive: isActive ?? true,
      sortOrder: sortOrder || 0
    }

    const category = body._id 
      ? await Category.findByIdAndUpdate(body._id, categoryData, { new: true })
      : await Category.create(categoryData)

    return NextResponse.json({
      success: true,
      data: category
    })

  } catch (error) {
    console.error('Category POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save category' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, direction, categoryId } = await request.json()

    if (action !== 'reorder' || !categoryId) {
      return NextResponse.json(
        { error: 'Invalid action or missing categoryId' },
        { status: 400 }
      )
    }

    await connectDB()

    const category = await Category.findById(categoryId)
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Calculate new sort order
    const oldSortOrder = category.sortOrder
    const newSortOrder = direction === 'up' ? oldSortOrder - 1 : oldSortOrder + 1

    // Find sibling categories
    const siblings = await Category.find({
      parentId: category.parentId,
      _id: { $ne: categoryId },
      isActive: true
    }).sort({ sortOrder: 1 }).lean()

    // Find categories with the old sort order that will be affected
    const affectedCategories = [
      category,
      ...siblings.filter(cat => 
        (direction === 'up' && cat.sortOrder > oldSortOrder) ||
        (direction === 'down' && cat.sortOrder < oldSortOrder)
      )
    ]

    // Update all affected categories
    await Promise.all(
      affectedCategories.map((cat: any) => 
        Category.findByIdAndUpdate(cat._id, { sortOrder: cat.sortOrder })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Category reordered successfully'
    })

  } catch (error) {
    console.error('Category PUT Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryId } = await request.json()
    
    if (!categoryId) {
      return NextResponse.json({ error: 'Missing categoryId' }, { status: 400 })
    }

    await connectDB()

    const category = await Category.findById(categoryId)

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Get all descendant categories
    const getAllDescendants = async (cat: any): Promise<string[]> => {
      if (!cat.children || cat.children.length === 0) {
        return [cat._id.toString()]
      }
      
      let descendants: string[] = []
      for (const child of cat.children) {
        descendants = [...descendants, ...await getAllDescendants(child)]
      }
      return descendants
    }

    const descendantIds = await getAllDescendants(category)
    const allIdsToDelete = [categoryId, ...descendantIds]

    // Delete all descendant categories
    await Category.deleteMany({ _id: { $in: allIdsToDelete } })

    // Delete the category itself
    await Category.findByIdAndDelete(categoryId)

    return NextResponse.json({
      success: true,
      message: 'Category and all subcategories deleted successfully'
    })

  } catch (error) {
    console.error('Category DELETE Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}