// Backend API Integration for GiaLai OCOP
// Backend API runs at: https://gialai-ocop-be.onrender.com/api (production)
// Or https://localhost:5001/api (local development)
import { getAuthToken, getClaimsFromJwt } from "@/lib/auth"

// API Base URL - có thể override qua environment variable
// Default to production backend on Render
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "https://gialai-ocop-be.onrender.com/api";

type Json = unknown;

// Track last error log time to prevent spam
let lastErrorLogTime = 0;
const ERROR_LOG_COOLDOWN = 30000; // 30 seconds

async function request<TResponse>(
  path: string,
  options: RequestInit & { json?: Json; silent?: boolean } = {}
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

  let response: Response;
  try {
    response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    // credentials: "include", // REMOVED: Causes CORS error with wildcard Access-Control-Allow-Origin
    credentials: "omit", // Don't send cookies - fixes CORS with wildcard origin
    cache: "no-store",
  });
  } catch (fetchError) {
    // Network error - backend không available
    const errorMsg = fetchError instanceof Error ? fetchError.message : 'Network error';
    
    // Only log error if not in silent mode and cooldown has passed
    const now = Date.now();
    if (!options.silent && (now - lastErrorLogTime) > ERROR_LOG_COOLDOWN) {
      console.error(`❌ Backend API không khả dụng (${API_BASE_URL}):`, errorMsg);
      console.info('💡 Backend có thể đang cold start. Render free tier sleep sau 15 phút không hoạt động.');
      console.info('💡 Đợi 30-60 giây để backend khởi động, hoặc chạy local backend với: dotnet run');
      lastErrorLogTime = now;
    }
    
    throw new Error(`Backend API không khả dụng. Vui lòng khởi động backend server. (${errorMsg})`);
  }

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

// ========================================
// TYPES & INTERFACES (theo Backend DTOs)
// ========================================

// Auth
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expires: string; // ISO date string
}

// User
export interface User {
  id: number;
  name: string;
  fullName?: string;
  username?: string;
  email: string;
  role: string; // "Customer" | "EnterpriseAdmin" | "SystemAdmin"
  enterpriseId?: number;
  createdAt?: string;
}

// Category
export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

// Product
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  enterpriseId?: number;
  imageUrl?: string;
  ocopRating?: number; // 3, 4, 5 sao
  stockStatus: string; // "InStock" | "LowStock" | "OutOfStock"
  averageRating?: number;
  status: string; // "PendingApproval" | "Approved" | "Rejected"
  categoryId?: number;
  categoryName?: string;
  approvedAt?: string;
  approvedByUserId?: number;
  enterprise?: Enterprise;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  ocopRating?: number;
  stockStatus?: string;
  categoryId?: number;
}

export interface UpdateProductStatusDto {
  status: "PendingApproval" | "Approved" | "Rejected";
  ocopRating?: number;
}

// Enterprise
export interface Enterprise {
  id: number;
  name: string;
  description: string;
  products: Product[];
  users: User[];
  address: string;
  ward: string;
  district: string;
  province: string;
  latitude?: number;
  longitude?: number;
  phoneNumber: string;
  emailContact: string;
  website: string;
  ocopRating?: number;
  businessField: string;
  imageUrl?: string;
  averageRating?: number;
}

// Enterprise Application (OCOP Registration)
export interface EnterpriseApplication {
  id: number;
  userId: number;
  enterpriseName: string;
  businessType: string;
  taxCode: string;
  businessLicenseNumber: string;
  licenseIssuedDate?: string;
  licenseIssuedBy: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  phoneNumber: string;
  emailContact: string;
  website: string;
  representativeName: string;
  representativePosition: string;
  representativeIdNumber: string;
  representativeIdIssuedDate?: string;
  representativeIdIssuedBy: string;
  productionLocation: string;
  numberOfEmployees: string;
  productionScale: string;
  businessField: string;
  productName: string;
  productCategory: string;
  productDescription: string;
  productOrigin: string;
  productCertifications: string;
  productImages: string;
  attachedDocuments: string;
  additionalNotes: string;
  status: "Pending" | "Approved" | "Rejected";
  adminComment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEnterpriseApplicationDto {
  enterpriseName: string;
  businessType: string;
  taxCode: string;
  businessLicenseNumber: string;
  licenseIssuedDate?: string;
  licenseIssuedBy?: string;
  address: string;
  ward?: string;
  district: string;
  province: string;
  phoneNumber: string;
  emailContact: string;
  website?: string;
  representativeName: string;
  representativePosition?: string;
  representativeIdNumber: string;
  representativeIdIssuedDate?: string;
  representativeIdIssuedBy?: string;
  productionLocation?: string;
  numberOfEmployees?: string;
  productionScale?: string;
  businessField: string;
  productName: string;
  productCategory: string;
  productDescription: string;
  productOrigin?: string;
  productCertifications?: string;
  productImages?: string;
  attachedDocuments?: string;
  additionalNotes?: string;
}

// Order
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName?: string;
  quantity: number;
  price: number;
  total?: number;
}

