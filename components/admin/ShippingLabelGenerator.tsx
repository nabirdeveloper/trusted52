'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Package, 
  Truck, 
  FileText, 
  Download, 
  CheckCircle,
  Clock,
  MapPin,
  Weight,
  Box
} from 'lucide-react'

interface Order {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
    phone: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }
  items: Array<{
    product: {
      _id: string
      name: string
      sku: string
      images?: string[]
    }
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: 'cod' | 'card' | 'paypal' | 'stripe'
  paymentStatus: 'pending' | 'confirmed' | 'paid' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
  notes?: string
  trackingNumber?: string
  shippingCarrier?: string
  shippingService?: string
  estimatedDelivery?: string
  shippedAt?: string
}

interface ShippingLabelGeneratorProps {
  order: Order
  onShippingUpdate?: (order: Order) => void
}

const SHIPPING_CARRIERS = [
  { value: 'FEDEX', label: 'FedEx', services: ['Ground', 'Express', 'Overnight', 'International'] },
  { value: 'UPS', label: 'UPS', services: ['Ground', '2nd Day Air', 'Next Day Air', 'Worldwide Express'] },
  { value: 'USPS', label: 'USPS', services: ['Priority Mail', 'First Class', 'Express Mail', 'Media Mail'] },
  { value: 'DHL', label: 'DHL Express', services: ['Express Worldwide', 'Express Domestic', 'Economy Select'] }
]

export default function ShippingLabelGenerator({ order, onShippingUpdate }: ShippingLabelGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [formData, setFormData] = useState({
    carrier: order.shippingCarrier || 'FEDEX',
    serviceType: order.shippingService || 'Ground',
    trackingNumber: order.trackingNumber || '',
    origin: 'Warehouse, 123 Storage Lane, Logistics City, LC 12345',
    destination: `${order.customer.address.street}, ${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zipCode}`,
    weight: '',
    dimensions: '',
    estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
    notes: ''
  })

  const [generatedLabel, setGeneratedLabel] = useState<any>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCarrierChange = (carrier: string) => {
    const selectedCarrier = SHIPPING_CARRIERS.find(c => c.value === carrier)
    setFormData(prev => ({
      ...prev,
      carrier,
      serviceType: selectedCarrier?.services[0] || 'Ground'
    }))
  }

  const generateLabel = async () => {
    if (!formData.trackingNumber) {
      alert('Please enter a tracking number')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch(`/api/admin/orders/${order._id}/shipping-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedLabel(data.shippingLabel)
        if (onShippingUpdate) {
          onShippingUpdate(data.order)
        }
      } else {
        alert(data.error || 'Failed to generate shipping label')
      }
    } catch (error) {
      console.error('Error generating shipping label:', error)
      alert('Failed to generate shipping label')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadLabel = async () => {
    setIsDownloading(true)

    try {
      const response = await fetch(`/api/admin/orders/${order._id}/shipping-label/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `shipping-label-${order.orderNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to download shipping label')
      }
    } catch (error) {
      console.error('Error downloading shipping label:', error)
      alert('Failed to download shipping label')
    } finally {
      setIsDownloading(false)
    }
  }

  const hasShippingLabel = order.trackingNumber && order.shippingCarrier

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasShippingLabel ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Shipping label generated</span>
                </div>
                <Badge variant="secondary">{order.shippingCarrier}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Tracking Number</Label>
                  <p className="font-medium">{order.trackingNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Service</Label>
                  <p className="font-medium">{order.shippingService}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Est. Delivery</Label>
                  <p className="font-medium">
                    {order.estimatedDelivery 
                      ? new Date(order.estimatedDelivery).toLocaleDateString()
                      : 'Not calculated'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Shipped Date</Label>
                  <p className="font-medium">
                    {order.shippedAt 
                      ? new Date(order.shippedAt).toLocaleDateString()
                      : 'Not shipped'
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={downloadLabel} 
                  disabled={isDownloading}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>
                <Button 
                  onClick={() => window.open(`/track/${order.trackingNumber}`, '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Track Package
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Shipping Label Yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate a shipping label to start the fulfillment process
              </p>
              {order.status !== 'processing' && (
                <Badge variant="outline" className="text-orange-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Order must be in "processing" status
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate New Label Form */}
      {!hasShippingLabel && order.status === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Shipping Label</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="carrier">Carrier</Label>
                <Select value={formData.carrier} onValueChange={handleCarrierChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_CARRIERS.map((carrier) => (
                      <SelectItem key={carrier.value} value={carrier.value}>
                        {carrier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="serviceType">Service Type</Label>
                <Select 
                  value={formData.serviceType} 
                  onValueChange={(value) => handleInputChange('serviceType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_CARRIERS
                      .find(c => c.value === formData.carrier)
                      ?.services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="trackingNumber">Tracking Number *</Label>
              <Input
                id="trackingNumber"
                value={formData.trackingNumber}
                onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                placeholder="Enter tracking number"
                required
              />
            </div>

            <div>
              <Label htmlFor="origin">Origin Address</Label>
              <Textarea
                id="origin"
                value={formData.origin}
                onChange={(e) => handleInputChange('origin', e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="destination">Destination Address</Label>
              <Textarea
                id="destination"
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="0.0"
                  type="number"
                  step="0.1"
                />
              </div>

              <div>
                <Label htmlFor="dimensions">Dimensions (L×W×H)</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="12x12x6"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={formData.estimatedDelivery}
                onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
              />
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button 
                onClick={generateLabel} 
                disabled={isGenerating || !formData.trackingNumber}
                className="flex-1"
              >
                <Package className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Label'}
              </Button>
              
              {generatedLabel && (
                <Button 
                  onClick={downloadLabel} 
                  disabled={isDownloading}
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Order Number</Label>
                <p className="font-medium">{order.orderNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Items</Label>
                <p className="font-medium">{order.items.length} items</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Delivery to:</span>
                <span className="font-medium">{order.customer.name}</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                {order.customer.address.street}<br />
                {order.customer.address.city}, {order.customer.address.state} {order.customer.address.zipCode}<br />
                {order.customer.address.country}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}