'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Image as ImageIcon,
  Package,
  Eye,
  EyeOff,
  Upload,
  Save,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// TODO: Import Table and Switch from your UI library
const Switch = ({ checked, onCheckedChange, ...props }: any) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    }`}
    {...props}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
)
const Table = ({ children, ...props }: any) => (
  <table className="min-w-full divide-y divide-gray-200" {...props}>
    {children}
  </table>
)
const TableBody = ({ children, ...props }: any) => (
  <tbody className="bg-white divide-y divide-gray-200" {...props}>
    {children}
  </tbody>
)
const TableCell = ({ children, ...props }: any) => (
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" {...props}>
    {children}
  </td>
)
const TableHead = ({ children, ...props }: any) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>
    {children}
  </th>
)
const TableHeader = ({ children, ...props }: any) => (
  <thead className="bg-gray-50" {...props}>
    {children}
  </thead>
)
const TableRow = ({ children, ...props }: any) => (
  <tr {...props}>
    {children}
  </tr>
)

const ProductImageUpload = ({ images, onImagesChange }: any) => (
  <div className="space-y-4">
    <h3>Product Images</h3>
    <p>Upload and manage product images</p>
    {/* TODO: Implement drag & drop image upload */}
  </div>
)

const ProductVariantManager = ({ products, onProductsUpdate }: any) => (
  <div className="space-y-4">
    <h3>Product Variants</h3>
    <p>Manage product variants and attributes</p>
    {/* TODO: Implement variant management interface */}
  </div>
)

interface Product {
  _id: string
  name: string
  slug: string
  sku: string
  description: string
  shortDescription: string
  price: number
  comparePrice: number
  cost: number
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  images: Array<{
    _id: string
    url: string
    alt: string
    isPrimary: boolean
    position: number
  }>
  categories: Array<{
    _id: string
    name: string
  }>
  attributes: Array<{
    name: string
    value: string
    type: string
  }>
  variants: Array<{
    _id: string
    name: string
    sku: string
    price: number
    comparePrice: number
    quantity: number
    attributes: Record<string, any>
  }>
  quantity: number
  trackQuantity: boolean
  allowBackorder: boolean
  requiresShipping: boolean
  taxable: boolean
  featured: boolean
  digital: boolean
  isActive: boolean
  rating: {
    average: number
    count: number
  }
  seo: {
    title: string
    description: string
    keywords: string[]
    canonical: string
  }
  createdAt: string
  updatedAt: string
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('products')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || 
                            product.categories.some(cat => cat._id === filterCategory)
      return matchesSearch && matchesCategory
    })
    setFilteredProducts(filtered)
  }, [products, searchTerm, filterCategory])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const saveProduct = async (productData: Partial<Product>) => {
    setIsLoading(true)
    try {
      const url = productData._id 
        ? `/api/admin/products/${productData._id}`
        : '/api/admin/products'
      
      const response = await fetch(url, {
        method: productData._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      if (response.ok) {
        if (productData._id) {
          setProducts(products.map(p => 
            p._id === productData._id ? { ...p, ...productData } : p
          ))
        } else {
          setProducts([{
            ...productData,
            _id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as Product, ...products])
        }
        setSelectedProduct(null)
        setIsAddingProduct(false)
      }
    } catch (error) {
      console.error('Failed to save product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProducts(products.filter(p => p._id !== productId))
        if (selectedProduct?._id === productId) {
          setSelectedProduct(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        setProducts(products.map(p => 
          p._id === productId ? { ...p, isActive } : p
        ))
      }
    } catch (error) {
      console.error('Failed to update product status:', error)
    }
  }

  const renderProductCard = (product: Product) => (
    <motion.div
      key={product._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg border p-4 hover:shadow-lg transition-all cursor-pointer"
      onClick={() => setSelectedProduct(product)}
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          {product.images?.length > 0 ? (
            <img
              src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                {product.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {product.featured && (
                <Badge variant="outline">Featured</Badge>
              )}
              {product.digital && (
                <Badge variant="outline">Digital</Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-700 line-clamp-2">
            {product.shortDescription || product.description?.substring(0, 100)}...
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold text-lg text-gray-900">${product.price}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-sm text-gray-500 line-through">${product.comparePrice}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="h-4 w-4" />
              <span>{product.quantity} in stock</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>⭐ {product.rating.average?.toFixed(1)} ({product.rating.count})</span>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Package className="inline-block h-8 w-8 mr-3 text-blue-600" />
            Product Management
          </h1>
          <p className="text-gray-600">
            Manage your product catalog, inventory, variants, and pricing
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Products ({filteredProducts.length})</TabsTrigger>
            <TabsTrigger value="variants">Variants Management</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-8">
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={() => setIsAddingProduct(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </div>

              {/* Product Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map(renderProductCard)}
              </div>
            </div>
          </TabsContent>

          {/* Variants Management Tab */}
          <TabsContent value="variants" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Product Variants Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage product variants, attributes, and inventory in bulk.
                </p>
                <ProductVariantManager 
                  products={products}
                  onProductsUpdate={setProducts}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {(isAddingProduct || selectedProduct) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    {selectedProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedProduct(null)
                    setIsAddingProduct(false)
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <p>Product management form will be implemented here</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}