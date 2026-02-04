import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Order from '@/lib/models/Order'
import dbConnect from '@/lib/db/connect'
import jsPDF from 'jspdf'

// Shipping carriers configuration
const SHIPPING_CARRIERS = {
  FEDEX: {
    name: 'FedEx',
    services: ['Ground', 'Express', 'Overnight', 'International'],
    trackingFormat: /^[0-9]{12,14}$/
  },
  UPS: {
    name: 'UPS',
    services: ['Ground', '2nd Day Air', 'Next Day Air', 'Worldwide Express'],
    trackingFormat: /^1Z[0-9A-Z]{16}$/
  },
  USPS: {
    name: 'USPS',
    services: ['Priority Mail', 'First Class', 'Express Mail', 'Media Mail'],
    trackingFormat: /^[0-9]{20,22}$/
  },
  DHL: {
    name: 'DHL Express',
    services: ['Express Worldwide', 'Express Domestic', 'Economy Select'],
    trackingFormat: /^[0-9]{10,11}$/
  }
}

interface ShippingLabelData {
  carrier: string
  trackingNumber: string
  origin: string
  destination: string
  weight?: any
  dimensions?: any
  serviceType: string
  estimatedDelivery?: string
  notes?: string
}

function calculateEstimatedDelivery(carrier: string, serviceType: string): Date {
  const now = new Date()
  let businessDays = 0

  const deliveryTimes: Record<string, Record<string, number>> = {
    FEDEX: {
      'Ground': 5,
      'Express': 2,
      'Overnight': 1,
      'International': 7
    },
    UPS: {
      'Ground': 5,
      '2nd Day Air': 2,
      'Next Day Air': 1,
      'Worldwide Express': 7
    },
    USPS: {
      'Priority Mail': 3,
      'First Class': 3,
      'Express Mail': 1,
      'Media Mail': 7
    },
    DHL: {
      'Express Worldwide': 5,
      'Express Domestic': 2,
      'Economy Select': 7
    }
  }

  const carrierKey = carrier.toUpperCase()
  const days = deliveryTimes[carrierKey]?.[serviceType] || 5

  // Add business days (exclude weekends)
  let currentDate = new Date(now)
  while (businessDays < days) {
    currentDate.setDate(currentDate.getDate() + 1)
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      businessDays++
    }
  }

  return currentDate
}

