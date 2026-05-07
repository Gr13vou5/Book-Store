import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Plus } from 'lucide-react';

export default function AdminDashboard() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'products'|'locations'>('products');

  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [newLocation, setNewLocation] = useState({ name: '', address: '', mapsUrl: '' });

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({ categoryId: '', title: '', author: '', description: '', price: '', image: '', locations: [] as any[] });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const fetchData = async () => {
    try {
      const locRes = await fetch('/api/locations');
      if (locRes.ok) setLocations(await locRes.json());
      
      const catRes = await fetch('/api/categories');
      if (catRes.ok) setCategories(await catRes.json());
      
      const prodRes = await fetch('/api/products?limit=100');
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return <div className="text-center py-20">Loading...</div>;
  if (!user || user.role !== 'admin') return null;

  // -- Location Handlers --
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingLocation;
      const url = isEdit ? `/api/locations/${editingLocation.id}?token=${token}` : `/api/locations?token=${token}`;
      const method = isEdit ? 'PUT' : 'POST';
      const payload = isEdit ? { ...newLocation, id: editingLocation.id } : newLocation;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Location ${isEdit ? 'updated' : 'added'}!`);
        setNewLocation({ name: '', address: '', mapsUrl: '' });
        setEditingLocation(null);
        fetchData();
      } else {
        alert("Error saving location");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location? It will remove stock associated with it.")) return;
    try {
      const res = await fetch(`/api/locations/${id}?token=${token}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Location deleted!");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEditLocation = (loc: any) => {
    setEditingLocation(loc);
    setNewLocation({ name: loc.name, address: loc.address, mapsUrl: loc.mapsUrl });
  };

  const cancelEditLocation = () => {
    setEditingLocation(null);
    setNewLocation({ name: '', address: '', mapsUrl: '' });
  };

  // -- Product Handlers --
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/products/${editingProduct.id}?token=${token}` : `/api/products?token=${token}`;
      const method = isEdit ? 'PUT' : 'POST';
      const payload = isEdit ? { ...newProduct, id: editingProduct.id } : newProduct;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Product ${isEdit ? 'updated' : 'added'}!`);
        setNewProduct({ categoryId: '', title: '', author: '', description: '', price: '', image: '', locations: [] });
        setEditingProduct(null);
        fetchData();
      } else {
        alert("Error saving product");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}?token=${token}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Product deleted!");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEditProduct = async (prod: any) => {
    // Need to fetch full product details with locations stock
    try {
      const res = await fetch(`/api/products/${prod.id}`);
      if (res.ok) {
        const fullProd = await res.json();
        setEditingProduct(fullProd.product);
        setNewProduct({
          categoryId: fullProd.product.categoryId,
          title: fullProd.product.title,
          author: fullProd.product.author,
          description: fullProd.product.description,
          price: fullProd.product.price,
          image: fullProd.product.image || '',
          locations: fullProd.locations.map((l:any) => ({ locationId: l.id, stock: l.stock }))
        });
      }
    } catch(e) { console.error(e); }
  };

  const cancelEditProduct = () => {
    setEditingProduct(null);
    setNewProduct({ categoryId: '', title: '', author: '', description: '', price: '', image: '', locations: [] });
  };

  const handleProductStockChange = (locationId: number, stock: string) => {
    const updatedLocations = [...newProduct.locations];
    const idx = updatedLocations.findIndex(l => l.locationId === locationId);
    if (idx >= 0) {
      if (stock === '' || parseInt(stock) <= 0) {
        updatedLocations.splice(idx, 1);
      } else {
        updatedLocations[idx].stock = parseInt(stock);
      }
    } else {
      if (stock !== '' && parseInt(stock) > 0) {
        updatedLocations.push({ locationId, stock: parseInt(stock) });
      }
    }
    setNewProduct({ ...newProduct, locations: updatedLocations });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('products')} className={`${activeTab === 'products' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Products</button>
          <button onClick={() => setActiveTab('locations')} className={`${activeTab === 'locations' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Locations</button>
        </nav>
      </div>

      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">{editingLocation ? 'Edit Location' : 'Add New Location'}</h2>
            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" required value={newLocation.name} onChange={e => setNewLocation({...newLocation, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input type="text" required value={newLocation.address} onChange={e => setNewLocation({...newLocation, address: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Maps URL</label>
                <input type="url" required value={newLocation.mapsUrl} onChange={e => setNewLocation({...newLocation, mapsUrl: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">{editingLocation ? 'Save Changes' : 'Add Location'}</button>
                {editingLocation && <button type="button" onClick={cancelEditLocation} className="bg-gray-300 text-gray-800 px-4 py-2 rounded">Cancel</button>}
              </div>
            </form>
          </section>

          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Existing Locations</h2>
            <ul className="divide-y divide-gray-200">
              {locations.map(loc => (
                <li key={loc.id} className="py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{loc.name}</h3>
                    <p className="text-sm text-gray-500">{loc.address}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => startEditLocation(loc)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-5 h-5"/></button>
                    <button onClick={() => handleDeleteLocation(loc.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5"/></button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" required value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Author</label>
                <input type="text" required value={newProduct.author} onChange={e => setNewProduct({...newProduct, author: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select required value={newProduct.categoryId} onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                  <option value="">Select a category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
                <input type="number" step="0.01" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                <input type="url" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" rows={4} />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Location Stock</h3>
                {locations.map(loc => {
                  const currStock = newProduct.locations.find(l => l.locationId === loc.id)?.stock || '';
                  return (
                    <div key={loc.id} className="flex items-center mb-2">
                      <span className="text-sm text-gray-700 w-1/2">{loc.name}</span>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="Stock qty"
                        value={currStock}
                        onChange={(e) => handleProductStockChange(loc.id, e.target.value)}
                        className="w-1/2 mt-1 block border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                      />
                    </div>
                  )
                })}
              </div>

              <div className="flex space-x-2 pt-4">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">{editingProduct ? 'Save Changes' : 'Add Product'}</button>
                {editingProduct && <button type="button" onClick={cancelEditProduct} className="bg-gray-300 text-gray-800 px-4 py-2 rounded">Cancel</button>}
              </div>
            </form>
          </section>

          <section className="bg-white p-6 rounded shadow max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Existing Products</h2>
            <ul className="divide-y divide-gray-200">
              {products.map(prod => (
                <li key={prod.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    {prod.image && <img src={prod.image} alt={prod.title} className="w-10 h-10 object-cover rounded" />}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{prod.title}</h3>
                      <p className="text-xs text-gray-500">${prod.price} - {prod.categoryName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => startEditProduct(prod)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-5 h-5"/></button>
                    <button onClick={() => handleDeleteProduct(prod.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5"/></button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
