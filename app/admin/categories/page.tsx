'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, ChevronRight, FolderOpen, Folder } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: { name: string; slug: string } | string;
  children?: Category[];
  level: number;
  path: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'admin') {
      router.push('/auth/admin-login');
      return;
    }
    fetchCategories();
  }, [session, status, router, viewMode]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/categories?includeSubcategories=${viewMode === 'tree'}`);
      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.message || 'Failed to delete category');
    }
  };

  const renderTreeCategories = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <div key={category._id} className={`border-l-2 ${level > 0 ? 'border-gray-200' : 'border-gray-300'}`}>
        <div 
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="flex items-center gap-3">
            {level === 0 ? (
              <FolderOpen className="h-5 w-5 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-gray-500" />
            )}
            <div>
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-gray-500">{category.slug}</p>
              {category.description && (
                <p className="text-xs text-gray-400 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${
              category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/admin/categories/${category._id}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(category._id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {category.children && category.children.length > 0 && (
          renderTreeCategories(category.children, level + 1)
        )}
      </div>
    ));
  };

  const renderListCategories = () => {
    const flattenCategories = (categories: Category[]): Category[] => {
      const result: Category[] = [];
      const traverse = (cats: Category[], parentName = '') => {
        cats.forEach(cat => {
          result.push({
            ...cat,
            name: parentName ? `${parentName} > ${cat.name}` : cat.name
          });
          if (cat.children) {
            traverse(cat.children, parentName ? `${parentName} > ${cat.name}` : cat.name);
          }
        });
      };
      traverse(categories);
      return result;
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Slug</th>
              <th className="text-left p-2">Parent</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {flattenCategories(categories).map((category) => (
              <tr key={category._id} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    )}
                    <span className="font-medium">{category.name}</span>
                  </div>
                </td>
                <td className="p-2">{category.slug}</td>
                <td className="p-2">
                  {category.parent && typeof category.parent === 'object' 
                    ? category.parent.name 
                    : '—'
                  }
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/categories/${category._id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(category._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Categories Management</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'tree' ? 'default' : 'outline'}
            onClick={() => setViewMode('tree')}
          >
            Tree View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button onClick={() => router.push('/admin/categories/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'tree' ? (
            <div className="space-y-1">
              {renderTreeCategories(categories)}
            </div>
          ) : (
            renderListCategories()
          )}
        </CardContent>
      </Card>
    </div>
  );
}