import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get session to identify user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const orderData = await request.json();
    
    // Validate required fields
    const requiredFields = ['items', 'shippingAddress'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const { items, shippingAddress, notes } = orderData;

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart items are required' },
        { status: 400 }
      );
    }

    let totalPrice = 0;
    const orderItems = [];

    // Validate each item and calculate total
    for (const item of items) {
      // Find the product
      const product = await Product.findById(item._id);
      if (!product || !product.isActive) {
        return NextResponse.json(
          { success: false, error: `Product ${item._id} not found or inactive` },
          { status: 400 }
        );
      }

      // Find the specific variant
      const variant = product.variants.id(item.variant._id);
      if (!variant) {
        return NextResponse.json(
          { success: false, error: `Product variant not found` },
          { status: 400 }
        );
      }

      // Check stock
      if (variant.inventory < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      // Calculate prices
      const itemTotal = item.price * item.quantity;
      totalPrice += itemTotal;

      orderItems.push({
        productId: product._id,
        variantId: variant._id,
        name: product.name,
        sku: variant.sku,
        price: item.price,
        quantity: item.quantity,
        total: itemTotal,
        image: product.images[0] || null
      });

      // Update inventory
      variant.inventory -= item.quantity;
      await product.save();
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create the order
    const order = new Order({
      orderNumber,
      user: user._id,
      items: orderItems,
      totalAmount: totalPrice,
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      shippingAddress: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'Bangladesh',
        phone: shippingAddress.phone,
        email: user.email
      },
      notes: notes || '',
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    });

    await order.save();

    // Update user's order history
    user.orders.push(order._id);
    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          estimatedDelivery: order.estimatedDelivery,
          orderStatus: order.orderStatus
        }
      },
      message: 'Order placed successfully! Your order will be delivered within 5-7 business days.'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Get order by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id?: string }> }
) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = await context.params;
    const order = await Order.findById(id)
      .populate('user', 'name email')
      .lean()
      .exec();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if this order belongs to the user
    if (order.user._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { order }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}