import mongoose, { Document, Schema } from "mongoose"

export interface IProduct extends Document {
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number
  comparePrice?: number
  sku: string
  trackQuantity: boolean
  quantity: number
  allowBackorder: boolean
  images: {
    url: string
    alt: string
    isPrimary: boolean
  }[]
  categories: mongoose.Types.ObjectId[]
  attributes: {
    name: string
    value: string
    type: 'text' | 'number' | 'boolean' | 'select'
  }[]
  variants?: {
    name: string
    options: string[]
    price?: number
    sku?: string
    image?: string
  }[]
  seo: {
    title?: string
    description?: string
    keywords?: string[]
  }
  status: 'active' | 'draft' | 'archived'
  featured: boolean
  trending: boolean
  tags: string[]
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  rating: {
    average: number
    count: number
  }
  salesCount: number
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [200, "Name cannot exceed 200 characters"]
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
    required: [true, "Description is required"]
  },
  shortDescription: {
    type: String,
    maxlength: [500, "Short description cannot exceed 500 characters"]
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
  },
  comparePrice: {
    type: Number,
    min: [0, "Compare price cannot be negative"]
  },
  sku: {
    type: String,
    required: [true, "SKU is required"],
    unique: true,
    uppercase: true,
    trim: true
  },
  trackQuantity: {
    type: Boolean,
    default: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, "Quantity cannot be negative"],
    default: 0
  },
  allowBackorder: {
    type: Boolean,
    default: false
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  attributes: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select'],
      default: 'text'
    }
  }],
  variants: [{
    name: {
      type: String,
      required: true
    },
    options: [{
      type: String,
      required: true
    }],
    price: Number,
    sku: String,
    image: String
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  tags: [String],
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  salesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Index for search
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' })
ProductSchema.index({ status: 1, featured: 1 })
ProductSchema.index({ categories: 1 })
ProductSchema.index({ price: 1 })
ProductSchema.index({ 'rating.average': -1 })
ProductSchema.index({ salesCount: -1 })
ProductSchema.index({ createdAt: -1 })

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)