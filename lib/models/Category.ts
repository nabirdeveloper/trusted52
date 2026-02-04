import mongoose, { Document, Schema } from "mongoose"

export interface ICategory extends Document {
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  parent?: mongoose.Types.ObjectId
  level: number
  path: string
  children: mongoose.Types.ObjectId[]
  seo: {
    title?: string
    description?: string
    keywords?: string[]
  }
  isActive: boolean
  displayOrder: number
  filters: {
    name: string
    type: 'range' | 'select' | 'color' | 'boolean'
    options?: string[]
    min?: number
    max?: number
    unit?: string
  }[]
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },
  image: String,
  icon: String,
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: 0
  },
  path: {
    type: String,
    required: true
  },
  children: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  filters: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['range', 'select', 'color', 'boolean'],
      required: true
    },
    options: [String],
    min: Number,
    max: Number,
    unit: String
  }]
}, {
  timestamps: true
})

// Indexes
CategorySchema.index({ parent: 1 })
CategorySchema.index({ level: 1 })
CategorySchema.index({ isActive: 1, displayOrder: 1 })
CategorySchema.index({ name: 'text' })

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)