function generatePDFLabel(order: any, data: ShippingLabelData): string {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [101.6, 152.4] // 4x6 inches in mm
  })

  // Add border
  pdf.rect(5, 5, 91.6, 142.4)

  // Header
  pdf.setFillColor(51, 51, 51)
  pdf.rect(5, 5, 91.6, 15, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('SHIPPING LABEL', 10, 12)

  // Tracking number in header
  pdf.setFontSize(8)
  pdf.text(data.trackingNumber, 90, 12, { align: 'right' })

  // Reset text color
  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'normal')

  let yPosition = 25

  // Order Information
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ORDER INFORMATION', 10, yPosition)
  yPosition += 6
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Order: ${order.orderNumber}`, 10, yPosition)
  yPosition += 4
  pdf.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 10, yPosition)
  yPosition += 4
  pdf.text(`Service: ${data.serviceType}`, 10, yPosition)
  yPosition += 8

  // From Address
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('FROM', 10, yPosition)
  yPosition += 6
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  const originLines = pdf.splitTextToSize(data.origin, 80)
  pdf.text(originLines, 10, yPosition)
  yPosition += originLines.length * 4 + 8

  // To Address
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('TO', 10, yPosition)
  yPosition += 6
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Name: ${order.customer.name}`, 10, yPosition)
  yPosition += 4
  const destLines = pdf.splitTextToSize(data.destination, 80)
  pdf.text(destLines, 10, yPosition)
  yPosition += destLines.length * 4 + 4
  pdf.text(`${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zipCode}`, 10, yPosition)
  yPosition += 4
  pdf.text(order.customer.address.country, 10, yPosition)
  yPosition += 8

  // Package Information
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('PACKAGE INFORMATION', 10, yPosition)
  yPosition += 6
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Weight: ${data.weight || 'N/A'} lbs`, 10, yPosition)
  yPosition += 4
  pdf.text(`Dimensions: ${data.dimensions || 'N/A'}`, 10, yPosition)
  yPosition += 4
  pdf.text(`Items: ${order.items.length} items`, 10, yPosition)
  yPosition += 8

  // Tracking Information Box
  pdf.setDrawColor(200, 200, 200)
  pdf.rect(10, yPosition, 81.6, 25)
  
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('TRACKING #', 10, yPosition + 5)
  
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text(data.trackingNumber, 10, yPosition + 10)
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Carrier: ${data.carrier}`, 10, yPosition + 15)
  
  if (data.estimatedDelivery) {
    pdf.text(`Est. Delivery: ${new Date(data.estimatedDelivery).toLocaleDateString()}`, 10, yPosition + 20)
  }

  // Return as base64
  return pdf.output('datauristring')
}

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
    const data: ShippingLabelData = await request.json()

    if (!data.carrier || !data.trackingNumber || !data.origin || !data.destination) {
      return NextResponse.json({ 
        error: 'Carrier, tracking number, origin, and destination are required' 
      }, { status: 400 })
    }

    // Validate carrier
    const carrierKey = data.carrier.toUpperCase()
    const carrier = SHIPPING_CARRIERS[carrierKey as keyof typeof SHIPPING_CARRIERS]
    if (!carrier) {
      return NextResponse.json({ 
        error: `Invalid carrier. Supported carriers: ${Object.keys(SHIPPING_CARRIERS).join(', ')}` 
      }, { status: 400 })
    }

    // Validate tracking number format (basic validation)
    if (carrier.trackingFormat && !carrier.trackingFormat.test(data.trackingNumber)) {
      return NextResponse.json({ 
        error: `Invalid tracking number format for ${carrier.name}` 
      }, { status: 400 })
    }

    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'processing') {
      return NextResponse.json({ 
        error: 'Order must be in processing status to generate shipping label' 
      }, { status: 400 })
    }

    // Calculate estimated delivery if not provided
    const estimatedDelivery = data.estimatedDelivery 
      ? new Date(data.estimatedDelivery) 
      : calculateEstimatedDelivery(data.carrier, data.serviceType)

    // Update order with shipping information
    const updateData = {
      trackingNumber: data.trackingNumber,
      estimatedDelivery,
      shippingCarrier: data.carrier,
      shippingService: data.serviceType,
      shippingOrigin: data.origin,
      shippingDestination: data.destination,
      // Add tracking event
      trackingEvents: [
        ...(order.trackingEvents || []),
        {
          timestamp: new Date(),
          status: 'shipped',
          location: data.origin,
          description: `Shipped via ${data.carrier} ${data.serviceType}. Tracking: ${data.trackingNumber}`,
          carrier: data.carrier,
          trackingNumber: data.trackingNumber
        }
      ]
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { ...updateData, status: 'shipped', shippedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('items.product')

    // Generate PDF shipping label
    const pdfLabel = generatePDFLabel(order, data)

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      shippingLabel: {
        pdf: pdfLabel,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        origin: data.origin,
        destination: data.destination,
        weight: data.weight,
        dimensions: data.dimensions,
        serviceType: data.serviceType,
        estimatedDelivery: data.estimatedDelivery
      },
      message: 'Shipping label generated successfully'
    })

  } catch (error) {
    console.error('Error generating shipping label:', error)
    return NextResponse.json({ error: 'Failed to generate shipping label' }, { status: 500 })
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

    if (!order.trackingNumber) {
      return NextResponse.json({
        success: false,
        canGenerateLabel: order.status === 'processing'
      })
    }

    return NextResponse.json({
      success: true,
      hasShippingLabel: !!order.trackingNumber,
      trackingInfo: {
        carrier: 'FedEx', // This would be stored with order
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt
      }
    })

  } catch (error) {
    console.error('Error fetching shipping label info:', error)
    return NextResponse.json({ error: 'Failed to fetch shipping label info' }, { status: 500 })
  }
}