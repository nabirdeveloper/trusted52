'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Barcode,
  MapPin,
  RefreshCw
} from 'lucide-react'

interface FulfillmentOrder {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
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
      name: string
      sku: string
      images?: string[]
    }
    quantity: number
    price: number
    total: number
  }>
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: 'cod' | 'card' | 'paypal' | 'stripe'
  paymentStatus: 'pending' | 'confirmed' | 'paid' | 'failed' | 'refunded'
  trackingNumber?: string
  estimatedDelivery?: Date
  createdAt: string
}

interface FulfillmentStats {
  pending: number
  confirmed: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  total: number
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
  processing: { icon: Package, color: 'bg-purple-100 text-purple-800', label: 'Processing' },
  shipped: { icon: Truck, color: 'bg-indigo-100 text-indigo-800', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Cancelled' }
}

export default function FulfillmentManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<FulfillmentOrder[]>([])
  const [stats, setStats] = useState<FulfillmentStats>({
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [filter, setFilter] = useState<string>('fulfillmentRequired')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'admin') {
      router.push('/auth/admin-login')
      return
    }
    fetchFulfillmentData()
  }, [session, status, router, filter])

  const fetchFulfillmentData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ fulfillmentRequired: 'true' })
      if (filter !== 'fulfillmentRequired') {
        params.set('status', filter)
      }

      const response = await fetch(`/api/admin/fulfillment?${params}`)
      if (!response.ok) throw new Error('Failed to fetch fulfillment data')

      const data = await response.json()
      setOrders(data.orders)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching fulfillment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFulfillmentAction = async (action: string, orderIds: string[], fulfillmentData?: any) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/fulfillment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderIds,
          action,
          fulfillmentData
        })
      })

      if (!response.ok) throw new Error('Failed to process fulfillment action')

      const result = await response.json()
      
      alert(`Processed ${result.processed} orders successfully`)
      setSelectedOrders([])
      fetchFulfillmentData()
    } catch (error) {
      console.error('Error processing fulfillment action:', error)
      alert('Failed to process fulfillment action')
    } finally {
      setProcessing(false)
    }
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(order => order._id))
    }
  }

  const canPerformAction = (action: string, order: FulfillmentOrder) => {
    switch (action) {
      case 'start_fulfillment':
        return order.status === 'confirmed'
      case 'generate_shipping_label':
        return order.status === 'processing'
      case 'mark_delivered':
        return order.status === 'shipped'
      case 'cancel_order':
        return !['delivered', 'shipped'].includes(order.status)
      default:
        return false
    }
  }

  const getAvailableActions = (order: FulfillmentOrder) => {
    const actions = []
    if (canPerformAction('start_fulfillment', order)) {
      actions.push({ key: 'start_fulfillment', label: 'Start Fulfillment', icon: Package })
    }
    if (canPerformAction('generate_shipping_label', order)) {
      actions.push({ key: 'generate_shipping_label', label: 'Generate Label', icon: Barcode })
    }
    if (canPerformAction('mark_delivered', order)) {
      actions.push({ key: 'mark_delivered', label: 'Mark Delivered', icon: CheckCircle })
    }
    if (canPerformAction('cancel_order', order)) {
      actions.push({ key: 'cancel_order', label: 'Cancel Order', icon: XCircle })
    }
    return actions
  }

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Order Fulfillment</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSelectAll}
            variant="outline"
            disabled={orders.length === 0}
          >
            {selectedOrders.length === orders.length ? 'Deselect All' : 'Select All'}
          </Button>
          {selectedOrders.length > 0 && (
            <>
              <Button
                onClick={() => handleFulfillmentAction('start_fulfillment', selectedOrders)}
                disabled={processing}
                variant="default"
              >
                <Package className="mr-2 h-4 w-4" />
                Start Fulfillment
              </Button>
              <Button
                onClick={() => handleFulfillmentAction('cancel_order', selectedOrders, { reason: 'Bulk cancellation' })}
                disabled={processing}
                variant="destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Selected
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {Object.entries(statusConfig).map(([status, config]) => (
          <Card key={status} className="text-center">
            <CardContent className="p-4">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${config.color} mb-2`}>
                <config.icon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold">{stats[status as keyof FulfillmentStats] || 0}</div>
              <div className="text-sm text-gray-600">{config.label}</div>
            </CardContent>
          </Card>
        ))}
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-800 mb-2">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="fulfillmentRequired">Need Fulfillment</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="">All Orders</option>
            </select>
            <Button
              onClick={fetchFulfillmentData}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleSelectOrder(order._id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{order.orderNumber}</h3>
                        <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${(statusConfig[order.status as keyof typeof statusConfig]).color}`}>
                          {(() => {
                            const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon;
                            return <StatusIcon className="h-3 w-3" />;
                          })()}
                          {statusConfig[order.status as keyof typeof statusConfig].label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Customer:</p>
                          <p>{order.customer.name}</p>
                          <p className="text-gray-500">{order.customer.email}</p>
                        </div>
                        <div>
                          <p className="font-medium">Items:</p>
                          <p>{order.items.length} items</p>
                          <p className="font-medium">${order.total.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Address:</p>
                          <p className="text-gray-600">{order.customer.address.street}</p>
                          <p className="text-gray-600">
                            {order.customer.address.city}, {order.customer.address.state}
                          </p>
                        </div>
                      </div>

                      {order.trackingNumber && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Tracking:</p>
                          <p>{order.trackingNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {getAvailableActions(order).map((action) => (
                      <Button
                        key={action.key}
                        size="sm"
                        variant="outline"
                        onClick={() => handleFulfillmentAction(action.key, [order._id])}
                        disabled={processing}
                        className="w-full"
                      >
                        <action.icon className="mr-2 h-4 w-4" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}