export interface Order {
  id: number;
  userId: number;
  orderDate: string;
  shippingAddress?: string;
  totalAmount: number;
  status: string; // "Pending" | "Processing" | "Shipped" | "Completed" | "Cancelled"
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string;
  orderItems?: OrderItem[];
  payments?: Payment[];
  enterpriseApprovalStatus?: string;
}

export interface CreateOrderDto {
  shippingAddress: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface UpdateOrderStatusDto {
  status: "Pending" | "Processing" | "Shipped" | "Completed" | "Cancelled";
  shippingAddress?: string;
}

// Payment
export interface Payment {
  id: number;
  orderId: number;
  enterpriseId: number;
  enterpriseName?: string;
  amount: number;
  method: string; // "COD" | "BankTransfer"
  status: string; // "Pending" | "Paid" | "Cancelled"
  reference: string;
  bankCode?: string;
  bankAccount?: string;
  accountName?: string;
  qrCodeUrl?: string;
  notes?: string;
  createdAt: string;
  paidAt?: string;
}

export interface CreatePaymentDto {
  orderId: number;
  method: "COD" | "BankTransfer";
}

export interface UpdatePaymentStatusDto {
  status: "Paid" | "Cancelled";
}

// Map
export interface EnterpriseMapDto {
  id: number;
  name: string;
  district: string;
  province: string;
  latitude?: number;
  longitude?: number;
  ocopRating?: number;
  businessField: string;
  imageUrl?: string;
  distance?: number;
  topProducts: Product[];
  // Extended fields from database
  address?: string;
  ward?: string;
  phoneNumber?: string;
  emailContact?: string;
  website?: string;
  description?: string;
  averageRating?: number;
}

export interface MapSearchParams {
  keyword?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
  district?: string;
  province?: string;
  businessField?: string;
  ocopRating?: number;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface FilterOptions {
  districts: string[];
  provinces: string[];
  businessFields: string[];
  ocopRatings: number[];
}

// Reports
export interface ReportSummary {
  totalEnterprises: number;
  totalCategories: number;
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  totalApplications: number;
  pendingApplications: number;
  totalOrders: number;
  totalPayments: number;
  totalCustomers: number;
  totalEnterpriseAdmins: number;
  paidPaymentsAmount: number;
  awaitingTransferAmount: number;
}

export interface DistrictReport {
  district: string;
  enterpriseCount: number;
  approvedProducts: number;
  pendingProducts: number;
}

export interface RevenueByMonth {
  year: number;
  month: number;
  amount: number;
}

// ========================================
// API FUNCTIONS
// ========================================

// ------ AUTH ------
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    json: payload,
  });
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    json: payload,
  });
}

// ------ USERS ------
export async function getCurrentUser(): Promise<User> {
  try {
    return await request<User>("/users/me", {
      method: "GET",
      silent: true,
    });
  } catch (err) {
    const userId = extractUserIdFromToken();
    if (userId !== null) {
      return getUser(userId);
    }
    throw err;
  }
}

export async function getUsers(): Promise<User[]> {
  return request<User[]>("/users", {
    method: "GET",
  });
}

export async function getUser(id: number): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: "GET",
  });
}

// ------ CATEGORIES ------
export async function getCategories(isActive?: boolean): Promise<Category[]> {
  const query = isActive !== undefined ? `?isActive=${isActive}` : '';
  return request<Category[]>(`/categories${query}`, {
    method: "GET",
  });
}

export async function getCategory(id: number): Promise<Category> {
  return request<Category>(`/categories/${id}`, {
    method: "GET",
  });
}

export async function createCategory(payload: CreateCategoryDto): Promise<Category> {
  return request<Category>("/categories", {
    method: "POST",
    json: payload,
  });
}

