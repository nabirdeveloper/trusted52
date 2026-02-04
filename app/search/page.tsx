'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/products/ProductCard';
import AdvancedSearch from '@/components/search/AdvancedSearch';

interface SearchProduct {
  _id: string;
  name: string;
  slug: string;
  description?: string;
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

interface SearchResponse {
  success: boolean;
  data: {
    products: SearchProduct[];
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

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const query = searchParams.get('q') || '';

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ['search', query, currentPage],
    queryFn: async () => {
      if (!query) return null;
      
      const queryParams = new URLSearchParams({
        search: query,
        page: currentPage.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/products?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      const result = await response.json();
      return result;
    },
    enabled: !!query,
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentPage(1);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
          {query && (
            <p className="text-gray-600">
              Showing results for: <span className="font-medium">"{query}"</span>
              {pagination && (
                <span className="ml-2">
                  ({pagination.totalProducts} products found)
                </span>
              )}
            </p>
          )}
        </motion.div>

        {/* Advanced Search */}
        <AdvancedSearch className="mb-8" />
      </div>

      {/* No Results */}
      {!query ? (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Start a Search
          </h2>
          <p className="text-gray-600 mb-6">
            Enter keywords to find products you're looking for
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Products Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find any products matching "{query}"
          </p>
          <div className="space-y-4 max-w-md mx-auto text-left">
            <h3 className="font-medium text-gray-900">Search Tips:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Check your spelling for typos</li>
              <li>• Try more general keywords</li>
              <li>• Use different search terms</li>
              <li>• Browse our categories instead</li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center mt-8">
            <Button variant="outline" onClick={() => router.push('/products')}>
              <Filter className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
            <Button onClick={() => router.push('/categories')}>
              View Categories
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Results Grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
            <AnimatePresence mode="popLayout">
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
                      description: product.description || '',
                      images: product.image ? [product.image] : [],
                      tags: product.tags || []
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}