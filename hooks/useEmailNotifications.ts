import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EmailNotification {
  _id: string;
  type: 'order_placed' | 'order_shipped' | 'order_delivered' | 'password_reset' | 'welcome' | 'promotion';
  recipient: {
    email: string;
    name: string;
  };
  subject: string;
  content: string;
  template?: string;
  data?: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  createdAt: string;
}

export interface EmailStore {
  notifications: EmailNotification[];
  
  // Actions
  addNotification: (notification: Omit<EmailNotification, '_id' | 'createdAt'>) => void;
  updateNotificationStatus: (id: string, status: EmailNotification['status']) => void;
  clearNotifications: () => void;
  
  // Getters
  getPendingNotifications: () => EmailNotification[];
  getNotificationsByEmail: (email: string) => EmailNotification[];
}

export const useEmailStore = create<EmailStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotification: EmailNotification = {
          ...notification,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        
        set({ 
          notifications: [...get().notifications, newNotification]
        });

        // Simulate sending email (in real app, this would call an API)
        setTimeout(() => {
          get().updateNotificationStatus(newNotification._id, 'sent');
        }, 1000);
      },

      updateNotificationStatus: (id, status) => {
        const state = get();
        const newNotifications = state.notifications.map(notification =>
          notification._id === id 
            ? { 
                ...notification, 
                status, 
                sentAt: status === 'sent' ? new Date().toISOString() : undefined 
              }
            : notification
        );
        
        set({ notifications: newNotifications });
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      getPendingNotifications: () => {
        return get().notifications.filter(n => n.status === 'pending');
      },

      getNotificationsByEmail: (email) => {
        return get().notifications.filter(n => n.recipient.email === email);
      },
    }),
    {
      name: 'email-notifications',
    }
  )
);

// Email templates
export const emailTemplates = {
  order_placed: (data: any) => ({
    subject: `Order Confirmation - #${data.orderNumber}`,
    content: `
      Dear ${data.customerName},
      
      Thank you for your order! Your order #${data.orderNumber} has been successfully placed.
      
      Order Details:
      - Total Amount: $${data.totalAmount}
      - Payment Method: ${data.paymentMethod}
      - Estimated Delivery: ${new Date(data.estimatedDelivery).toLocaleDateString()}
      
      You will receive another email when your order ships.
      
      Thank you for shopping with us!
    `
  }),
  
  order_shipped: (data: any) => ({
    subject: `Your Order Has Shipped - #${data.orderNumber}`,
    content: `
      Dear ${data.customerName},
      
      Great news! Your order #${data.orderNumber} has been shipped.
      
      Tracking Information:
      - Tracking Number: ${data.trackingNumber}
      - Carrier: ${data.carrier}
      - Estimated Delivery: ${new Date(data.estimatedDelivery).toLocaleDateString()}
      
      You can track your package using the tracking number provided.
      
      Thank you for your patience!
    `
  }),
  
  order_delivered: (data: any) => ({
    subject: `Order Delivered - #${data.orderNumber}`,
    content: `
      Dear ${data.customerName},
      
      Your order #${data.orderNumber} has been successfully delivered!
      
      We hope you're satisfied with your purchase. If you have any questions or concerns, please don't hesitate to contact our customer support.
      
      Please consider leaving a review for the products you purchased.
      
      Thank you for shopping with us!
    `
  }),
  
  welcome: (data: any) => ({
    subject: 'Welcome to Our Store!',
    content: `
      Dear ${data.customerName},
      
      Welcome to our store! We're excited to have you as part of our community.
      
      Here are some benefits of shopping with us:
      - Free shipping on all orders
      - Secure payment options
      - Excellent customer service
      - Easy returns and refunds
      
      Explore our latest collection and enjoy shopping!
      
      Best regards,
      The Team
    `
  }),
  
  promotion: (data: any) => ({
    subject: `Special Offer: ${data.discount}% Off Your Next Purchase!`,
    content: `
      Dear ${data.customerName},
      
      We have a special offer just for you!
      
      Use code: ${data.promoCode}
      Discount: ${data.discount}% off
      Valid until: ${new Date(data.validUntil).toLocaleDateString()}
      
      Don't miss out on this amazing deal!
      
      Shop now and save big!
    `
  })
};

// Email service utility
export const emailService = {
  sendOrderConfirmation: (orderData: any) => {
    const template = emailTemplates.order_placed(orderData);
    const emailStore = useEmailStore.getState();
    
    emailStore.addNotification({
      type: 'order_placed',
      recipient: {
        email: orderData.customerEmail,
        name: orderData.customerName,
      },
      subject: template.subject,
      content: template.content,
      status: 'pending',
      data: orderData,
    });
  },

  sendShippingNotification: (orderData: any) => {
    const template = emailTemplates.order_shipped(orderData);
    const emailStore = useEmailStore.getState();
    
    emailStore.addNotification({
      type: 'order_shipped',
      recipient: {
        email: orderData.customerEmail,
        name: orderData.customerName,
      },
      subject: template.subject,
      content: template.content,
      status: 'pending',
      data: orderData,
    });
  },

  sendDeliveryNotification: (orderData: any) => {
    const template = emailTemplates.order_delivered(orderData);
    const emailStore = useEmailStore.getState();
    
    emailStore.addNotification({
      type: 'order_delivered',
      recipient: {
        email: orderData.customerEmail,
        name: orderData.customerName,
      },
      subject: template.subject,
      content: template.content,
      status: 'pending',
      data: orderData,
    });
  },

  sendWelcomeEmail: (userData: any) => {
    const template = emailTemplates.welcome(userData);
    const emailStore = useEmailStore.getState();
    
    emailStore.addNotification({
      type: 'welcome',
      recipient: {
        email: userData.email,
        name: userData.name,
      },
      subject: template.subject,
      content: template.content,
      status: 'pending',
      data: userData,
    });
  },
};