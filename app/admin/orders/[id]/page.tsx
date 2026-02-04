'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, FileText, Download, DollarSign, CreditCard } from 'lucide-react';
import ShippingLabelGenerator from '@/components/admin/ShippingLabelGenerator';

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      sku: string;
      images?: string[];
    };
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'card' | 'paypal' | 'stripe';
  paymentStatus: 'pending' | 'confirmed' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
  processing: { icon: Package, color: 'bg-purple-100 text-purple-800', label: 'Processing' },
  shipped: { icon: Truck, color: 'bg-indigo-100 text-indigo-800', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Cancelled' }
};

export default function OrderDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'admin') {
      router.push('/auth/admin-login');
      return;
    }
    fetchOrder();
  }, [session, status, router, params.id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch order');

      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order._id,
          status: newStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update order status');

      fetchOrder();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!order) return;

    setGeneratingInvoice(true);
    try {
      const response = await fetch(`/api/admin/orders/${order._id}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to generate invoice');

      const data = await response.json();
      
      // Create and download PDF
      if (data.invoice) {
        const invoiceHTML = generateInvoiceHTML(data.invoice);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(invoiceHTML);
          printWindow.document.close();
          printWindow.print();
        }
      }

      alert('Invoice generated successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handlePaymentStatusUpdate = async (newPaymentStatus: string) => {
    if (!order) return;

    setUpdatingPayment(true);
    try {
      const response = await fetch(`/api/admin/orders/${order._id}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentStatus: newPaymentStatus,
          paymentNotes: `Payment status updated to ${newPaymentStatus} by admin`,
          collectedBy: session?.user?.name || 'Admin'
        })
      });

      if (!response.ok) throw new Error('Failed to update payment status');

      const data = await response.json();
      setOrder(data.order);
      alert(`Payment status updated to ${newPaymentStatus}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const generateInvoiceHTML = (invoice: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #333; margin: 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .info-section { background: #f9f9f9; padding: 20px; border-radius: 5px; }
          .info-section h3 { margin: 0 0 10px 0; color: #333; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background: #f5f5f5; font-weight: bold; }
          .totals { text-align: right; margin-top: 20px; }
          .totals div { margin-bottom: 5px; }
          .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TAX INVOICE</h1>
          <h2>${invoice.invoiceNumber}</h2>
        </div>

        <div class="info-grid">
          <div class="info-section">
            <h3>Bill To:</h3>
            <p><strong>${invoice.customer.name}</strong></p>
            <p>${invoice.customer.email}</p>
            <p>${invoice.customer.phone || 'N/A'}</p>
            <p>${invoice.customer.address.street}</p>
            <p>${invoice.customer.address.city}, ${invoice.customer.address.state} ${invoice.customer.address.zipCode}</p>
            <p>${invoice.customer.address.country}</p>
          </div>
          <div class="info-section">
            <h3>Order Details:</h3>
            <p><strong>Order Number:</strong> ${invoice.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(invoice.orderDate).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${invoice.paymentMethod.toUpperCase()}</p>
            <p><strong>Payment Status:</strong> ${invoice.paymentStatus}</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item: any) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.sku}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>Subtotal: $${invoice.subtotal.toFixed(2)}</div>
          <div>Tax: $${invoice.tax.toFixed(2)}</div>
          <div>Shipping: $${invoice.shipping.toFixed(2)}</div>
          ${invoice.discount > 0 ? `<div>Discount: -$${invoice.discount.toFixed(2)}</div>` : ''}
          <div class="total">Total: $${invoice.total.toFixed(2)}</div>
        </div>

        ${invoice.notes ? `
          <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 5px;">
            <h3>Notes:</h3>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;
  };

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!order) {
    return <div className="flex items-center justify-center min-h-screen">Order not found</div>;
  }

  const StatusIcon = statusConfig[order.status].icon;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${statusConfig[order.status].color}`}>
            <StatusIcon className="h-4 w-4" />
            {statusConfig[order.status].label}
          </span>
          
          {order.paymentMethod === 'cod' && (
            <Button
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded"></div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      <p className="text-sm">Quantity: {item.quantity}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">${item.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Total: ${item.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Label Generator */}
          <ShippingLabelGenerator 
            order={order} 
            onShippingUpdate={(updatedOrder) => setOrder(updatedOrder)}
          />

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Contact Details</h3>
                  <p><strong>Name:</strong> {order.customer.name}</p>
                  <p><strong>Email:</strong> {order.customer.email}</p>
                  <p><strong>Phone:</strong> {order.customer.phone}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <p>{order.customer.address.street}</p>
                  <p>
                    {order.customer.address.city}, {order.customer.address.state} {order.customer.address.zipCode}
                  </p>
                  <p>{order.customer.address.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Update Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updating}
                  >
                    {Object.keys(statusConfig).map((status) => (
                      <option key={status} value={status}>
                        {statusConfig[status as keyof typeof statusConfig].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    placeholder="Add order notes..."
                    defaultValue={order.notes}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {order.updatedAt !== order.createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p><strong>Method:</strong> {order.paymentMethod.toUpperCase()}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      order.paymentStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </p>
                </div>

                {order.paymentMethod === 'cod' && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2">Update Payment Status</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={order.paymentStatus}
                      onChange={(e) => handlePaymentStatusUpdate(e.target.value)}
                      disabled={updatingPayment}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    {updatingPayment && (
                      <p className="text-xs text-blue-600 mt-1">Updating payment status...</p>
                    )}
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  {order.paymentMethod === 'cod' 
                    ? 'Payment will be collected upon delivery'
                    : `Payment processed via ${order.paymentMethod.toUpperCase()}`
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}