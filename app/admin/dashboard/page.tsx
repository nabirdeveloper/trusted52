'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertTriangle,
  Settings,
  Tag,
  Eye,
  Clock,
  Zap,
  Target
} from 'lucide-react'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  totalProducts: number
  todayOrders: number
  todayRevenue: number
  weekOrders: number
  weekRevenue: number
  monthOrders: number
  monthRevenue: number
  lowStockProducts: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    customer: string
    total: number
    status: string
    createdAt: string
  }>
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  salesChart: Array<{
    date: string
    sales: number
    revenue: number
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/admin-login')
      return
    }

    fetchDashboardStats()
  }, [session, status, router])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  const statsCards = [
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      subtitle: 'Lifetime earnings',
      change: '+12.5%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Total Orders',
      value: (stats?.totalOrders || 0).toLocaleString(),
      subtitle: 'All time orders',
      change: '+8.2%',
      changeType: 'increase',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Total Users',
      value: (stats?.totalUsers || 0).toLocaleString(),
      subtitle: 'Registered customers',
      change: '+5.4%',
      changeType: 'increase',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Products',
      value: (stats?.totalProducts || 0).toLocaleString(),
      subtitle: 'Active inventory',
      change: '-2.1%',
      changeType: 'decrease',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600 mt-1">Welcome back, <span className="font-medium">{session.user.name}</span></p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/products">
                  <Package className="h-4 w-4 mr-2" />
                  Products
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/orders">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Orders
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-lg transition-all duration-300 hover:scale-105`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    {stat.title}
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-2 bg-white rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs">
                    {stat.changeType === 'increase' ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span className={`font-medium ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Time-based Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-blue-900">Today&apos;s Performance</CardTitle>
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Orders</span>
                  <span className="font-bold text-blue-900">{stats?.todayOrders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="font-bold text-green-600">${(stats?.todayRevenue || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-purple-900">This Week</CardTitle>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Orders</span>
                  <span className="font-bold text-purple-900">{stats?.weekOrders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="font-bold text-green-600">${(stats?.weekRevenue || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-orange-900">This Month</CardTitle>
                <Target className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Orders</span>
                  <span className="font-bold text-orange-900">{stats?.monthOrders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="font-bold text-green-600">${(stats?.monthRevenue || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for low stock */}
        {stats?.lowStockProducts && stats.lowStockProducts > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-orange-900">Low Stock Alert</h3>
                  <p className="text-orange-700">
                    {stats.lowStockProducts} products are running low on inventory
                  </p>
                </div>
                <Button variant="outline" className="ml-auto" asChild>
                  <Link href="/admin/products?filter=low-stock">View Products</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center text-lg">
                <div className="p-2 bg-blue-600 rounded-lg mr-3">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                Recent Orders
              </CardTitle>
              <CardDescription className="text-gray-600">Latest customer orders</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {stats?.recentOrders?.length ? (
                  <div className="divide-y">
                    {stats.recentOrders.map((order) => (
                      <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-semibold text-gray-900">#{order.orderNumber}</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {order.customer}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">${order.total}</p>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No recent orders</p>
                  </div>
                )}
              </div>
              {stats?.recentOrders && stats.recentOrders.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <Button className="w-full" asChild>
                    <Link href="/admin/orders">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      View All Orders
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center text-lg">
                <div className="p-2 bg-green-600 rounded-lg mr-3">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Top Products
              </CardTitle>
              <CardDescription className="text-gray-600">Best selling products</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {stats?.topProducts?.length ? (
                  <div className="p-4 space-y-3">
                    {stats.topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                            index === 0 ? 'bg-yellow-400 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-400 text-white' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 line-clamp-1">{product.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">
                                <Package className="h-3 w-3 inline mr-1" />
                                {product.sales} sold
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">${(product.revenue || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No sales data yet</p>
                  </div>
                )}
              </div>
              {stats?.topProducts && stats.topProducts.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <Button className="w-full" asChild>
                    <Link href="/admin/analytics">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
            <CardTitle className="flex items-center text-lg">
              <div className="p-2 bg-indigo-600 rounded-lg mr-3">
                <Zap className="h-5 w-5 text-white" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-600">Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Button variant="outline" className="h-24 flex-col hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group" asChild>
                <Link href="/admin/products/new">
                  <div className="p-2 bg-blue-100 rounded-lg mb-2 group-hover:bg-blue-200 transition-colors">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Add Product</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col hover:bg-green-50 hover:border-green-300 transition-all duration-200 group" asChild>
                <Link href="/admin/orders">
                  <div className="p-2 bg-green-100 rounded-lg mb-2 group-hover:bg-green-200 transition-colors">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">View Orders</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 group" asChild>
                <Link href="/admin/users">
                  <div className="p-2 bg-purple-100 rounded-lg mb-2 group-hover:bg-purple-200 transition-colors">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Manage Users</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 group" asChild>
                <Link href="/admin/categories">
                  <div className="p-2 bg-orange-100 rounded-lg mb-2 group-hover:bg-orange-200 transition-colors">
                    <Tag className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium">Categories</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group" asChild>
                <Link href="/admin/settings">
                  <div className="p-2 bg-gray-100 rounded-lg mb-2 group-hover:bg-gray-200 transition-colors">
                    <Settings className="h-6 w-6 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium">Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}