export async function updateCategory(id: number, payload: Partial<CreateCategoryDto>): Promise<Category> {
  return request<Category>(`/categories/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function deleteCategory(id: number): Promise<void> {
  return request<void>(`/categories/${id}`, {
    method: "DELETE",
  });
}

// ------ PRODUCTS ------
export async function getProducts(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  categoryId?: number;
  search?: string;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
  if (params?.status) searchParams.append('status', params.status);
  if (params?.categoryId) searchParams.append('categoryId', String(params.categoryId));
  if (params?.search) searchParams.append('search', params.search);
  
  const query = searchParams.toString();
  return request<Product[]>(`/products${query ? '?' + query : ''}`, {
    method: "GET",
    // silent: false - Show full errors for debugging
  });
}

export async function getProduct(id: number): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: "GET",
  });
}

export async function createProduct(payload: CreateProductDto): Promise<Product> {
  return request<Product>("/products", {
    method: "POST",
    json: payload,
  });
}

export async function updateProduct(id: number, payload: Partial<CreateProductDto>): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function deleteProduct(id: number): Promise<void> {
  return request<void>(`/products/${id}`, {
    method: "DELETE",
  });
}

export async function updateProductStatus(id: number, payload: UpdateProductStatusDto): Promise<Product> {
  return request<Product>(`/products/${id}/status`, {
    method: "POST",
    json: payload,
  });
}

// ------ ENTERPRISE APPLICATIONS ------
export async function createEnterpriseApplication(payload: CreateEnterpriseApplicationDto): Promise<EnterpriseApplication> {
  return request<EnterpriseApplication>("/enterpriseapplications", {
    method: "POST",
    json: payload,
  });
}

export async function getEnterpriseApplications(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<EnterpriseApplication[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
  
  const query = searchParams.toString();
  return request<EnterpriseApplication[]>(`/enterpriseapplications${query ? '?' + query : ''}`, {
    method: "GET",
  });
}

export async function approveEnterpriseApplication(id: number): Promise<void> {
  return request<void>(`/enterpriseapplications/${id}/approve`, {
    method: "PUT",
  });
}

export async function rejectEnterpriseApplication(id: number, comment: string): Promise<void> {
  return request<void>(`/enterpriseapplications/${id}/reject`, {
    method: "PUT",
    json: comment,
  });
}

// ------ ENTERPRISES ------
export async function getEnterprises(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  district?: string;
  province?: string;
  businessField?: string;
}): Promise<Enterprise[]> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
  if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.district) searchParams.append('district', params.district);
    if (params?.province) searchParams.append('province', params.province);
  if (params?.businessField) searchParams.append('businessField', params.businessField);
  
  const query = searchParams.toString();
  return request<Enterprise[]>(`/enterprises${query ? '?' + query : ''}`, {
    method: "GET",
  });
        }

export async function getEnterprise(id: number): Promise<Enterprise> {
  return request<Enterprise>(`/enterprises/${id}`, {
    method: "GET",
  });
}

export async function updateEnterprise(id: number, payload: Partial<Enterprise>): Promise<Enterprise> {
  return request<Enterprise>(`/enterprises/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function deleteEnterprise(id: number): Promise<void> {
  return request<void>(`/enterprises/${id}`, {
    method: "DELETE",
  });
}

// ------ ORDERS ------
export async function getOrders(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<Order[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
  
  const query = searchParams.toString();
  return request<Order[]>(`/orders${query ? '?' + query : ''}`, {
    method: "GET",
  });
}

export async function getOrder(id: number): Promise<Order> {
  return request<Order>(`/orders/${id}`, {
    method: "GET",
  });
}

export async function createOrder(payload: CreateOrderDto): Promise<Order> {
  return request<Order>("/orders", {
        method: "POST",
        json: payload,
      });
}

export async function updateOrderStatus(id: number, payload: UpdateOrderStatusDto): Promise<Order> {
  return request<Order>(`/orders/${id}/status`, {
    method: "PUT",
    json: payload,
  });
}

export async function deleteOrder(id: number): Promise<void> {
  return request<void>(`/orders/${id}`, {
    method: "DELETE",
  });
}

// ------ PAYMENTS ------
export async function createPayment(payload: CreatePaymentDto): Promise<Payment[]> {
  return request<Payment[]>("/payments", {
    method: "POST",
    json: payload,
  });
}

export async function getPayment(id: number): Promise<Payment> {
  return request<Payment>(`/payments/${id}`, {
    method: "GET",
  });
}

export async function getPaymentsByOrder(orderId: number): Promise<Payment[]> {
  return request<Payment[]>(`/payments/order/${orderId}`, {
    method: "GET",
  });
}

export async function updatePaymentStatus(id: number, payload: UpdatePaymentStatusDto): Promise<Payment> {
  return request<Payment>(`/payments/${id}/status`, {
    method: "POST",
    json: payload,
  });
}

// ------ MAP API ------
export async function searchMap(params: MapSearchParams): Promise<EnterpriseMapDto[]> {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.append('keyword', params.keyword);
  if (params.latitude) searchParams.append('latitude', String(params.latitude));
  if (params.longitude) searchParams.append('longitude', String(params.longitude));
  if (params.radiusKm) searchParams.append('radiusKm', String(params.radiusKm));
  if (params.minLat) searchParams.append('minLat', String(params.minLat));
  if (params.maxLat) searchParams.append('maxLat', String(params.maxLat));
  if (params.minLon) searchParams.append('minLon', String(params.minLon));
  if (params.maxLon) searchParams.append('maxLon', String(params.maxLon));
  if (params.district) searchParams.append('district', params.district);
  if (params.province) searchParams.append('province', params.province);
  if (params.businessField) searchParams.append('businessField', params.businessField);
  if (params.ocopRating) searchParams.append('ocopRating', String(params.ocopRating));
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.page) searchParams.append('page', String(params.page));
  if (params.pageSize) searchParams.append('pageSize', String(params.pageSize));
  
  return request<EnterpriseMapDto[]>(`/map/search?${searchParams.toString()}`, {
    method: "GET",
  });
}

export async function getMapBoundingBox(params: {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}): Promise<EnterpriseMapDto[]> {
  const searchParams = new URLSearchParams({
    minLat: String(params.minLat),
    maxLat: String(params.maxLat),
    minLon: String(params.minLon),
    maxLon: String(params.maxLon),
  });
  
  return request<EnterpriseMapDto[]>(`/map/bounding-box?${searchParams.toString()}`, {
    method: "GET",
  });
}

export async function getMapNearby(params: {
  latitude: number;
  longitude: number;
  radiusKm: number;
}): Promise<EnterpriseMapDto[]> {
  const searchParams = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radiusKm: String(params.radiusKm),
  });
  
  return request<EnterpriseMapDto[]>(`/map/nearby?${searchParams.toString()}`, {
    method: "GET",
  });
    }

