import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Order from '@/lib/models/Order'
import dbConnect from '@/lib/db/connect'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { id } = await params
    const order = await Order.findById(id).populate('items.product')

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.paymentMethod !== 'cod') {
      return NextResponse.json({ error: 'Invoice generation only available for COD orders' }, { status: 400 })
    }

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      customer: order.customer,
      items: order.items.map((item: any) => ({
        name: item.name || item.product?.name || 'Unknown Product',
        sku: item.sku || item.product?.sku || 'N/A',
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount || 0,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      orderDate: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      notes: order.notes
    }

    return NextResponse.json({
      success: true,
      invoice: invoiceData,
      message: 'Invoice generated successfully'
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { id } = await params
    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if invoice already exists (you could store invoice in a separate collection)
    const invoiceData = {
      invoiceNumber: `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      customer: order.customer,
      items: order.items.map((item: any) => ({
        name: item.name || 'Unknown Product',
        sku: item.sku || 'N/A',
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount || 0,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      orderDate: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      notes: order.notes
    }

    return NextResponse.json({
      success: true,
      invoice: invoiceData
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}