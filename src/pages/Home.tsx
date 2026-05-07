import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Home | Chapters Online Book Store</title>
        <meta name="description" content="Welcome to Chapters, your favorite online book store." />
      </Helmet>
      <div className="text-center">
        <BookOpen className="mx-auto h-16 w-16 text-indigo-600" />
        <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block xl:inline">Welcome to</span>{' '}
          <span className="block text-indigo-600 xl:inline">Chapters</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Discover a world of stories, knowledge, and adventure. Explore our extensive collection of fiction, non-fiction, and technical books.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link
              to="/products"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
            >
              Browse Books
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
