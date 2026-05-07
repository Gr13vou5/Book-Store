import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Chapters Online Book Store. All rights reserved.
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          Contact: support@chapters.local
        </p>
      </div>
    </footer>
  );
}
