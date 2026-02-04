import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/connect'
import Order from '@/lib/models/Order'
import User from '@/lib/models/User'
import Product from '@/lib/models/Product'
import Category from '@/lib/models/Category'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    
    await connectDB()

    let startDate: Date
    const now = new Date()
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Sales chart data
    const salesChart = []
    const days = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = Math.min(days - 1, 29); i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const [dayOrders, dayRevenue] = await Promise.all([
        Order.countDocuments({ 
          createdAt: { $gte: dayStart, $lt: dayEnd } 
        }),
        Order.aggregate([
          { 
            $match: { 
              createdAt: { $gte: dayStart, $lt: dayEnd },
              status: { $ne: 'cancelled' }
            } 
          },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ])
      ])

      salesChart.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: dayOrders,
        revenue: dayRevenue[0]?.total || 0
      })
    }

    // Revenue chart with profit estimation (assuming 70% profit margin)
    const revenueChart = salesChart.map(item => ({
      ...item,
      profit: item.revenue * 0.7
    }))

    // Category performance
    const categoryPerformance = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' }},
      { $unwind: '$product' },
      { $lookup: { from: 'categories', localField: 'product.categories', foreignField: '_id', as: 'category' }},
      { $unwind: '$category' },
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
        _id: '$category.name',
        totalSales: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' }
      }},
      { $sort: { totalRevenue: -1 }},
      { $limit: 10 }
    ])

    // Top products
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { $group: { 
        _id: '$items.productId', 
        totalSales: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' }
      }},
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' }},
      { $unwind: '$product' },
      { $project: {
        name: '$product.name',
        sales: '$totalSales',
        revenue: '$totalRevenue'
      }},
      { $sort: { sales: -1 }},
      { $limit: 10 }
    ])

    // Customer growth (monthly)
    const customerGrowth = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      
      const [monthCustomers, monthOrders] = await Promise.all([
        User.countDocuments({ 
          role: 'user',
          createdAt: { $gte: monthStart, $lt: monthEnd } 
        }),
        Order.countDocuments({ 
          createdAt: { $gte: monthStart, $lt: monthEnd } 
        })
      ])

      customerGrowth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        customers: monthCustomers,
        orders: monthOrders
      })
    }

    // Order status breakdown
    const orderStatusBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
        _id: '$status',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ])

    const totalOrdersInRange = orderStatusBreakdown.reduce((sum, item) => sum + item.count, 0)

    // Summary calculations
    const [totalRevenue, totalOrdersInRange2, totalCustomers, previousPeriodStats] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ role: 'user' }),
      Order.aggregate([
        { $match: { 
          createdAt: { 
            $gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
            $lt: startDate 
          }, 
          status: { $ne: 'cancelled' } 
        }},
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ])
    ])

    const averageOrderValue = totalOrdersInRange2 > 0 ? 
      (totalRevenue[0]?.total || 0) / totalOrdersInRange2 : 0

    const conversionRate = totalCustomers > 0 ? 
      (totalOrdersInRange2 / totalCustomers) * 100 : 0

    const previousRevenue = previousPeriodStats[0]?.total || 0
    const growthRate = previousRevenue > 0 ? 
      (((totalRevenue[0]?.total || 0) - previousRevenue) / previousRevenue) * 100 : 0

    const analyticsData = {
      salesChart,
      revenueChart,
      categoryPerformance: categoryPerformance.map(cat => ({
        name: cat._id,
        sales: cat.totalSales,
        revenue: cat.totalRevenue
      })),
      topProducts,
      customerGrowth,
      orderStatusBreakdown: orderStatusBreakdown.map(status => ({
        status: status._id,
        count: status.count,
        percentage: totalOrdersInRange > 0 ? (status.count / totalOrdersInRange) * 100 : 0
      })),
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders: totalOrdersInRange2,
        totalCustomers,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        topCategory: categoryPerformance[0]?._id || 'N/A',
        growthRate: Math.round(growthRate * 100) / 100
      }
    }

    return NextResponse.json(analyticsData)

  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}