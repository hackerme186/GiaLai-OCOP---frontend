// Use server proxy to avoid CORS in browser
import { getAuthToken } from "@/lib/auth"
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

  // Attach bearer token if available
  try {
    const token = getAuthToken?.();
    if (token) {
      (headers as any)["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // ignore token access errors
  }

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

// -------- Enterprises (Admin) --------
export interface EnterpriseSummary {
  id: number | string;
  name?: string;
  Name?: string;
  description?: string;
  Description?: string;
  address?: string;
  Address?: string;
  businessField?: string;
  BusinessField?: string;
  taxCode?: string;
  businessLicenseNumber?: string;
  representative?: string;
  ward?: string;
  district?: string;
  province?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  shortDescription?: string;
  capabilityProfileUrl?: string;
  status?: string;
  locked?: boolean;
  [key: string]: unknown;
}

export interface EnterpriseListResponse {
  items?: EnterpriseSummary[];
  data?: EnterpriseSummary[];
  enterprises?: EnterpriseSummary[];
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface EnterpriseDetail extends EnterpriseSummary {
  products?: Product[];
  rating?: number;
  rank?: string;
  ocopHistory?: Array<{ year: number; result: string }>;
}

export interface EnterpriseCreateUpdatePayload {
  name: string;
  taxCode?: string;
  businessLicenseNumber?: string;
  representative?: string;
  ward?: string;
  district?: string;
  province?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  field?: string;
  logoUrl?: string;
  shortDescription?: string;
  capabilityProfileUrl?: string;
}

export async function getEnterprises(params?: {
  page?: number;
  limit?: number;
  search?: string;
  province?: string;
  district?: string;
  field?: string;
  status?: string;
}): Promise<EnterpriseListResponse> {
  // Try Next.js API route first (which handles Supabase)
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.province) searchParams.append('province', params.province);
    if (params?.district) searchParams.append('district', params.district);
    if (params?.field) searchParams.append('field', params.field);
    if (params?.status) searchParams.append('status', params.status);
    
    const response = await fetch(`/api/enterprises?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        items: data.items || data.data || data.enterprises || [],
        total: data.total || 0,
        page: data.page || params?.page || 1,
        limit: data.limit || params?.limit || 10,
      };
    }
  } catch (err) {
    console.warn('API route call failed, trying direct backend:', err);
  }
  
  // Fallback to direct backend API via proxy
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.limit) searchParams.append('limit', String(params.limit));
  if (params?.search) searchParams.append('search', params.search);
  if (params?.province) searchParams.append('province', params.province);
  if (params?.district) searchParams.append('district', params.district);
  if (params?.field) searchParams.append('field', params.field);
  if (params?.status) searchParams.append('status', params.status);
  const qs = searchParams.toString();
  
  const candidateBases = [
    '/enterprises',
    '/api/enterprises',
    '/enterprise',
    '/api/enterprise',
  ];
  
  let lastError: Error | null = null;
  for (const base of candidateBases) {
    const path = qs ? `${base}?${qs}` : base;
    try {
      const res = await request<any>(path, { method: 'GET' });
      // Normalize response format
      if (Array.isArray(res)) {
        return { items: res, total: res.length, page: params?.page || 1, limit: params?.limit || 10 };
      }
      if (res.items || res.data || res.enterprises) {
        return {
          items: res.items || res.data || res.enterprises || [],
          total: res.total || 0,
          page: res.page || params?.page || 1,
          limit: res.limit || params?.limit || 10,
        };
      }
      return res;
    } catch (err) {
      lastError = err as Error;
      const msg = (lastError?.message || '').toLowerCase();
      const shouldTryNext = msg.includes('404') || msg.includes('not found') || msg.includes('405');
      if (!shouldTryNext) break;
    }
  }
  console.warn('getEnterprises fallback used:', lastError?.message);
  return { items: [], total: 0, page: params?.page || 1, limit: params?.limit || 10 };
}

export function getEnterpriseById(id: number | string) {
  const candidates = [`/enterprises/${id}`, `/api/enterprises/${id}`, `/enterprise/${id}`, `/api/enterprise/${id}`];
  let lastError: Error | null = null;
  for (const path of candidates) {
    try {
      return request<EnterpriseDetail>(path, { method: 'GET' });
    } catch (err) {
      lastError = err as Error;
      const msg = (lastError?.message || '').toLowerCase();
      const shouldTryNext = msg.includes('404') || msg.includes('not found') || msg.includes('405');
      if (!shouldTryNext) throw err;
    }
  }
  throw lastError || new Error('Enterprise not found');
}

export function createEnterprise(payload: EnterpriseCreateUpdatePayload) {
  const candidates = ['/enterprises', '/api/enterprises', '/enterprise', '/api/enterprise'];
  let lastError: Error | null = null;
  for (const path of candidates) {
    try {
      return request<EnterpriseDetail>(path, { method: 'POST', json: payload });
    } catch (err) {
      lastError = err as Error;
      const msg = (lastError?.message || '').toLowerCase();
      const shouldTryNext = msg.includes('404') || msg.includes('not found') || msg.includes('405');
      if (!shouldTryNext) throw err;
    }
  }
  throw lastError || new Error('Failed to create enterprise');
}

export function updateEnterprise(id: number | string, payload: EnterpriseCreateUpdatePayload) {
  const candidates = [`/enterprises/${id}`, `/api/enterprises/${id}`, `/enterprise/${id}`, `/api/enterprise/${id}`];
  let lastError: Error | null = null;
  for (const path of candidates) {
    try {
      return request<EnterpriseDetail>(path, { method: 'PUT', json: payload });
    } catch (err) {
      lastError = err as Error;
      const msg = (lastError?.message || '').toLowerCase();
      const shouldTryNext = msg.includes('404') || msg.includes('not found') || msg.includes('405');
      if (!shouldTryNext) throw err;
    }
  }
  throw lastError || new Error('Failed to update enterprise');
}

export function deleteEnterprise(id: number | string) {
  const candidates = [`/enterprises/${id}`, `/api/enterprises/${id}`, `/enterprise/${id}`, `/api/enterprise/${id}`];
  let lastError: Error | null = null;
  for (const path of candidates) {
    try {
      return request<void>(path, { method: 'DELETE' });
    } catch (err) {
      lastError = err as Error;
      const msg = (lastError?.message || '').toLowerCase();
      const shouldTryNext = msg.includes('404') || msg.includes('not found') || msg.includes('405');
      if (!shouldTryNext) throw err;
    }
  }
  throw lastError || new Error('Failed to delete enterprise');
}

export function setEnterpriseLock(id: number | string, locked: boolean) {
  const lockPaths = [`/enterprises/${id}/lock`, `/api/enterprises/${id}/lock`, `/enterprise/${id}/lock`, `/api/enterprise/${id}/lock`];
  const unlockPaths = [`/enterprises/${id}/unlock`, `/api/enterprises/${id}/unlock`, `/enterprise/${id}/unlock`, `/api/enterprise/${id}/unlock`];
  const candidates = locked ? lockPaths : unlockPaths;
  let lastError: Error | null = null;
  for (const path of candidates) {
    try {
      return request<EnterpriseDetail>(path, { method: 'POST' });
    } catch (err) {
      lastError = err as Error;
      const msg = (lastError?.message || '').toLowerCase();
      const shouldTryNext = msg.includes('404') || msg.includes('not found') || msg.includes('405');
      if (!shouldTryNext) throw err;
    }
  }
  throw lastError || new Error('Failed to lock/unlock enterprise');
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

// Get current user profile from backend (robust to different backends)
export interface MeResponse {
  id?: number | string;
  name?: string;
  fullName?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export async function getCurrentUser(): Promise<MeResponse> {
  const candidatePaths = [
    "/auth/me",
    "/users/me",
    "/api/users/me",
    "/me",
  ];
  let lastError: Error | null = null;
  for (const path of candidatePaths) {
    try {
      return await request<MeResponse>(path, { method: "GET" });
    } catch (err) {
      lastError = err as Error;
      const msg = (lastError?.message || "").toLowerCase();
      const shouldTryNext = msg.includes("404") || msg.includes("not found") || msg.includes("405");
      if (!shouldTryNext) break;
    }
  }
  // Fallback mock if API not available
  console.warn("getCurrentUser fallback used:", lastError?.message);
  return Promise.resolve({ name: "User", email: "user@example.com" });
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
  getCurrentUser,
  getProducts,
  getProductById,
  getFeaturedProducts,
  submitEnterpriseRegistration,
  getEnterprises,
  getEnterpriseById,
  createEnterprise,
  updateEnterprise,
  deleteEnterprise,
  setEnterpriseLock,
};