export async function getMapFilterOptions(): Promise<FilterOptions> {
  return request<FilterOptions>("/map/filter-options", {
    method: "GET",
  });
}

export async function getMapEnterprise(id: number): Promise<EnterpriseMapDto> {
  return request<EnterpriseMapDto>(`/map/enterprises/${id}`, {
    method: "GET",
  });
}

export async function getMapEnterpriseProducts(id: number, params?: {
  page?: number;
  pageSize?: number;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
  
  const query = searchParams.toString();
  return request<Product[]>(`/map/enterprises/${id}/products${query ? '?' + query : ''}`, {
    method: "GET",
  });
}

// ------ REPORTS (SystemAdmin) ------
export async function getReportSummary(): Promise<ReportSummary> {
  return request<ReportSummary>("/reports/summary", {
    method: "GET",
  });
}

export async function getReportDistricts(): Promise<DistrictReport[]> {
  return request<DistrictReport[]>("/reports/districts", {
    method: "GET",
  });
}

export async function getReportRevenueByMonth(): Promise<RevenueByMonth[]> {
  return request<RevenueByMonth[]>("/reports/revenue-by-month", {
    method: "GET",
  });
}

function extractUserIdFromToken(): number | null {
  try {
    const claims = getClaimsFromJwt?.();
    if (!claims) return null;
    const keys = [
      "nameidentifier",
      "nameId",
      "name_id",
      "sub",
      "userId",
      "userid",
      "id",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier",
    ];

    for (const key of keys) {
      const raw = (claims as any)[key];
      if (!raw) continue;
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Legacy compatibility exports
export const api = {
  request,
  login,
  register,
  getCurrentUser,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getEnterprises,
  getEnterprise,
  updateEnterprise,
  deleteEnterprise,
};
