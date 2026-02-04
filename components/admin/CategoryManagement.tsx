'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown,
  ChevronRight,
  Save,
  X,
  MoveUp,
  MoveDown
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
import { Label } from '@/components/ui/label'

// TODO: Import Switch from your UI library
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

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  level: number
  parentId?: string | null
  children?: Category[]
  isActive: boolean
  sortOrder: number
  productCount?: number
  metaTitle?: string
  metaDescription?: string
  createdAt: string
  updatedAt: string
}

interface CategoryAttribute {
  _id: string
  name: string
  type: string
  required: boolean
  options?: string[]
  position: number
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [activeTab, setActiveTab] = useState('categories')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

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

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const saveCategory = async (categoryData: Partial<Category>) => {
    setIsLoading(true)
    try {
      const url = categoryData._id 
        ? `/api/admin/categories/${categoryData._id}`
        : '/api/admin/categories'
      
      const response = await fetch(url, {
        method: categoryData._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })

      if (response.ok) {
        if (categoryData._id) {
          setCategories(categories.map(cat => 
            cat._id === categoryData._id ? { ...cat, ...categoryData } : cat
          ))
        } else {
          setCategories([{
            ...categoryData,
            _id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as Category, ...categories])
        }
        setSelectedCategory(null)
        setIsAddingCategory(false)
      }
    } catch (error) {
      console.error('Failed to save category:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category and all its subcategories? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCategories(categories.filter(cat => !cat._id || !getAllSubcategoryIds(cat).includes(categoryId)))
        if (selectedCategory?._id === categoryId) {
          setSelectedCategory(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const getAllSubcategoryIds = (category: Category): string[] => {
    if (!category.children) return []
    
    let ids = [category._id]
    category.children.forEach((child: Category) => {
      ids = [...ids, ...getAllSubcategoryIds(child)]
    })
    return ids
  }

  const toggleCategoryStatus = async (categoryId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        setCategories(categories.map(cat => 
          cat._id === categoryId ? { ...cat, isActive } : cat
        ))
      }
    } catch (error) {
      console.error('Failed to update category status:', error)
    }
  }

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      })

      if (response.ok) {
        setCategories(categories.map(cat => 
          cat._id === categoryId ? { ...cat, sortOrder: cat.sortOrder + (direction === 'up' ? -1 : 1) } : cat
        ))
      }
    } catch (error) {
      console.error('Failed to reorder category:', error)
    }
  }

  const renderCategoryTree = (categories: Category[], level = 1) => {
    return categories
      .filter(cat => cat.level === level)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(category => (
        <motion.div
          key={category._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`
            border rounded-lg
            ${expandedCategories.has(category._id) ? 'bg-gray-50' : 'bg-white'}
            ${!category.isActive ? 'opacity-50' : ''}
          `}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleExpanded(category._id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {expandedCategories.has(category._id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                <div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {category.productCount || 0} products
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveCategory(category._id, 'up')}
                  className="flex items-center gap-2"
                >
                  <MoveUp className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveCategory(category._id, 'down')}
                  className="flex items-center gap-2"
                >
                  <MoveDown className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleCategoryStatus(category._id, !category.isActive)}
                  className={category.isActive ? 'text-red-600 hover:text-red-700' : ''}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {category.children && expandedCategories.has(category._id) && (
              <div className="ml-4 mt-2 pl-4 border-l-2 border-gray-300">
                {renderCategoryTree(category.children, category.level + 1)}
              </div>
            )}
          </div>
        </motion.div>
      ))
  }

  const renderCategoryForm = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            value={selectedCategory?.name || ''}
            onChange={(e) => setSelectedCategory(selectedCategory ? {...selectedCategory, name: e.target.value} : null)}
            placeholder="Enter category name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={selectedCategory?.slug || ''}
            onChange={(e) => selectedCategory && setSelectedCategory({...selectedCategory, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
            placeholder="category-slug"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={selectedCategory?.description || ''}
          onChange={(e) => selectedCategory && setSelectedCategory({...selectedCategory, description: e.target.value})}
          placeholder="Category description"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="parent">Parent Category</Label>
        <Select value={selectedCategory?.parentId || ''} onValueChange={(value) => selectedCategory && setSelectedCategory({...selectedCategory, parentId: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select parent category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No Parent (Root Category)</SelectItem>
            {categories
              .filter(cat => cat.level === 1)
              .map((category) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="image">Category Image</Label>
          <Input
            id="image"
            value={selectedCategory?.image || ''}
            onChange={(e) => selectedCategory && setSelectedCategory({...selectedCategory, image: e.target.value})}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <div>
          <Label htmlFor="metaTitle">Meta Title</Label>
          <Input
            id="metaTitle"
            value={selectedCategory?.metaTitle || ''}
            onChange={(e) => selectedCategory && setSelectedCategory({...selectedCategory, metaTitle: e.target.value})}
            placeholder="Category title for SEO"
            maxLength={60}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="metaDescription">Meta Description</Label>
          <Textarea
            id="metaDescription"
            value={selectedCategory?.metaDescription || ''}
            onChange={(e) => selectedCategory && setSelectedCategory({...selectedCategory, metaDescription: e.target.value})}
            placeholder="Category description for SEO"
            rows={2}
            maxLength={160}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={selectedCategory?.isActive || true}
            onCheckedChange={(checked: boolean) => selectedCategory && setSelectedCategory({...selectedCategory, isActive: checked})}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button 
          onClick={() => selectedCategory && saveCategory(selectedCategory)}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Category'}
        </Button>
      </div>
    </div>
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
            <Save className="inline-block h-8 w-8 mr-3 text-blue-600" />
            Category Management
          </h1>
          <p className="text-gray-600">
            Manage your product categories with nested hierarchy and attribute filters
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Category Tree</TabsTrigger>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
            <TabsTrigger value="add-new">Add Category</TabsTrigger>
          </TabsList>

          {/* Category Tree */}
          <TabsContent value="categories" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Category Hierarchy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button onClick={() => setIsAddingCategory(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add New Category
                    </Button>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Drag categories to reorder</span>
                      <Switch
                        checked={false}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            // TODO: Enable drag and drop reordering
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {renderCategoryTree(categories, 1)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attributes */}
          <TabsContent value="attributes" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Category Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Configure attributes for product filtering. These will be used in product filters.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="attrName">Attribute Name</Label>
                    <Input
                      id="attrName"
                      placeholder="e.g., Color, Size, Material"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="attrType">Type</Label>
                    <Select defaultValue="text">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="select">Single Select</SelectItem>
                        <SelectItem value="multiselect">Multiple Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="attrRequired" />
                    <Label htmlFor="attrRequired">Required</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor="attrOptions">Options</Label>
                    <Input
                      id="attrOptions"
                      placeholder="Enter options separated by commas"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline">Add Attribute</Button>
                    <Button variant="outline">Save Attributes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add/Edit Category */}
          <TabsContent value="add-new" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>{selectedCategory ? 'Edit Category' : 'Add New Category'}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedCategory(null)
                    setIsAddingCategory(false)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {renderCategoryForm()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Category Edit Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Edit Category</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedCategory(null)
                      setIsAddingCategory(false)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {renderCategoryForm()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}