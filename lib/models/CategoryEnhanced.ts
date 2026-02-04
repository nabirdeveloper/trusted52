import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICategory extends Document {
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: mongoose.Types.ObjectId
  parent?: any
  children?: ICategory[]
  level: number
  isActive: boolean
  sortOrder: number
  metaTitle?: string
  metaDescription?: string
  attributes: CategoryAttribute[]
  productCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface CategoryAttribute {
  _id: mongoose.Types.ObjectId
  name: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'
  required: boolean
  options?: string[]
  position: number
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  image: {
    type: String,
    trim: true
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: 160
  },
  attributes: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    type: {
      type: String,
      required: true,
      enum: ['text', 'number', 'boolean', 'select', 'multiselect'],
      default: 'text'
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [{
      type: String,
      trim: true
    }],
    position: {
      type: Number,
      default: 0
    }
  }],
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

// Compound index for efficient queries
categorySchema.index({ slug: 1, isActive: 1 })
categorySchema.index({ parentId: 1, isActive: 1 })
categorySchema.index({ level: 1, isActive: 1, sortOrder: 1 })

// Virtual for nested categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
  justOne: false
})

// Virtual for full category path
categorySchema.virtual('path').get(function(this: ICategory) {
  const buildPath = (category: ICategory): string[] => {
    if (!category.parent) {
      return [category.name]
    }
    return [...buildPath(category.parent), category.name]
  }

  return buildPath(this).join(' > ')
})

// Virtual for parent chain
categorySchema.virtual('parents', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'children',
  justOne: false
})

categorySchema.pre('save', async function(this: ICategory, next: any) {
  if (this.isNew && this.level === 1) {
    // Update sort order for root categories
    const CategoryModel = this.constructor as Model<ICategory>
    this.sortOrder = await CategoryModel.countDocuments({ parentId: null, isActive: true })
  }
  
  // Calculate level
  if (this.parentId && !this.level) {
    const CategoryModel = this.constructor as Model<ICategory>
    const parent = await CategoryModel.findById(this.parentId)
    this.level = (parent?.level || 0) + 1
  }

  next()
})

categorySchema.post('save', async function(this: ICategory) {
  // Update product count
  const ProductModel = mongoose.model('Product')
  const count = await ProductModel.countDocuments({ categoryId: this._id })
  const CategoryModel = mongoose.model('Category')
  await CategoryModel.findByIdAndUpdate(this._id, { productCount: count }).exec()
})

// Static methods for category operations
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean()
  const categoryMap = new Map(categories.map((cat: any) => [cat._id.toString(), cat]))

  // Build tree structure
  const rootCategories = categories.filter((cat: any) => !cat.parentId)
  const buildTree = (category: any) => {
    const children = categories.filter((cat: any) => cat.parentId?.toString() === category._id.toString())
    return {
      ...category,
      children: children.map(buildTree)
    }
  }

  return rootCategories.map(buildTree)
}

// Static method for category attributes
categorySchema.statics.getCategoryWithAttributes = async function(categoryId: string) {
  const CategoryModel = this as Model<ICategory>
  const category = await CategoryModel.findById(categoryId)
  if (!category) {
    throw new Error('Category not found')
  }

  const ProductModel = mongoose.model('Product')
  const products = await ProductModel.find({
    categoryId: categoryId,
    isActive: true
  }).select('attributes').lean()

  // Extract unique attributes from products
  const attributeMap = new Map()
  products.forEach((product: any) => {
    if (product.attributes) {
      product.attributes.forEach((attr: any) => {
        const key = `${attr.name}_${attr.type}`
        if (!attributeMap.has(key)) {
          attributeMap.set(key, {
            name: attr.name,
            type: attr.type,
            options: new Set<string>()
          })
        }
        
        // Add option values
        if (attr.value && (attr.type === 'select' || attr.type === 'multiselect')) {
          const values = attr.value.split(',').map((v: string) => v.trim())
          values.forEach((value: string) => {
            attributeMap.get(key)!.options.add(value)
          })
        } else if (attr.value && attr.type === 'number') {
          const range = attr.value.split('-').map((v: string) => parseFloat(v.trim()))
          const attrObj = attributeMap.get(key)!
          attrObj.min = Math.min(...range)
          attrObj.max = Math.max(...range)
        }
      })
    }
  })

  // Convert Map to array
  const attributes = Array.from(attributeMap.values()).map((attr: any) => ({
    _id: new mongoose.Types.ObjectId(),
    ...attr,
    options: Array.from(attr.options),
    min: attr.min,
    max: attr.max
  }))

  return {
    ...category.toObject(),
    attributes
  };
}

// Static method to get category filter options
categorySchema.statics.getFilterOptions = async function() {
  const categories = await this.find({ isActive: true }).select('name slug level parentId').lean()
  
  const buildFilterTree = (categories: any[], level: number): any[] => {
    const currentLevel = categories.filter((cat: any) => cat.level === level)
    
    if (currentLevel.length === 0) return []
    
    const grouped = currentLevel.reduce((acc: any, cat: any) => {
      const parentId = cat.parentId?.toString()
      if (!acc[parentId]) {
        acc[parentId] = []
      }
      acc[parentId].push(cat)
      return acc
    }, {} as Record<string, any[]>)

    return Object.keys(grouped).map(parentId => ({
      parentId: parentId || 'root',
      categoryName: categories.find((cat: any) => cat._id.toString() === parentId)?.name || 'Root',
      children: grouped[parentId] || []
    }))
  }

  const level1Filters = buildFilterTree(categories, 1)
  const level2Filters = buildFilterTree(categories, 2)
  const level3Filters = buildFilterTree(categories, 3)

  return [
    {
      level: 1,
      categories: level1Filters
    },
    {
      level: 2,
      categories: level2Filters
    },
    {
      level: 3,
      categories: level3Filters
    }
  ]
}

export default mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema)