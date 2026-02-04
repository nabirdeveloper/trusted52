import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/connect'
import Settings from '@/lib/models/Settings'
import Category from '@/lib/models/Category'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await connectDB()

    // Get settings for category showcase
    let settings = await Settings.findOne()
    
    if (!settings || !settings.homepage.categoryShowcase.length) {
      // If no settings, return top-level categories
      console.log('No settings found, fetching all top-level categories...')
      
      // Try multiple approaches to find categories
      let categories = await Category.find({ 
        parent: null,
        isActive: true 
      })
      .sort({ displayOrder: 1, name: 1 })
      .lean()

      console.log(`Approach 1 - Found ${categories.length} categories with parent=null`)

      if (categories.length === 0) {
        // Try without parent filter
        categories = await Category.find({ 
          isActive: true 
        })
        .sort({ displayOrder: 1, name: 1 })
        .lean()
        console.log(`Approach 2 - Found ${categories.length} categories with no parent filter`)
      }

      console.log(`Final categories:`, categories.map(c => ({ name: c.name, parent: c.parent, level: c.level })))
      return NextResponse.json(categories)
    }

    // Get categories from settings
    const categoryShowcase = settings.homepage.categoryShowcase
      .filter((item: any) => item.isActive)
      .sort((a: any, b: any) => a.order - b.order)

    // Populate category details
    const categoryIds = categoryShowcase.map((item: any) => item.categoryId)
    const categories = await Category.find({
      _id: { $in: categoryIds },
      isActive: true
    })
    .sort({ displayOrder: 1, name: 1 })
    .lean()

    return NextResponse.json(categories)

  } catch (error: any) {
    console.error('Failed to fetch category showcase:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category showcase' },
      { status: 500 }
    )
  }
}