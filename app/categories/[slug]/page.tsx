'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, 
  List, 
  Search, 
  Filter, 
  ChevronDown, 
  Package,
  Star
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import ProductCard from '@/components/products/ProductCard';

interface CategoryProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  images: string[];
  price: number;
  originalPrice: number;
  discount: number;
  averageRating: number;
  reviewCount: number;
  inStock: boolean;
  totalStock: number;
  isNew: boolean;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  parent: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  subcategories: Array<{
    _id: string;
    name: string;
    slug: string;
    image: string | null;
  }>;
  filters: Array<{
    name: string;
    type: string;
    options: string[];
  }>;
  seo: {
    title?: string;
    description?: string;
  };
}

interface CategoryResponse {
  success: boolean;
  data: {
    category: Category;
    products: CategoryProduct[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalProducts: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      limit: number;
    };
    filters: {
      search: string;
      minPrice: number;
      maxPrice: number;
      minRating: number;
      sortBy: string;
      sortOrder: string;
      inStock: boolean;
    };
  };
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 10000,
    minRating: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    inStock: false,
  });
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Query parameters
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: '20',
    search: searchTerm,
    minPrice: priceRange[0].toString(),
    maxPrice: priceRange[1].toString(),
    minRating: filters.minRating.toString(),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    inStock: filters.inStock.toString(),
  });

  const { data, isLoading, error } = useQuery<CategoryResponse>({
    queryKey: ['category', slug, queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${slug}?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch category');
      const result = await response.json();
      return result;
    },
    enabled: !!slug,
  });

  const category = data?.data?.category;
  const products = data?.data?.products || [];

  useEffect(() => {
    setFilters(prev => ({ 
      ...prev, 
      minPrice: priceRange[0], 
      maxPrice: priceRange[1] 
    }));
  }, [priceRange]);

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.startsWith('-') 
      ? [value.substring(1), 'asc'] 
      : [value, 'desc'];
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
  };

  const clearAllFilters = () => {
    setFilters({
      minPrice: 0,
      maxPrice: 10000,
      minRating: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      inStock: false,
    });
    setPriceRange([0, 10000]);
    setSearchTerm('');
  };

  const sortOptions = [
    { value: 'createdAt', label: 'Latest' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: 'averageRating', label: 'Top Rated' },
    { value: 'name', label: 'Name: A-Z' },
  ];

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <Star className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                <div className="space-y-2">
                  <div className="bg-gray-200 h-4 rounded"></div>
                  <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="mb-8">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Category Not Found</h1>
          <p className="text-gray-600 mb-4">The category you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/products">Back to Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-blue-600">Products</Link>
        {category.parent && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/categories/${category.parent.slug}`} className="hover:text-blue-600">
              {category.parent.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-gray-600 mb-4 max-w-2xl">
                  {category.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {data?.data?.pagination?.totalProducts && (
                  <span>{data.data.pagination.totalProducts} products found</span>
                )}
                {category.subcategories.length > 0 && (
                  <span>{category.subcategories.length} subcategories</span>
                )}
              </div>
            </div>

            {/* Category Image */}
            {category.image && (
              <div className="relative w-32 h-32 lg:w-48 lg:h-48 rounded-lg overflow-hidden bg-gray-50">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Subcategories */}
          {category.subcategories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Browse by Subcategory</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {category.subcategories.map((subcategory) => (
                  <Link
                    key={subcategory._id}
                    href={`/categories/${subcategory.slug}`}
                    className="group"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2 group-hover:shadow-lg transition-shadow">
                      {subcategory.image ? (
                        <Image
                          src={subcategory.image}
                          alt={subcategory.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-center group-hover:text-blue-600 transition-colors">
                      {subcategory.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Products Section */}
      <div className="flex gap-8">
        {/* Desktop Filters */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-sm"
              >
                Clear All
              </Button>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Price Range</label>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  max={10000}
                  min={0}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Rating</label>
              <Select 
                value={filters.minRating.toString()} 
                onValueChange={(value: string) => setFilters(prev => ({ ...prev, minRating: parseFloat(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Ratings</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* In Stock */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={filters.inStock}
                onCheckedChange={(checked: boolean) => setFilters(prev => ({ ...prev, inStock: checked }))}
              />
              <label htmlFor="inStock" className="text-sm font-medium">
                In Stock Only
              </label>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="flex-1">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {data?.data?.pagination?.totalProducts} products
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Sort */}
              <Select 
                value={`${filters.sortOrder === 'asc' ? '-' : ''}${filters.sortBy}`} 
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex items-center border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Filter Toggle */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Refine your product search
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price Range</label>
                      <div className="px-2">
                        <Slider
                          value={priceRange}
                          onValueChange={handlePriceRangeChange}
                          max={10000}
                          min={0}
                          step={50}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minimum Rating</label>
                      <Select 
                        value={filters.minRating.toString()} 
                        onValueChange={(value: string) => setFilters(prev => ({ ...prev, minRating: parseFloat(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Ratings</SelectItem>
                          <SelectItem value="3">3+ Stars</SelectItem>
                          <SelectItem value="4">4+ Stars</SelectItem>
                          <SelectItem value="4.5">4.5+ Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="inStock"
                        checked={filters.inStock}
                        onCheckedChange={(checked: boolean) => setFilters(prev => ({ ...prev, inStock: checked }))}
                      />
                      <label htmlFor="inStock" className="text-sm font-medium">
                        In Stock Only
                      </label>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Product Grid */}
          <AnimatePresence mode="popLayout">
            <div className={`
              grid gap-6 
              ${viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
              }
            `}>
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ProductCard 
                    product={{
                      ...product,
                      images: product.image ? [product.image] : [],
                      tags: []
                    }}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* No Products */}
          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-4">
                <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={clearAllFilters}>Clear All Filters</Button>
            </div>
          )}

          {/* Pagination */}
          {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!data.data.pagination.hasPreviousPage}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(data.data.pagination.totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!data.data.pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}