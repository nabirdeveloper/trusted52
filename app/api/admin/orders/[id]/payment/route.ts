import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Order from '@/lib/models/Order'
import dbConnect from '@/lib/db/connect'

export async function PUT(
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
    const { paymentStatus, amountPaid, paymentDate, paymentNotes, collectedBy } = await request.json()

    if (!paymentStatus) {
      return NextResponse.json({ error: 'Payment status is required' }, { status: 400 })
    }

    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.paymentMethod !== 'cod') {
      return NextResponse.json({ error: 'Payment status tracking only available for COD orders' }, { status: 400 })
    }

    // Update payment information
    const updateData: any = {
      paymentStatus,
      updatedAt: new Date()
    }

    // Add payment tracking event
    const trackingEvent = {
      timestamp: new Date(),
      status: `payment_${paymentStatus}`,
      location: 'Payment Processing',
      description: `Payment status updated to ${paymentStatus}`
    }

    if (paymentStatus === 'paid') {
      updateData.actualDelivery = new Date()
      updateData.deliveredAt = new Date()
      trackingEvent.description = 'Payment collected in full'
      
      // Update order status to delivered if payment is collected
      updateData.status = 'delivered'
    } else if (paymentStatus === 'confirmed') {
      trackingEvent.description = 'Payment confirmed, ready for collection'
    }

    // Add payment details to tracking events
    if (order.trackingEvents) {
      updateData.trackingEvents = [...order.trackingEvents, trackingEvent]
    } else {
      updateData.trackingEvents = [trackingEvent]
    }

    // Add admin notes with payment details
    let adminNotes = order.adminNotes || ''
    const paymentNote = `[${new Date().toLocaleString()}] Payment Status: ${paymentStatus}`
    if (amountPaid) {
      updateData.adminNotes = `${adminNotes}\n${paymentNote} - Amount: $${amountPaid}`
    } else {
      updateData.adminNotes = `${adminNotes}\n${paymentNote}`
    }

    if (paymentNotes) {
      updateData.adminNotes += `\nPayment Notes: ${paymentNotes}`
    }

    if (collectedBy) {
      updateData.adminNotes += `\nCollected By: ${collectedBy}`
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('items.product')

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Payment status updated to ${paymentStatus}`
    })
  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
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
    const order = await Order.findById(id).populate('items.product')

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get payment history from tracking events
    const paymentHistory = order.trackingEvents
      ?.filter((event: any) => event.status.includes('payment_'))
      ?.map((event: any) => ({
        timestamp: event.timestamp,
        status: event.status.replace('payment_', ''),
        description: event.description,
        location: event.location
      })) || []

    // Calculate payment summary
    const paymentSummary = {
      currentStatus: order.paymentStatus,
      totalAmount: order.total,
      method: order.paymentMethod,
      orderDate: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      actualDelivery: order.actualDelivery,
      trackingEvents: paymentHistory,
      canUpdatePayment: order.paymentMethod === 'cod' && ['pending', 'confirmed'].includes(order.paymentStatus),
      nextAction: getNextPaymentAction(order.paymentStatus, order.status)
    }

    return NextResponse.json({
      success: true,
      order,
      paymentSummary
    })
  } catch (error) {
    console.error('Error fetching payment status:', error)
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 })
  }
}

function getNextPaymentAction(paymentStatus: string, orderStatus: string): string {
  if (paymentStatus === 'pending') {
    return 'Confirm payment is ready for collection'
  } else if (paymentStatus === 'confirmed') {
    return 'Mark payment as collected'
  } else if (paymentStatus === 'paid') {
    return 'Payment completed - order fulfilled'
  } else if (paymentStatus === 'failed') {
    return 'Investigate payment failure'
  } else if (paymentStatus === 'refunded') {
    return 'Process refund details'
  }
  return 'No action required'
}