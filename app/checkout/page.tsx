'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Truck, 
  Shield, 
  Clock,
  Check,
  Package
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/hooks/useCart';
import { emailService } from '@/hooks/useEmailNotifications';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface PlaceOrderRequest {
  items: Array<{
    _id: string;
    variant: {
      _id: string;
    };
    price: number;
    quantity: number;
  }>;
  shippingAddress: ShippingAddress;
  notes?: string;
}

interface OrderResponse {
  success: boolean;
  data?: {
    order: {
      _id: string;
      orderNumber: string;
      totalAmount: number;
      estimatedDelivery: string;
      orderStatus: string;
    };
  };
  message?: string;
  error?: string;
}

const STEPS = [
  { id: 'shipping', label: 'Shipping Address', icon: Truck },
  { id: 'review', label: 'Review Order', icon: ShoppingCart },
  { id: 'confirmation', label: 'Confirmation', icon: Check },
];

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, totalItems, totalPrice, totalDiscount, clearCart } = useCart();
  
  const [currentStep, setCurrentStep] = useState<'shipping' | 'review' | 'confirmation'>('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Bangladesh',
    phone: '',
  });
  
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/checkout');
    }
  }, [status, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (status === 'authenticated' && items.length === 0 && !orderPlaced) {
      router.push('/products');
    }
  }, [items, status, router, orderPlaced]);

  const validateShippingAddress = (): boolean => {
    const newErrors: Partial<ShippingAddress> = {};
    
    if (!shippingAddress.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!shippingAddress.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!shippingAddress.address.trim()) newErrors.address = 'Address is required';
    if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
    if (!shippingAddress.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!shippingAddress.phone.trim()) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShippingAddress()) {
      setCurrentStep('review');
    }
  };

  const handlePlaceOrder = async () => {
    if (!session?.user) return;

    setIsSubmitting(true);
    
    try {
      const orderRequest: PlaceOrderRequest = {
        items: items.map(item => ({
          _id: item._id,
          variant: {
            _id: item.variant._id
          },
          price: item.price,
          quantity: item.quantity,
        })),
        shippingAddress,
        notes: notes.trim() || undefined,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderRequest),
      });

      const result: OrderResponse = await response.json();

      if (result.success && result.data) {
        setOrderData(result.data.order);
        setOrderPlaced(true);
        setCurrentStep('confirmation');
        
        // Send email notification
        emailService.sendOrderConfirmation({
          orderNumber: result.data.order.orderNumber,
          customerName: session.user?.name || 'Customer',
          customerEmail: session.user?.email || '',
          totalAmount: result.data.order.totalAmount,
          paymentMethod: 'Cash on Delivery',
          estimatedDelivery: result.data.order.estimatedDelivery,
          items: items,
        });
        
        clearCart();
      } else {
        alert(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || (items.length === 0 && !orderPlaced)) {
    return null; // Will redirect via useEffect
  }

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = (currentStep === 'review' && step.id === 'shipping') || 
                            (currentStep === 'confirmation' && (step.id === 'shipping' || step.id === 'review'));
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  transition-colors duration-300
                  ${isActive ? 'bg-blue-600 text-white' : 
                    isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-sm font-medium mt-2 text-center">
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-4 transition-colors duration-300
                  ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderShippingForm = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Cash on Delivery (COD)</h3>
        <p className="text-blue-700 text-sm">
          Pay when you receive your order. No additional charges for COD payments.
        </p>
      </div>

      <form onSubmit={handleShippingSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={shippingAddress.firstName}
              onChange={(e: any) => setShippingAddress(prev => ({ 
                ...prev, 
                firstName: e.target.value 
              }))}
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={shippingAddress.lastName}
              onChange={(e) => setShippingAddress(prev => ({ 
                ...prev, 
                lastName: e.target.value 
              }))}
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="address">Street Address *</Label>
          <Input
            id="address"
            value={shippingAddress.address}
            onChange={(e) => setShippingAddress(prev => ({ 
              ...prev, 
              address: e.target.value 
            }))}
            className={errors.address ? 'border-red-500' : ''}
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={shippingAddress.city}
              onChange={(e) => setShippingAddress(prev => ({ 
                ...prev, 
                city: e.target.value 
              }))}
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              value={shippingAddress.postalCode}
              onChange={(e) => setShippingAddress(prev => ({ 
                ...prev, 
                postalCode: e.target.value 
              }))}
              className={errors.postalCode ? 'border-red-500' : ''}
            />
            {errors.postalCode && (
              <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={shippingAddress.phone}
              onChange={(e) => setShippingAddress(prev => ({ 
                ...prev, 
                phone: e.target.value 
              }))}
              className={errors.phone ? 'border-red-500' : ''}
              placeholder="+880 1XXX XXXXXX"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={shippingAddress.country}
              onChange={(e) => setShippingAddress(prev => ({ 
                ...prev, 
                country: e.target.value 
              }))}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Order Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions for delivery..."
            rows={3}
          />
        </div>

        <Button type="submit" size="lg" className="w-full">
          Continue to Review
        </Button>
      </form>
    </motion.div>
  );

  const renderReviewOrder = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="font-medium">
            {shippingAddress.firstName} {shippingAddress.lastName}
          </p>
          <p className="text-gray-600">{shippingAddress.address}</p>
          <p className="text-gray-600">
            {shippingAddress.city}, {shippingAddress.postalCode}
          </p>
          <p className="text-gray-600">{shippingAddress.country}</p>
          <p className="text-gray-600">Phone: {shippingAddress.phone}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Order Items</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item._id}-${item.variant._id}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                <p className="text-sm text-gray-600">{item.variant.name}</p>
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              </div>
              
              <div className="text-right">
                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {notes && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Order Notes</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">{notes}</p>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => setCurrentStep('shipping')}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shipping
        </Button>
        <Button 
          size="lg" 
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
    </motion.div>
  );

  const renderConfirmation = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="h-10 w-10 text-green-600" />
      </div>
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order Placed Successfully!
        </h1>
        <p className="text-lg text-gray-600">
          Thank you for your order. Your order has been confirmed and will be delivered soon.
        </p>
      </div>

      {orderData && (
        <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto text-left">
          <h3 className="font-semibold mb-4">Order Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-medium">{orderData.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">${orderData.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">Cash on Delivery</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Delivery:</span>
              <span className="font-medium">
                {new Date(orderData.estimatedDelivery).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge variant="secondary">Pending</Badge>
            </div>
          </div>
        </div>
      )}

      <Alert>
        <Truck className="h-4 w-4" />
        <AlertDescription>
          You will receive a confirmation email with your order details. Our delivery partner will contact you before delivery.
        </AlertDescription>
      </Alert>

      <div className="flex gap-4 max-w-md mx-auto">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => router.push('/products')}
          className="flex-1"
        >
          Continue Shopping
        </Button>
        <Button 
          size="lg"
          onClick={() => router.push('/')}
          className="flex-1"
        >
          Back to Home
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Checkout</h1>
        {renderStepIndicator()}
      </div>

      {!orderPlaced && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 'shipping' && renderShippingForm()}
            {currentStep === 'review' && renderReviewOrder()}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({totalItems})</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">FREE</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg mt-4">
                <span>Total</span>
                <span>${(totalPrice - totalDiscount).toFixed(2)}</span>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span>Free delivery on all orders</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span>5-7 business days delivery</span>
                </div>
              </div>

              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Cash on Delivery:</strong> Pay when you receive your order. 
                  No additional charges.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {orderPlaced && renderConfirmation()}
    </div>
  );
}