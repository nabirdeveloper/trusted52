import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Order from '@/lib/models/Order'
import dbConnect from '@/lib/db/connect'
import jsPDF from 'jspdf'

// Shipping carriers configuration
const SHIPPING_CARRIERS = {
  FEDEX: { name: 'FedEx' },
  UPS: { name: 'UPS' },
  USPS: { name: 'USPS' },
  DHL: { name: 'DHL Express' }
}

function generatePDFLabel(order: any, data: any): string {
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
      return NextResponse.json({ error: 'No shipping label available for this order' }, { status: 400 })
    }

    // Generate PDF label data
    const labelData = {
      trackingNumber: order.trackingNumber,
      carrier: order.shippingCarrier || 'FedEx',
      serviceType: order.shippingService || 'Ground',
      origin: order.shippingOrigin || 'Warehouse, 123 Storage Lane, Logistics City, LC 12345',
      destination: `${order.customer.address.street}, ${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zipCode}`,
      weight: order.totalWeight || 'N/A',
      dimensions: order.packageDimensions || 'N/A',
      estimatedDelivery: order.estimatedDelivery
    }

    // Generate PDF
    const pdfBuffer = generatePDFLabel(order, labelData)

    // Return PDF for download
    return new NextResponse(pdfBuffer.split(',')[1], {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="shipping-label-${order.orderNumber}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating shipping label PDF:', error)
    return NextResponse.json({ error: 'Failed to generate shipping label PDF' }, { status: 500 })
  }
}