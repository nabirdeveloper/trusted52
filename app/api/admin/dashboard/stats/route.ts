import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/connect'
import Order from '@/lib/models/Order'
import User from '@/lib/models/User'
import Product from '@/lib/models/Product'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Total stats
    const [totalRevenue, totalOrders, totalUsers, totalProducts] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ status: 'active' })
    ])

    // Today's stats
    const [todayOrders, todayRevenue] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ])

    // Week stats
    const [weekOrders, weekRevenue] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: weekAgo } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: weekAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ])

    // Month stats
    const [monthOrders, monthRevenue] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: monthAgo } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: monthAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ])

    // Low stock products
    const lowStockProducts = await Product.countDocuments({
      status: 'active',
      trackQuantity: true,
      quantity: { $lte: 10 }
    })

    // Recent orders
    const recentOrders = await Order.find()
      .populate('customer.userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber customer total status createdAt')

    // Top products
    const topProducts = await Order.aggregate([
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
      { $limit: 5 }
    ])

    // Sales chart data (last 7 days)
    const salesChart = []
    for (let i = 6; i >= 0; i--) {
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

    const stats = {
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      weekOrders,
      weekRevenue: weekRevenue[0]?.total || 0,
      monthOrders,
      monthRevenue: monthRevenue[0]?.total || 0,
      lowStockProducts,
      recentOrders: recentOrders.map(order => ({
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: order.customer.name,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt.toISOString()
      })),
      topProducts: topProducts.map(product => ({
        id: product._id.toString(),
        name: product.name,
        sales: product.sales,
        revenue: product.revenue
      })),
      salesChart
    }

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}