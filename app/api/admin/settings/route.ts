import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Settings from '@/lib/models/Settings';
import dbConnect from '@/lib/db/connect';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let settings = await Settings.findOne({});
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({
        site: {
          name: 'E-Commerce Store',
          description: 'Your trusted online shopping destination',
          logo: '',
          favicon: '',
          contactEmail: 'admin@store.com',
          contactPhone: '+1 (555) 123-4567',
          address: {
            street: '123 Store St',
            city: 'Store City',
            state: 'ST',
            zipCode: '12345',
            country: 'United States'
          },
          socialLinks: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: '',
            youtube: ''
          }
        },
        seo: {
          metaTitle: 'E-Commerce Store - Shop Online',
          metaDescription: 'Shop the latest products at our online store',
          keywords: ['ecommerce', 'shopping', 'online store'],
          ogImage: '',
          twitterCard: 'summary_large_image'
        },
        homepage: {
          heroSlider: [],
          featuredProducts: {
            productIds: [],
            title: 'Featured Products',
            showAllButton: true
          },
          categoryShowcase: [],
          trendingProducts: {
            productIds: [],
            title: 'Trending Products',
            showAllButton: true
          }
        },
        footer: {
          content: {
            about: 'Welcome to our e-commerce store. We offer the best products at competitive prices.',
            quickLinks: [],
            customerService: []
          },
          copyright: `© ${new Date().getFullYear()} E-Commerce Store. All rights reserved.`,
          paymentMethods: ['COD']
        },
        shipping: {
          freeShippingThreshold: 100,
          standardShippingCost: 10,
          expressShippingCost: 25,
          estimatedDelivery: {
            standard: '3-5 business days',
            express: '1-2 business days'
          }
        },
        payment: {
          methods: ['cod'],
          cod: {
            instructions: 'Please have the exact amount ready when our delivery arrives.'
          }
        },
        taxes: {
          enabled: false,
          rate: 0,
          includedInPrice: true
        },
        currency: {
          code: 'USD',
          symbol: '$',
          position: 'before'
        },
        email: {
          fromName: 'E-Commerce Store',
          fromEmail: 'noreply@store.com',
          templates: {
            orderConfirmation: {
              subject: 'Order Confirmation - #{orderId}',
              body: 'Thank you for your order. Your order #{orderId} has been confirmed and will be processed shortly.'
            },
            orderShipped: {
              subject: 'Your Order #{orderId} Has Been Shipped',
              body: 'Good news! Your order #{orderId} has been shipped and is on its way to you. Tracking number: {trackingNumber}'
            },
            orderDelivered: {
              subject: 'Your Order #{orderId} Has Been Delivered',
              body: 'Your order #{orderId} has been delivered. We hope you enjoy your purchase!'
            }
          }
        }
      });
      await settings.save();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const data = await request.json();

    let settings = await Settings.findOne({});
    
    if (!settings) {
      settings = new Settings(data);
    } else {
      Object.assign(settings, data);
      settings.updatedAt = new Date();
    }

    await settings.save();

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}