'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Grid, List, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import ProductCard from '@/components/products/ProductCard';
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

interface Product {
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
  isNew: boolean;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
}

interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
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
      category: string;
      minPrice: number;
      maxPrice: number;
      minRating: number;
      sortBy: string;
      sortOrder: string;
      inStock: boolean;
    };
  };
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: 0,
    maxPrice: 10000,
    minRating: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    inStock: false,
  });
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Query parameters
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: '20',
    search: searchTerm,
    category: filters.category,
    minPrice: priceRange[0].toString(),
    maxPrice: priceRange[1].toString(),
    minRating: filters.minRating.toString(),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    inStock: filters.inStock.toString(),
  });

  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['products', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/products?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const result = await response.json();
      return result;
    },
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports' },
  ];

  const tags = [
    'Bestseller', 'New Arrival', 'Limited Edition', 'Eco-Friendly',
    'Premium', 'Sale', 'Exclusive', 'Popular', 'Trending', 'Top Rated'
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Latest' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: 'averageRating', label: 'Top Rated' },
    { value: 'name', label: 'Name: A-Z' },
    { value: 'reviewCount', label: 'Most Reviews' },
  ];

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.startsWith('-') 
      ? [value.substring(1), 'asc'] 
      : [value, 'desc'];
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
    setFilters(prev => ({ ...prev, minPrice: value[0], maxPrice: value[1] }));
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
  };

  const clearAllFilters = () => {
    setFilters({
      category: '',
      minPrice: 0,
      maxPrice: 10000,
      minRating: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      inStock: false,
    });
    setPriceRange([0, 10000]);
    setSelectedTags([]);
    setSearchTerm('');
  };

  const activeFilterCount = [
    filters.category,
    filters.inStock,
    filters.minRating > 0,
    priceRange[0] > 0 || priceRange[1] < 10000,
    selectedTags.length > 0,
    searchTerm
  ].filter(Boolean).length;

  const ProductGrid = () => (
    <div className={`
      grid gap-6 
      ${viewMode === 'grid' 
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
        : 'grid-cols-1'
      }
    `}>
      <AnimatePresence mode="popLayout">
        {data?.data?.products?.map((product: Product, index: number) => (
          <motion.div
            key={product._id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <ProductCard 
              product={product} 
              viewMode={viewMode}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const FilterPanel = () => (
    <div className="space-y-6 p-4">
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

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: parseFloat(value) }))}
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

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="inStock"
          checked={filters.inStock}
          onCheckedChange={(checked) => setFilters(prev => ({ ...prev, inStock: !!checked }))}
        />
        <label htmlFor="inStock" className="text-sm font-medium">
          In Stock Only
        </label>
      </div>
    </div>
  );

  if (error) return <div>Error loading products</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            {data?.data?.pagination?.totalProducts && (
              <p className="text-muted-foreground">
                {data.data.pagination.totalProducts} products found
              </p>
            )}
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
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your product search
                  </SheetDescription>
                </SheetHeader>
                <FilterPanel />
              </SheetContent>
            </Sheet>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Filters */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-8 space-y-6">
            <FilterPanel />
          </div>
        </div>

        {/* Products */}
        <div className="flex-1">
          {isLoading ? (
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
          ) : (
            <>
              {data?.data?.products?.length === 0 ? (
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
              ) : (
                <>
                  <ProductGrid />
                  
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
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}