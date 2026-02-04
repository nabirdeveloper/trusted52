'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  SlidersHorizontal,
  Star,
  DollarSign,
  Package
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
import { 
  Slider,
} from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories: Category[];
}

interface AdvancedSearchProps {
  className?: string;
}

const priceRanges = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: 'Over $200', min: 200, max: 999999 }
];

const sortOptions = [
  { value: 'createdAt', label: 'Newest Arrivals' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'Name: A to Z' },
  { value: '-name', label: 'Name: Z to A' },
  { value: 'reviewCount', label: 'Most Reviewed' }
];

const ratingOptions = [
  { value: 4, label: '4★ & up', stars: 4 },
  { value: 3, label: '3★ & up', stars: 3 },
  { value: 2, label: '2★ & up', stars: 2 },
  { value: 1, label: '1★ & up', stars: 1 }
];

export default function AdvancedSearch({ className = '' }: AdvancedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '0');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '999999');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '0');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');
  const [isExpanded, setIsExpanded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priceRange, setPriceRange] = useState([0, 999999]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPriceRange([parseInt(minPrice), Math.min(parseInt(maxPrice), 999999)]);
  }, [minPrice, maxPrice]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const params = new URLSearchParams();
    
    if (query.trim()) params.set('q', query.trim());
    if (category && category !== 'all') params.set('category', category);
    if (parseInt(minPrice) > 0) params.set('minPrice', minPrice);
    if (parseInt(maxPrice) < 999999) params.set('maxPrice', maxPrice);
    if (parseInt(minRating) > 0) params.set('minRating', minRating);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (inStock) params.set('inStock', 'true');
    
    const queryString = params.toString();
    router.push(`/search${queryString ? '?' + queryString : ''}`);
  };

  const handlePriceRangeSelect = (range: typeof priceRanges[0]) => {
    setMinPrice(range.min.toString());
    setMaxPrice(range.max.toString());
  };

  const handleClearFilters = () => {
    setCategory('');
    setMinPrice('0');
    setMaxPrice('999999');
    setMinRating('0');
    setSortBy('createdAt');
    setInStock(false);
    setPriceRange([0, 999999]);
  };

  const hasActiveFilters = category || 
    parseInt(minPrice) > 0 || 
    parseInt(maxPrice) < 999999 || 
    parseInt(minRating) > 0 || 
    sortBy !== 'createdAt' || 
    inStock;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={`${className}`}>
      {/* Main Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for products, brands, or keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-12 h-12 text-lg"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                {[category, parseInt(minPrice) > 0, parseInt(maxPrice) < 999999, parseInt(minRating) > 0, sortBy !== 'createdAt', inStock].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          
          <Button type="submit" className="px-6">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </form>

      {/* Advanced Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <Package className="h-4 w-4 inline mr-1" />
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <Separator />
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Price Range
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice === '0' ? '' : minPrice}
                      onChange={(e) => setMinPrice(e.target.value || '0')}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice === '999999' ? '' : maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value || '999999')}
                      className="flex-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {priceRanges.map((range) => (
                      <Button
                        key={range.label}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePriceRangeSelect(range)}
                        className={`h-7 text-xs ${
                          parseInt(minPrice) === range.min && parseInt(maxPrice) === range.max
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : ''
                        }`}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <Star className="h-4 w-4 inline mr-1" />
                  Minimum Rating
                </label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    {ratingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < option.stars
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort & Additional Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <Filter className="h-4 w-4 inline mr-1" />
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={inStock}
                      onCheckedChange={(checked) => setInStock(checked as boolean)}
                    />
                    <label htmlFor="inStock" className="text-sm text-gray-700">
                      In Stock Only
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {hasActiveFilters && (
                  <span>{[category, parseInt(minPrice) > 0, parseInt(maxPrice) < 999999, parseInt(minRating) > 0, sortBy !== 'createdAt', inStock].filter(Boolean).length} filters applied</span>
                )}
              </div>
              
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button onClick={handleSearch}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {categories.find(c => c.slug === category)?.name || category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setCategory('')} />
            </Badge>
          )}
          {parseInt(minPrice) > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Min: {formatPrice(parseInt(minPrice))}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setMinPrice('0')} />
            </Badge>
          )}
          {parseInt(maxPrice) < 999999 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Max: {formatPrice(parseInt(maxPrice))}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setMaxPrice('999999')} />
            </Badge>
          )}
          {parseInt(minRating) > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {ratingOptions.find(r => r.value === parseInt(minRating))?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setMinRating('0')} />
            </Badge>
          )}
          {sortBy !== 'createdAt' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {sortOptions.find(s => s.value === sortBy)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSortBy('createdAt')} />
            </Badge>
          )}
          {inStock && (
            <Badge variant="secondary" className="flex items-center gap-1">
              In Stock Only
              <X className="h-3 w-3 cursor-pointer" onClick={() => setInStock(false)} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}