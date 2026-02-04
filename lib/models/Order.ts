import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IOrder extends Document {
  orderNumber: string
  customer: {
    _id: Types.ObjectId
    name: string
    email: string
    phone?: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }
  items: Array<{
    product: Types.ObjectId
    name: string
    sku: string
    quantity: number
    price: number
    variant?: string
    image?: string
  }>
  quantities: Array<{
    quantity: number
    price: number
    subtotal: number
    discount?: number
  }>
  subtotal: number
  tax: number
  shipping: number
  discount?: number
  total: number
  notes?: string
  paymentMethod: 'cod' | 'card' | 'paypal' | 'stripe'
  paymentStatus: 'pending' | 'confirmed' | 'paid' | 'failed' | 'refunded'
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  deliveryType: 'standard' | 'express' | 'overnight'
  deliveryAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  trackingNumber?: string
  estimatedDelivery?: Date
  actualDelivery?: Date
  deliveredAt?: Date
  shippedAt?: Date
  completedAt?: Date
  cancelledAt?: Date
  refundedAt?: Date
  trackingEvents?: Array<{
    timestamp: Date
    status: string
    location: string
    description: string
  }>
  adminNotes?: string
  createdAt: Date
  updatedAt: Date
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum DeliveryType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight'
}

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  customer: {
    _id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 },
    address: {
      street: { type: String, required: true, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      state: { type: String, required: true, trim: true, maxlength: 100 },
      zipCode: { type: String, required: true, trim: true, maxlength: 20 },
      country: { type: String, required: true, trim: true, maxlength: 100 }
    }
  },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    variant: { type: String, trim: true },
    image: { type: String }
  }],
  quantities: [{
    quantity: { type: Number, required: true, default: 1, min: 1 },
    price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, default: 0, min: 0 },
    discount: { type: Number, min: 0 }
  }],
  subtotal: { type: Number, required: true, default: 0, min: 0 },
  tax: { type: Number, required: true, default: 0, min: 0 },
  shipping: { type: Number, required: true, default: 0, min: 0 },
  discount: { type: Number, min: 0 },
  total: { type: Number, required: true, default: 0, min: 0 },
  notes: { type: String, trim: true, maxlength: 1000 },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'card', 'paypal', 'stripe'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  },
  deliveryType: {
    type: String,
    required: true,
    enum: Object.values(DeliveryType),
    default: DeliveryType.STANDARD
  },
  deliveryAddress: {
    street: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    zipCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 100 }
  },
  trackingNumber: {
    type: String,
    trim: true,
    maxlength: 100
  },
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  shippedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  trackingEvents: [{
    timestamp: { type: Date, required: true },
    status: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true }
  }],
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

// Indexes for efficient queries
orderSchema.index({ 'customer._id': 1, status: 1 })
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ 'customer.email': 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ paymentStatus: 1, status: 1 })

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(this: IOrder, next: any) {
  if (this.isNew && !this.orderNumber) {
    try {
      const OrderModel = this.constructor as any;
      const count = await OrderModel.countDocuments();
      this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      // Fallback to timestamp-based order number
      this.orderNumber = `ORD-${Date.now()}`;
    }
  }
  next();
});

// Virtual for calculating total based on items
orderSchema.virtual('calculatedTotal').get(function() {
  return this.subtotal + this.tax + this.shipping - (this.discount || 0);
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema)