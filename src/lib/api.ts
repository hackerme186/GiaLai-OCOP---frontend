// Use server proxy to avoid CORS in browser
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

type Json = unknown;

async function request<TResponse>(
  path: string,
  options: RequestInit & { json?: Json } = {}
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    credentials: "include",
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  let data: unknown = null;
  if (isJson) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let bodyMessage = (isJson && data && typeof data === "object" && (data as any).message) || "";
    if (!bodyMessage && !isJson && typeof data === 'string') {
      bodyMessage = data as string;
    }
    const message = `${response.status} ${response.statusText} ${bodyMessage ? "- " + bodyMessage : ""}`.trim();
    throw new Error(message);
  }

  return data as TResponse;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  token?: string;
  user?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price?: number;
  image?: string;
  category?: string;
  rating?: number;
  // Add more fields based on your backend API
  [key: string]: unknown;
}

export interface ProductResponse {
  products?: Product[];
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export function login(payload: LoginPayload) {
  // Adjust path if backend uses a different route
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    json: payload,
  });
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export function register(payload: RegisterPayload) {
  // Adjust path if backend uses a different route
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    json: payload,
  });
}

// Product API functions
export function getProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.category) searchParams.append('category', params.category);
  if (params?.search) searchParams.append('search', params.search);
  
  const queryString = searchParams.toString();
  const path = queryString ? `/products?${queryString}` : '/products';
  
  return request<ProductResponse>(path, {
    method: "GET",
  });
}

export function getProductById(id: number) {
  return request<Product>(`/products/${id}`, {
    method: "GET",
  });
}

export function getFeaturedProducts() {
  return request<Product[]>(`/products/featured`, {
    method: "GET",
  });
}

export const api = {
  request,
  login,
  register,
  getProducts,
  getProductById,
  getFeaturedProducts,
};


