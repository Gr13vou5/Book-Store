import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ComponentData {
  product: any;
  locations: any[];
}

export default function ProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState<ComponentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error || !data) return <div className="text-center py-20 text-red-500">{error}</div>;

  const { product, locations } = data;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <Helmet>
        <title>{product.title} | Chapters</title>
      </Helmet>

      {/* Breadcrumbs */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link to="/" className="hover:text-gray-900">Home</Link></li>
          <li><span className="mx-2">&gt;</span></li>
          <li><Link to="/products" className="hover:text-gray-900">Products</Link></li>
          <li><span className="mx-2">&gt;</span></li>
          <li><Link to={`/products?category=${product.categoryId}`} className="hover:text-gray-900">{product.categoryName}</Link></li>
          <li><span className="mx-2">&gt;</span></li>
          <li className="text-gray-900 font-medium" aria-current="page">{product.title}</li>
        </ol>
      </nav>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg flex flex-col md:flex-row">
        <div className="md:w-1/3 p-6 flex justify-center bg-gray-50">
          <img 
            src={product.image || 'https://via.placeholder.com/400x500?text=No+Cover'} 
            alt={product.title} 
            className="rounded shadow-md max-w-full h-auto object-cover"
          />
        </div>
        <div className="md:w-2/3 p-6 md:pl-10 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{product.title}</h1>
            <p className="mt-2 text-lg text-gray-500">by {product.author}</p>
            
            <div className="mt-4 flex items-center space-x-4">
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-indigo-800 bg-indigo-100 text-sm font-semibold">
                ${Number(product.price).toFixed(2)}
              </span>
              <span className="text-yellow-500 text-sm font-medium">★ {product.rating} / 5</span>
            </div>

            <div className="mt-6 prose prose-indigo text-gray-500">
              <p>{product.description || 'No description available for this book.'}</p>
            </div>

            <div className="mt-8">
              <button
                onClick={() => {
                  addToCart(product);
                  alert('Added to cart!');
                }}
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </button>
            </div>
          </div>

          {/* Store Availability */}
          <div className="mt-10 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 text-indigo-500 mr-2" /> 
              Store Availability
            </h3>
            {locations.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {locations.map((loc, idx) => (
                  <li key={idx} className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{loc.name}</p>
                        <p className="text-sm text-gray-500">{loc.address}</p>
                        <p className="mt-1 text-xs text-green-600 font-medium">{loc.stock} in stock</p>
                      </div>
                      <a 
                        href={loc.mapsUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View Map &rarr;
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray-500 italic">Currenly out of stock in all physical locations.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
