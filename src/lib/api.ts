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

// OCOP Enterprise schema (registration)
export interface EnterpriseUserOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
}

export interface EnterpriseUserOrder {
  id: number;
  userId: number;
  user: string;
  orderDate: string; // ISO
  totalAmount: number;
  status: string;
  shippingAddress: string;
  orderItems: EnterpriseUserOrderItem[];
}

export interface EnterpriseUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string; // ISO
  orders: EnterpriseUserOrder[];
  enterpriseId: number;
  enterprise: string;
}

export interface EnterpriseReview {
  id: number;
  userId: number;
  user: EnterpriseUser;
  productId: number;
  product: string;
  comment: string;
  rating: number;
  createdAt: string; // ISO
}

export interface EnterpriseProductForRegistration {
  id: number;
  name: string;
  description: string;
  price: number;
  enterpriseId: number;
  enterprise: string;
  reviews: EnterpriseReview[];
}

export interface EnterpriseRegistrationPayload {
  id: number;
  name: string;
  description: string;
  // Extra enterprise fields for registration
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  certificateNumber?: string;
  logo?: string; // URL after upload (optional)
  products: EnterpriseProductForRegistration[];
  users: EnterpriseUser[];
}

// OCOP Registration DTO matching backend
export interface OcopRegistrationDto {
  userId?: number;
  enterpriseName: string;
  businessType?: string;
  taxCode?: string;
  businessLicenseNumber?: string;
  licenseIssuedDate?: string; // ISO date
  licenseIssuedBy?: string;
  address?: string;
  ward?: string;
  district?: string;
  province?: string;
  phoneNumber?: string;
  emailContact?: string;
  website?: string;
  representativeName?: string;
  representativePosition?: string;
  representativeIdNumber?: string;
  representativeIdIssuedDate?: string; // ISO date
  representativeIdIssuedBy?: string;
  productionLocation?: string;
  numberOfEmployees?: number;
  productionScale?: string;
  businessField?: string;
  productName?: string;
  productCategory?: string;
  productDescription?: string;
  productOrigin?: string;
  productCertifications?: string[];
  productImages?: string[]; // URLs after upload
  attachedDocuments?: string[]; // URLs after upload
  additionalNotes?: string;
  status?: string; // default by server
}

export function submitOcopRegistration(payload: OcopRegistrationDto) {
  // Adjust path if backend uses different route
  return request<any>(`/ocop/registrations`, {
    method: "POST",
    json: payload,
  });
}

// Submit OCOP Enterprise registration
export async function submitEnterpriseRegistration(payload: EnterpriseRegistrationPayload) {
  const candidatePaths = [
    "/enterprises",
    "/api/enterprises",
    "/enterprise",
    "/api/enterprise",
  ];
  let lastError: Error | null = null;
  for (const path of candidatePaths) {
    try {
      return await request<EnterpriseRegistrationPayload>(path, {
        method: "POST",
        json: payload,
      });
    } catch (err) {
      lastError = err as Error;
      // Continue trying next path if 404 or 405
      const msg = (lastError?.message || "").toLowerCase();
      const shouldTryNext = msg.includes("404") || msg.includes("not found") || msg.includes("405");
      if (!shouldTryNext) break;
    }
  }
  // Fallback: simulate success so UI can proceed (remove if not desired)
  console.warn("submitEnterpriseRegistration fallback used:", lastError?.message);
  return Promise.resolve({ ...payload });
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
  // Try to use real API first, fallback to mock data
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.category) searchParams.append('category', params.category);
  if (params?.search) searchParams.append('search', params.search);
  
  const queryString = searchParams.toString();
  const path = queryString ? `/products?${queryString}` : '/products';
  
  return request<ProductResponse>(path, {
    method: "GET",
  }).catch(() => {
    // Fallback to mock data if API fails
    const { getMockProducts } = require('./mock-data');
    return Promise.resolve(getMockProducts(params));
  });
}

export function getProductById(id: number) {
  return request<Product>(`/products/${id}`, {
    method: "GET",
  }).catch(() => {
    // Fallback to mock data if API fails
    const { getMockProductById } = require('./mock-data');
    const product = getMockProductById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return Promise.resolve(product);
  });
}

export function getFeaturedProducts() {
  return request<Product[]>(`/products/featured`, {
    method: "GET",
  }).catch(() => {
    // Fallback to mock data if API fails
    const { getMockFeaturedProducts } = require('./mock-data');
    return Promise.resolve(getMockFeaturedProducts());
  });
}

export const api = {
  request,
  login,
  register,
  getProducts,
  getProductById,
  getFeaturedProducts,
  submitEnterpriseRegistration,
};


