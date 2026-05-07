export interface Product {
  id: number;
  title: string;
  author: string;
  price: number;
  rating: number;
  image: string;
  categoryName?: string;
  categoryId?: number;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
