import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, removeFromCart, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      alert("Please login to checkout.");
      navigate('/login');
      return;
    }
    // Simulate checkout
    alert("Checkout successful! (Simulated)");
    clearCart();
    navigate('/');
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="mt-4 text-gray-500">Looks like you haven't added any books yet.</p>
        <button
          onClick={() => navigate('/products')}
          className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Browse Books
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.product.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                {item.product.image && (
                  <img src={item.product.image} alt={item.product.title} className="w-16 h-16 object-cover rounded mr-4" />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{item.product.title}</h3>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-lg font-bold text-gray-900">
                  ${(Number(item.product.price) * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col items-end">
          <p className="text-xl font-bold text-gray-900 mb-4">Total: ${totalPrice.toFixed(2)}</p>
          <button
            onClick={handleCheckout}
            className="px-8 py-3 bg-indigo-600 text-white text-lg font-medium rounded-md hover:bg-indigo-700 w-full sm:w-auto"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
