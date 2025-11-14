export interface Product {
    id: number;
    name: string;
    description?: string;
    price?: number;
    quantity?: number;
    image?: string;
    images?: string[];
    category?: string;
    status?: string;
    rating?: number;
    createdAt?: string;
    updatedAt?: string;
    originProvince?: string;
    ocopLevel?: number;
    // Index signature để tương thích với api.ts
    [key: string]: unknown;
  }