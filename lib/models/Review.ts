import mongoose, { Schema, Document } from 'mongoose'

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  orderId?: mongoose.Types.ObjectId
  rating: number
  title: string
  content: string
  helpful: number
  verified: boolean
  isApproved: boolean
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema<IReview>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  helpful: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
reviewSchema.index({ productId: 1, isApproved: 1 })
reviewSchema.index({ userId: 1 })
reviewSchema.index({ createdAt: -1 })

// Update product rating when review is created or updated
reviewSchema.post('save', async function() {
  try {
    const Product = mongoose.model('Product')
    const productId = this.productId
    
    const [result] = await Product.aggregate([
      { $match: { _id: productId } },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'productId',
          as: 'reviews'
        }
      },
      {
        $unwind: '$reviews'
      },
      { $match: { 'reviews.isApproved': true } },
      {
        $group: {
          _id: '$_id',
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ])
    
    if (result) {
      await Product.findByIdAndUpdate(productId, {
        'rating.average': result.averageRating,
        'rating.count': result.totalReviews
      })
    }
  } catch (error) {
    console.error('Error updating product rating:', error)
  }
})

export default mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema)