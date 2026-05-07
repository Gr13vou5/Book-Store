import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';

import { Product, Category, PaginationInfo } from '../types';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';
  const queryCategory = searchParams.get('category') || '';
  const querySort = searchParams.get('sort') || '';
  const queryPage = searchParams.get('page') || '1';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Local state for debounced search typing
  const [searchValue, setSearchValue] = useState(querySearch);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error('Failed to load categories:', data);
          setCategories([]);
        }
      })
      .catch(err => {
        console.error(err);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (querySearch) params.set('search', querySearch);
        if (queryCategory) params.set('category', queryCategory);
        if (querySort) params.set('sort', querySort);
        if (queryPage) params.set('page', queryPage);
        params.set('limit', '9');

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (data.error) {
          console.error('API Error:', data.error);
        }
        setProducts(data.products || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 9, totalPages: 1 });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [querySearch, queryCategory, querySort, queryPage]);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== querySearch) {
        setSearchParams(prev => {
          if (searchValue) {
            prev.set('search', searchValue);
          } else {
            prev.delete('search');
          }
          prev.set('page', '1'); // reset page on search
          return prev;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue, querySearch, setSearchParams]);

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams(prev => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      if (key !== 'page') prev.set('page', '1');
      return prev;
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <Helmet>
        <title>Products | Chapters Online Book Store</title>
      </Helmet>

      {/* Breadcrumbs */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link to="/" className="hover:text-gray-900">Home</Link></li>
          <li><span className="mx-2">&gt;</span></li>
          <li className="text-gray-900 font-medium" aria-current="page">Products</li>
        </ol>
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar / Filters */}
        <div className="w-full md:w-64 space-y-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                placeholder="Book title or author"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
            <select
              id="category"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
              value={queryCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700">Sort By</label>
            <select
              id="sort"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
              value={querySort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:gap-x-8">
                {products.map((product) => (
                  <div key={product.id} className="group relative border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                      <img
                        src={product.image || 'https://via.placeholder.com/400x500?text=No+Cover'}
                        alt={product.title}
                        className="w-full h-full object-center object-cover lg:w-full lg:h-full"
                      />
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div>
                        <h3 className="text-sm text-gray-700 font-bold">
                          <Link to={`/products/${product.id}`}>
                            <span aria-hidden="true" className="absolute inset-0" />
                            {product.title}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{product.author}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                          {product.categoryName}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-indigo-600">${Number(product.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-8">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {[...Array(Number(pagination.totalPages) || 1)].map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleFilterChange('page', (idx + 1).toString())}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.page === idx + 1
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
