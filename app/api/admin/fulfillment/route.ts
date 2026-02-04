import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Order from '@/lib/models/Order'
import Product from '@/lib/models/Product'
import dbConnect from '@/lib/db/connect'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { orderIds, action, fulfillmentData } = await request.json()

    if (!orderIds || !action) {
      return NextResponse.json({ error: 'Order IDs and action are required' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const orderId of orderIds) {
      try {
        const order = await Order.findById(orderId).populate('items.product')

        if (!order) {
          errors.push({ orderId, error: 'Order not found' })
          continue
        }

        let updateData: any = { updatedAt: new Date() }
        let trackingEvent: any = {}

        switch (action) {
          case 'start_fulfillment':
            if (order.status !== 'confirmed') {
              errors.push({ orderId: order.orderNumber, error: 'Order must be confirmed to start fulfillment' })
              continue
            }
            
            updateData.status = 'processing'
            updateData.shippedAt = new Date()
            trackingEvent = {
              timestamp: new Date(),
              status: 'processing',
              location: 'Fulfillment Center',
              description: 'Order processing started'
            }
            
            // Reserve inventory
            await reserveInventory(order)
            break

          case 'generate_shipping_label':
            if (!fulfillmentData?.trackingNumber || !fulfillmentData?.carrier) {
              errors.push({ orderId: order.orderNumber, error: 'Tracking number and carrier required for shipping label' })
              continue
            }
            
            updateData.status = 'shipped'
            updateData.trackingNumber = fulfillmentData.trackingNumber
            updateData.estimatedDelivery = fulfillmentData.estimatedDelivery
            
            trackingEvent = {
              timestamp: new Date(),
              status: 'shipped',
              location: fulfillmentData.origin || 'Fulfillment Center',
              description: `Shipped via ${fulfillmentData.carrier} - Tracking: ${fulfillmentData.trackingNumber}`
            }
            break

          case 'mark_delivered':
            updateData.status = 'delivered'
            updateData.actualDelivery = new Date()
            updateData.deliveredAt = new Date()
            
            // Update payment status for COD orders
            if (order.paymentMethod === 'cod') {
              updateData.paymentStatus = 'paid'
            }
            
            trackingEvent = {
              timestamp: new Date(),
              status: 'delivered',
              location: fulfillmentData.deliveryLocation || 'Customer Address',
              description: 'Order delivered successfully'
            }
            
            // Release inventory reservation
            await releaseInventoryReservation(order)
            break

          case 'cancel_order':
            if (['delivered', 'shipped'].includes(order.status)) {
              errors.push({ orderId: order.orderNumber, error: 'Cannot cancel shipped or delivered orders' })
              continue
            }
            
            updateData.status = 'cancelled'
            updateData.cancelledAt = new Date()
            
            trackingEvent = {
              timestamp: new Date(),
              status: 'cancelled',
              location: 'Fulfillment Center',
              description: fulfillmentData.reason || 'Order cancelled'
            }
            
            // Release inventory reservation
            await releaseInventoryReservation(order)
            break

          default:
            errors.push({ orderId: order.orderNumber, error: 'Invalid fulfillment action' })
            continue
        }

        // Add tracking event
        if (Object.keys(trackingEvent).length > 0) {
          updateData.trackingEvents = [...(order.trackingEvents || []), trackingEvent]
        }

        // Add admin notes
        let adminNotes = order.adminNotes || ''
        const actionNote = `[${new Date().toLocaleString()}] ${action.replace(/_/g, ' ').toUpperCase()}`
        if (fulfillmentData?.notes) {
          updateData.adminNotes = `${adminNotes}\n${actionNote}\nNotes: ${fulfillmentData.notes}`
        } else {
          updateData.adminNotes = `${adminNotes}\n${actionNote}`
        }

        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          updateData,
          { new: true, runValidators: true }
        ).populate('items.product')

        results.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: updatedOrder.status,
          message: `Order ${order.orderNumber} fulfillment action completed`
        })

      } catch (error) {
        console.error(`Error processing order ${orderId}:`, error)
        errors.push({ orderId, error: 'Failed to process fulfillment action' })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      processed: results.length,
      failed: errors.length,
      message: `Processed ${results.length} orders successfully, ${errors.length} failed`
    })

  } catch (error) {
    console.error('Error in order fulfillment:', error)
    return NextResponse.json({ error: 'Failed to process fulfillment' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const fulfillmentRequired = searchParams.get('fulfillmentRequired')

    let query: any = {}
    
    if (status) {
      query.status = status
    }

    if (fulfillmentRequired === 'true') {
      query.status = { $in: ['confirmed', 'processing'] }
    }

    const orders = await Order.find(query)
      .populate('items.product')
      .sort({ createdAt: 1 }) // Oldest first for fulfillment queue

    const fulfillmentStats = await getFulfillmentStats()

    return NextResponse.json({
      success: true,
      orders,
      stats: fulfillmentStats,
      count: orders.length
    })

  } catch (error) {
    console.error('Error fetching fulfillment data:', error)
    return NextResponse.json({ error: 'Failed to fetch fulfillment data' }, { status: 500 })
  }
}

async function reserveInventory(order: any) {
  try {
    for (const item of order.items) {
      const product = await Product.findById(item.product._id)
      if (product) {
        // Decrease stock quantity
        product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity)
        await product.save()
      }
    }
  } catch (error) {
    console.error('Error reserving inventory:', error)
  }
}

async function releaseInventoryReservation(order: any) {
  try {
    for (const item of order.items) {
      const product = await Product.findById(item.product._id)
      if (product) {
        // Restore stock quantity
        product.stockQuantity += item.quantity
        await product.save()
      }
    }
  } catch (error) {
    console.error('Error releasing inventory reservation:', error)
  }
}

async function getFulfillmentStats() {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const statsMap = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count
      return acc
    }, {})

    return {
      pending: statsMap.pending || 0,
      confirmed: statsMap.confirmed || 0,
      processing: statsMap.processing || 0,
      shipped: statsMap.shipped || 0,
      delivered: statsMap.delivered || 0,
      cancelled: statsMap.cancelled || 0,
      total: Object.values(statsMap).reduce((sum: number, count: any) => sum + count, 0)
    }
  } catch (error) {
    console.error('Error getting fulfillment stats:', error)
    return {}
  }
}