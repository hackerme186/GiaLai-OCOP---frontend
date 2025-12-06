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
    const token = getAuthToken();
    if (token) {
      (headers as any)["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // ignore token access errors
  }

  let response: Response;
  try {
    // Debug logging for login requests
    if (path.includes("/auth/login")) {
      console.log("🌐 [API] Fetching:", url);
      console.log("🌐 [API] Method:", options.method || "GET");
      console.log("🌐 [API] Headers:", headers);
    }
    
    response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
      // credentials: "include", // REMOVED: Causes CORS error with wildcard Access-Control-Allow-Origin
      credentials: "omit", // Don't send cookies - fixes CORS with wildcard origin
      cache: "no-store",
    });
    
    if (path.includes("/auth/login")) {
      console.log("🌐 [API] Response status:", response.status, response.statusText);
      console.log("🌐 [API] Response headers:", Object.fromEntries(response.headers.entries()));
    }
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
      if (path.includes("/auth/login")) {
        console.log("🌐 [API] Parsed JSON response:", data);
      }
    } catch (parseError) {
      console.error("🌐 [API] JSON parse error:", parseError);
      data = null;
    }
  } else {
    data = await response.text();
    if (path.includes("/auth/login")) {
      console.log("🌐 [API] Text response:", data);
    }
  }

  if (!response.ok) {
    let bodyMessage = (isJson && data && typeof data === "object" && (data as any).message) || "";
    let bodyDetails = (isJson && data && typeof data === "object" && (data as any).details) || "";
    let bodyError = (isJson && data && typeof data === "object" && (data as any).error) || "";

    if (!bodyMessage && !isJson && typeof data === 'string') {
      bodyMessage = data as string;
    }

    // Handle 401 Unauthorized with a clear error message
    if (response.status === 401) {
      // Clear invalid token
      if (typeof window !== "undefined") {
        try {
          const { logout } = require("@/lib/auth");
          logout();
        } catch {
          // ignore if logout not available
        }
      }
      const authError = new Error("Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
      (authError as any).status = 401;
      (authError as any).isAuthError = true;
      throw authError;
    }

    // Tạo error message chi tiết
    let message = `${response.status} ${response.statusText}`;
    if (bodyMessage) {
      message += ` - ${bodyMessage}`;
    }
    if (bodyError && bodyError !== bodyMessage) {
      message += ` (${bodyError})`;
    }
    if (bodyDetails) {
      message += `\nChi tiết: ${bodyDetails}`;
    }

    const error = new Error(message.trim());
    (error as any).status = response.status;
    (error as any).response = data; // Lưu toàn bộ response data
    (error as any).bodyMessage = bodyMessage;
    (error as any).bodyDetails = bodyDetails;
    (error as any).bodyError = bodyError;
    throw error;
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
  // Không cần OTP - backend tự động trả về JWT token
}

export interface AuthResponse {
  token?: string; // Backend có thể trả về token (chữ thường) hoặc Token (chữ hoa)
  Token?: string; // Backend trả về Token (chữ hoa)
  expires?: string; // ISO date string
  Expires?: string; // Backend trả về Expires (chữ hoa)
  message?: string; // Optional message
  Message?: string; // Backend trả về Message (chữ hoa)
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
  enterprise?: {
    id: number;
    name: string;
    description?: string;
  };
  shippingAddress?: string;
  createdAt?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  provinceId?: number;
  districtId?: number;
  wardId?: number;
  addressDetail?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: string;
  enterpriseId?: number;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  shippingAddress?: string;
  avatarUrl?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  provinceId?: number;
  districtId?: number;
  wardId?: number;
  addressDetail?: string;
}

// Address
export interface Province {
  id: number;
  name: string;
  code: string;
}

export interface District {
  id: number;
  name: string;
  code: string;
  provinceId: number;
}

export interface Ward {
  id: number;
  name: string;
  code: string;
  districtId: number;
}

export interface UpdateShippingAddressDetailDto {
  provinceId: number;
  districtId: number;
  wardId: number;
  addressDetail: string;
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
  stockQuantity?: number; // Số lượng tồn kho thực tế (nếu backend có)
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
  approvalStatus?: string; // "Pending" | "Approved" | "Rejected"
  rejectionReason?: string;
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
  productImageUrl?: string;
  quantity: number;
  price: number;
  total?: number;
  enterpriseId?: number;
  enterpriseName?: string;
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
  shipperId?: number;
}

export interface CreateOrderDto {
  shippingAddress?: string; // String address (backward compatibility)
  shippingAddressId?: number; // ID from ShippingAddresses table (preferred)
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  paymentMethod?: "COD" | "BankTransfer";
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

// Shipper
export interface Shipper {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
}

// Inventory History
export interface InventoryHistory {
  id: number;
  productId: number;
  productName: string;
  enterpriseId: number;
  enterpriseName: string;
  type: "import" | "export" | "adjustment";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  createdAt: string;
  createdByUserId?: number;
  createdByName?: string;
}

export interface AdjustInventoryDto {
  productId: number;
  type: "import" | "export" | "adjustment";
  quantity: number;
  reason?: string;
  lowStockThreshold?: number;
}

// Notification
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  enterpriseId?: number;
  userId?: number;
  productId?: number;
  orderId?: number;
  productName?: string;
  orderCode?: string;
}

// Enterprise Settings
export interface ShippingMethod {
  id: string;
  name: string;
  enabled: boolean;
  fee: number;
  description?: string;
}

export interface EnterpriseSettings {
  enterpriseId: number;
  shippingMethods: ShippingMethod[];
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  businessHours: string;
  returnPolicy?: string;
  shippingPolicy?: string;
  updatedAt?: string;
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
  // Đăng ký đơn giản - chỉ gửi name, email, password
  // Backend tự động trả về JWT token (không cần OTP)
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    json: {
      name: payload.name,
      email: payload.email,
      password: payload.password
    },
  });
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  console.log("🌐 [API] Login request:", { email: payload.email, url: `${API_BASE_URL}/auth/login` });
  try {
    const result = await request<AuthResponse>("/auth/login", {
      method: "POST",
      json: payload,
    });
    console.log("🌐 [API] Login response:", result);
    return result;
  } catch (error) {
    console.error("🌐 [API] Login error:", error);
    throw error;
  }
}

// Social Login
export interface FacebookLoginPayload {
  accessToken: string;
}

export interface GoogleLoginPayload {
  idToken: string;
}

export async function loginWithFacebook(payload: FacebookLoginPayload): Promise<AuthResponse> {
  console.log("🌐 [API] Facebook login request:", { url: `${API_BASE_URL}/auth/facebook` });
  try {
    const result = await request<AuthResponse>("/auth/facebook", {
      method: "POST",
      json: { accessToken: payload.accessToken },
    });
    console.log("🌐 [API] Facebook login response:", result);
    return result;
  } catch (error) {
    console.error("🌐 [API] Facebook login error:", error);
    throw error;
  }
}

export async function loginWithGoogle(payload: GoogleLoginPayload): Promise<AuthResponse> {
  console.log("🌐 [API] Google login request:", { url: `${API_BASE_URL}/auth/google` });
  try {
    const result = await request<AuthResponse>("/auth/google", {
      method: "POST",
      json: { idToken: payload.idToken },
    });
    console.log("🌐 [API] Google login response:", result);
    return result;
  } catch (error) {
    console.error("🌐 [API] Google login error:", error);
    throw error;
  }
}

// OTP Login
export interface SendOtpDto {
  email: string;
  purpose?: "Login" | "Register";
}

export interface VerifyOtpDto {
  email: string;
  otpCode: string;
  purpose?: "Login" | "Register";
}

export interface LoginWithOtpDto {
  email: string;
  otpCode: string;
}

export interface RegisterWithOtpDto {
  name: string;
  email: string;
  password: string;
  otpCode: string;
}

export interface ResendVerificationOtpDto {
  email: string;
}

export async function sendOtp(payload: SendOtpDto): Promise<{ message: string; otpCode?: string }> {
  return request<{ message: string; otpCode?: string }>("/auth/send-otp", {
    method: "POST",
    json: payload,
  });
}

export async function verifyOtp(payload: VerifyOtpDto): Promise<{ message: string; verified: boolean }> {
  return request<{ message: string; verified: boolean }>("/auth/verify-otp", {
    method: "POST",
    json: payload,
  });
}

export async function loginWithOtp(payload: LoginWithOtpDto): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login-with-otp", {
    method: "POST",
    json: payload,
  });
}

export async function registerWithOtp(payload: RegisterWithOtpDto): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register-with-otp", {
    method: "POST",
    json: payload,
  });
}

export async function resendVerificationOtp(payload: ResendVerificationOtpDto): Promise<{ message: string; otpCode?: string }> {
  return request<{ message: string; otpCode?: string }>("/auth/resend-verification-otp", {
    method: "POST",
    json: payload,
  });
}

export async function verifyEmail(payload: VerifyOtpDto): Promise<{ message: string; isEmailVerified: boolean }> {
  return request<{ message: string; isEmailVerified: boolean }>("/auth/verify-email", {
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

export async function updateUser(id: number, payload: UpdateUserDto): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function deleteUser(id: number): Promise<void> {
  return request<void>(`/users/${id}`, {
    method: "DELETE",
  });
}

export async function updateCurrentUser(payload: UpdateUserDto): Promise<User> {
  // Log để debug
  if (typeof window !== "undefined") {
    console.log("📤 [API] updateCurrentUser - Request payload:", JSON.stringify(payload, null, 2));
  }

  const result = await request<User>("/users/me", {
    method: "PUT",
    json: payload,
  });

  // Log response để debug
  if (typeof window !== "undefined") {
    console.log("📥 [API] updateCurrentUser - Response:", JSON.stringify(result, null, 2));

    // Kiểm tra dữ liệu có được cập nhật không
    const fieldsNotInResponse: string[] = [];
    const fieldsNotUpdated: string[] = [];

    if (payload.name && result.name !== payload.name) fieldsNotUpdated.push("name");

    if (payload.phoneNumber) {
      if (!result.phoneNumber) {
        fieldsNotInResponse.push("phoneNumber");
      } else if (result.phoneNumber !== payload.phoneNumber) {
        fieldsNotUpdated.push("phoneNumber");
      }
    }

    if (payload.gender) {
      if (!result.gender) {
        fieldsNotInResponse.push("gender");
      } else if (result.gender !== payload.gender) {
        fieldsNotUpdated.push("gender");
      }
    }

    if (payload.dateOfBirth) {
      if (!result.dateOfBirth) {
        fieldsNotInResponse.push("dateOfBirth");
      } else {
        const payloadDate = new Date(payload.dateOfBirth).toISOString();
        const resultDate = new Date(result.dateOfBirth).toISOString();
        if (resultDate !== payloadDate) {
          fieldsNotUpdated.push("dateOfBirth");
        }
      }
    }

    if (payload.shippingAddress && result.shippingAddress !== payload.shippingAddress) {
      if (!result.shippingAddress) {
        fieldsNotInResponse.push("shippingAddress");
      } else {
        fieldsNotUpdated.push("shippingAddress");
      }
    }

    if (fieldsNotInResponse.length > 0) {
      console.warn(
        "⚠️ [API] updateCurrentUser - Backend KHÔNG TRẢ VỀ các trường sau trong response:",
        fieldsNotInResponse,
        "\n→ Có thể backend không hỗ trợ các trường này hoặc chưa map vào UserDto.",
        "\n→ Hãy kiểm tra backend: UserDto có include các trường này không?"
      );
    }

    if (fieldsNotUpdated.length > 0) {
      console.warn("⚠️ [API] updateCurrentUser - Các trường sau không khớp với payload:", fieldsNotUpdated);
    }
  }

  return result;
}

// Change password interface (moved to below)

// ------ ADDRESS ------
export async function getProvinces(): Promise<Province[]> {
  return request<Province[]>("/address/provinces", {
    method: "GET",
  });
}

export async function getDistricts(provinceId: number): Promise<District[]> {
  return request<District[]>(`/address/districts?provinceId=${provinceId}`, {
    method: "GET",
  });
}

export async function getWards(districtId: number): Promise<Ward[]> {
  return request<Ward[]>(`/address/wards?districtId=${districtId}`, {
    method: "GET",
  });
}

export async function updateShippingAddressDetail(payload: UpdateShippingAddressDetailDto): Promise<User> {
  return request<User>("/users/update-shipping-address", {
    method: "PUT",
    json: payload,
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
  q?: string; // Alternative search parameter
  enterpriseId?: number;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
  if (params?.status) searchParams.append('status', params.status);
  if (params?.categoryId) searchParams.append('categoryId', String(params.categoryId));

  // Support both 'search' and 'q' parameters (BE may use either)
  // If both are provided, prefer 'q', otherwise use whichever is provided
  const searchTerm = params?.q || params?.search;
  if (searchTerm) {
    // Try 'q' parameter first (more common in REST APIs)
    if (params?.q) {
      searchParams.append('q', params.q);
    }
    // Also try 'search' if provided (some APIs use this)
    if (params?.search && !params?.q) {
      searchParams.append('search', params.search);
    }
  }
  if (params?.enterpriseId) searchParams.append('enterpriseId', String(params.enterpriseId));

  const query = searchParams.toString();
  const url = `/products${query ? '?' + query : ''}`;

  // Debug: Log the API call
  if (params?.search || params?.q) {
    console.log('🔍 API Call:', {
      fullUrl: `${API_BASE_URL}${url}`,
      searchTerm: params?.search || params?.q,
      params: { q: params?.q, search: params?.search }
    });
  }

  const response = await request<Product[] | { products?: Product[]; items?: Product[]; data?: Product[] }>(url, {
    method: "GET",
  });

  // Debug: Log the response
  if (params?.search || params?.q) {
    const resultCount = Array.isArray(response) ? response.length :
      (response && typeof response === 'object' ?
        ((response as any).products?.length || (response as any).items?.length || (response as any).data?.length || 0) : 0);
    console.log('✅ API Response:', {
      searchTerm: params?.search || params?.q,
      count: resultCount,
      responseType: Array.isArray(response) ? 'array' : typeof response,
      responseKeys: response && typeof response === 'object' ? Object.keys(response) : []
    });
  }

  // Normalize response: handle both array and object formats
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === 'object') {
    const obj = response as any;
    if (Array.isArray(obj.products)) {
      return obj.products;
    }
    if (Array.isArray(obj.items)) {
      return obj.items;
    }
    if (Array.isArray(obj.data)) {
      return obj.data;
    }
  }

  // Fallback: return empty array if response format is unexpected
  console.warn('⚠️ Unexpected products response format:', response);
  return [];
}

export async function getProduct(id: number, options?: { silent?: boolean }): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: "GET",
    silent: options?.silent,
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

/// <summary>
/// SystemAdmin: Cập nhật chỉ ảnh sản phẩm
/// </summary>
export async function updateProductImage(id: number, imageUrl: string): Promise<void> {
  return request<void>(`/products/${id}/image`, {
    method: "PUT",
    json: { imageUrl },
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

export async function updateOrderShippingAddress(id: number, shippingAddress: string): Promise<void> {
  return request<void>(`/orders/${id}/shipping-address`, {
    method: "PUT",
    json: { shippingAddress },
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

  // Nếu không có tham số nào, gọi endpoint không có query string
  const queryString = searchParams.toString();
  const url = queryString ? `/map/search?${queryString}` : '/map/search';

  return request<EnterpriseMapDto[]>(url, {
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

// Get products for a specific enterprise (for EnterpriseAdmin)
export async function getEnterpriseProducts(enterpriseId: number, params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
  if (params?.status) searchParams.append('status', params.status);

  const query = searchParams.toString();

  // Try multiple endpoints in order until one works
  const endpoints = [
    `/enterprises/${enterpriseId}/products${query ? '?' + query : ''}`,
    `/products${query ? '?' + query : ''}?enterpriseId=${enterpriseId}`,
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Trying endpoint: ${API_BASE_URL}${endpoint}`);
      const result = await request<Product[]>(endpoint, {
        method: "GET",
      });
      console.log(`✅ Success! Got ${result.length} products from ${endpoint}`);
      return result;
    } catch (error) {
      console.warn(`❌ Failed ${endpoint}:`, error instanceof Error ? error.message : error);
      lastError = error as Error;
      // Continue to next endpoint
    }
  }

  // All endpoints failed
  const errorMsg = lastError?.message || "Unknown error";

  if (errorMsg.includes("403")) {
    throw new Error(
      "403 FORBIDDEN - Backend chưa cấu hình đúng cho EnterpriseAdmin.\n" +
      "Backend cần:\n" +
      "1. Thêm role 'EnterpriseAdmin' vào [Authorize] attribute\n" +
      "2. Đảm bảo JWT token có claim 'EnterpriseId'\n" +
      "3. Filter products theo enterpriseId của user\n" +
      "Xem chi tiết: TROUBLESHOOTING_403.md"
    );
  }

  throw lastError || new Error("Failed to load products");
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

// ------ SHIPPERS (EnterpriseAdmin/SystemAdmin) ------
export async function getShippers(): Promise<Shipper[]> {
  return request<Shipper[]>("/shippers", {
    method: "GET",
  });
}

export async function getShipperOrders(): Promise<Order[]> {
  return request<Order[]>("/shippers/orders", {
    method: "GET",
  });
}

export async function assignOrderToShipper(orderId: number, shipperId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/shippers/orders/${orderId}/assign`, {
    method: "POST",
    json: { shipperId },
  });
}

export async function shipOrder(orderId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/shippers/orders/${orderId}/ship`, {
    method: "POST",
  });
}

export async function deliverOrder(orderId: number, notes?: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/shippers/orders/${orderId}/deliver`, {
    method: "POST",
    json: notes ? { notes } : undefined,
  });
}

// ------ INVENTORY (EnterpriseAdmin) ------
export interface InventoryHistoryResponse {
  items: InventoryHistory[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export async function getInventoryHistory(params?: {
  productId?: number;
  page?: number;
  pageSize?: number;
}): Promise<InventoryHistoryResponse> {
  const searchParams = new URLSearchParams();
  if (params?.productId) searchParams.append("productId", String(params.productId));
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize) searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  try {
    return request<InventoryHistoryResponse>(`/inventory/history${query ? "?" + query : ""}`, {
      method: "GET",
    });
  } catch (error) {
    // Fallback to empty array if 404
    if (error instanceof Error && error.message.includes("404")) {
      console.warn("Inventory history endpoint not found, returning empty array");
      return {
        items: [],
        page: 1,
        pageSize: 50,
        totalItems: 0,
        totalPages: 0,
      };
    }
    throw error;
  }
}

export async function adjustInventory(payload: AdjustInventoryDto): Promise<InventoryHistory> {
  return request<InventoryHistory>("/inventory/adjust", {
    method: "POST",
    json: payload,
  });
}

// ------ NOTIFICATIONS (EnterpriseAdmin) ------
export async function getNotifications(params?: {
  unreadOnly?: boolean;
  type?: string;
}): Promise<Notification[]> {
  const searchParams = new URLSearchParams();
  if (params?.unreadOnly) searchParams.append("unreadOnly", "true");
  if (params?.type) searchParams.append("type", params.type);

  const query = searchParams.toString();
  try {
    return request<Notification[]>(`/notifications${query ? "?" + query : ""}`, {
      method: "GET",
    });
  } catch (error) {
    // Fallback to empty array if 404
    if (error instanceof Error && error.message.includes("404")) {
      console.warn("Notifications endpoint not found, returning empty array");
      return [];
    }
    throw error;
  }
}

export async function markNotificationAsRead(id: number): Promise<void> {
  return request<void>(`/notifications/${id}/read`, {
    method: "PUT",
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  return request<void>("/notifications/read-all", {
    method: "PUT",
  });
}

export async function deleteNotification(id: number): Promise<void> {
  return request<void>(`/notifications/${id}`, {
    method: "DELETE",
  });
}

// ------ ENTERPRISE SETTINGS (EnterpriseAdmin) ------
export async function getEnterpriseSettings(): Promise<EnterpriseSettings> {
  return request<EnterpriseSettings>("/enterprises/me/settings", {
    method: "GET",
  });
}

export async function updateEnterpriseSettings(payload: EnterpriseSettings): Promise<EnterpriseSettings> {
  return request<EnterpriseSettings>("/enterprises/me/settings", {
    method: "PUT",
    json: payload,
  });
}

// ------ ENTERPRISE PROFILE (EnterpriseAdmin) ------
export async function getMyEnterprise(): Promise<Enterprise> {
  return request<Enterprise>("/enterprises/me", {
    method: "GET",
  });
}

export interface UpdateMyEnterpriseDto {
  name?: string;
  description?: string;
  address?: string;
  ward?: string;
  district?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  emailContact?: string;
  website?: string;
  businessField?: string;
  imageUrl?: string;
}

export async function updateMyEnterprise(payload: UpdateMyEnterpriseDto): Promise<void> {
  return request<void>("/enterprises/me", {
    method: "PUT",
    json: payload,
  });
}

// ------ FILE UPLOAD ------
export interface UploadImageResponse {
  success: boolean;
  message?: string;
  imageUrl: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
}

export async function uploadImage(file: File, folder?: string): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) {
    formData.append("folder", folder);
  }

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/fileupload/image${folder ? `?folder=${encodeURIComponent(folder)}` : ""}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    credentials: "omit",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export interface UploadDocumentResponse {
  success: boolean;
  message?: string;
  documentUrl: string;
  fileName: string;
}

// ------ REVIEWS ------
export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number; // 1-5
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: User;
  product?: Product;
}

export async function getReviews(): Promise<Review[]> {
  return request<Review[]>("/reviews", {
    method: "GET",
  });
}

export async function getReview(id: number): Promise<Review> {
  return request<Review>(`/reviews/${id}`, {
    method: "GET",
  });
}

export async function createReview(payload: Omit<Review, "id" | "createdAt" | "updatedAt" | "user" | "product">): Promise<Review> {
  return request<Review>("/reviews", {
    method: "POST",
    json: payload,
  });
}

export async function updateReview(id: number, payload: Partial<Omit<Review, "id" | "userId" | "productId" | "createdAt" | "updatedAt" | "user" | "product">>): Promise<Review> {
  return request<Review>(`/reviews/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function deleteReview(id: number): Promise<void> {
  return request<void>(`/reviews/${id}`, {
    method: "DELETE",
  });
}

// ------ SHIPPING ADDRESSES ------
export interface ShippingAddress {
  id: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district: string;
  province: string;
  label?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateShippingAddressDto {
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district: string;
  province: string;
  label?: string;
  isDefault?: boolean;
}

export interface UpdateShippingAddressDto {
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district: string;
  province: string;
  label?: string;
  isDefault?: boolean;
}

export async function getShippingAddresses(): Promise<ShippingAddress[]> {
  return request<ShippingAddress[]>("/shipping-addresses", {
    method: "GET",
  });
}

export async function getShippingAddress(id: number): Promise<ShippingAddress> {
  return request<ShippingAddress>(`/shipping-addresses/${id}`, {
    method: "GET",
  });
}

export async function createShippingAddress(payload: CreateShippingAddressDto): Promise<ShippingAddress> {
  return request<ShippingAddress>("/shipping-addresses", {
    method: "POST",
    json: payload,
  });
}

export async function updateShippingAddress(id: number, payload: UpdateShippingAddressDto): Promise<ShippingAddress> {
  return request<ShippingAddress>(`/shipping-addresses/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function setDefaultShippingAddress(id: number): Promise<ShippingAddress> {
  return request<ShippingAddress>(`/shipping-addresses/${id}/set-default`, {
    method: "PATCH",
  });
}

export async function deleteShippingAddress(id: number): Promise<void> {
  return request<void>(`/shipping-addresses/${id}`, {
    method: "DELETE",
  });
}

// ------ PROFILE AVATAR ------
export interface AvatarResponse {
  success: boolean;
  message: string;
  imageId?: number;
  imageUrl?: string;
  fileName?: string;
  createdAt?: string;
}

export async function uploadAvatar(file: File): Promise<AvatarResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/profile/avatar`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    credentials: "omit",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload avatar failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function updateAvatar(file: File): Promise<AvatarResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/profile/avatar`;
  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: formData,
    credentials: "omit",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Update avatar failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function deleteAvatar(): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>("/profile/avatar", {
    method: "DELETE",
  });
}

export async function getAvatar(): Promise<AvatarResponse> {
  return request<AvatarResponse>("/profile/avatar", {
    method: "GET",
  });
}

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/fileupload/document`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    credentials: "omit",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

// ------ CHANGE PASSWORD (Auth) ------
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export async function changePassword(payload: ChangePasswordDto): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/change-password", {
    method: "PUT",
    json: {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      confirmNewPassword: payload.confirmNewPassword,
    },
  });
}

// ------ CREATE ENTERPRISE ADMIN (SystemAdmin) ------
export interface CreateEnterpriseAdminDto {
  name: string;
  email: string;
  password: string;
  enterpriseId: number;
}

export async function createEnterpriseAdmin(payload: CreateEnterpriseAdminDto): Promise<User> {
  return request<User>("/users/enterprise-admin", {
    method: "POST",
    json: payload,
  });
}

// ------ GPS ADDRESS LOOKUP ------
export interface GpsAddressLookupDto {
  addressLine: string;
  ward: string;
  district: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
}

export async function getAddressFromGps(lat: number, lng: number): Promise<GpsAddressLookupDto> {
  return request<GpsAddressLookupDto>(`/shippingaddress/from-gps?lat=${lat}&lng=${lng}`, {
    method: "GET",
  });
}

// ------ TRANSACTIONS ------
export interface Transaction {
  id: number;
  orderId?: number;
  userId?: number;
  amount: number;
  type: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getTransactions(): Promise<Transaction[]> {
  return request<Transaction[]>("/transactions", {
    method: "GET",
  });
}

export async function getTransaction(id: number): Promise<Transaction> {
  return request<Transaction>(`/transactions/${id}`, {
    method: "GET",
  });
}

export async function createTransaction(payload: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
  return request<Transaction>("/transactions", {
    method: "POST",
    json: payload,
  });
}

// ------ LOCATIONS (SystemAdmin) ------
export interface Location {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CreateLocationDto {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export async function getLocations(): Promise<Location[]> {
  return request<Location[]>("/locations", {
    method: "GET",
  });
}

export async function getLocation(id: number): Promise<Location> {
  return request<Location>(`/locations/${id}`, {
    method: "GET",
  });
}

export async function createLocation(payload: CreateLocationDto): Promise<Location> {
  return request<Location>("/locations", {
    method: "POST",
    json: payload,
  });
}

export async function updateLocation(id: number, payload: CreateLocationDto): Promise<void> {
  return request<void>(`/locations/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function deleteLocation(id: number): Promise<void> {
  return request<void>(`/locations/${id}`, {
    method: "DELETE",
  });
}

// ------ PRODUCERS (SystemAdmin) ------
export interface Producer {
  id: number;
  name: string;
  address: string;
}

export interface CreateProducerDto {
  name: string;
  address: string;
}

export async function getProducers(): Promise<Producer[]> {
  return request<Producer[]>("/producers", {
    method: "GET",
  });
}

export async function getProducer(id: number): Promise<Producer> {
  return request<Producer>(`/producers/${id}`, {
    method: "GET",
  });
}

export async function createProducer(payload: CreateProducerDto): Promise<Producer> {
  return request<Producer>("/producers", {
    method: "POST",
    json: payload,
  });
}

export async function updateProducer(id: number, payload: CreateProducerDto): Promise<void> {
  return request<void>(`/producers/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function deleteProducer(id: number): Promise<void> {
  return request<void>(`/producers/${id}`, {
    method: "DELETE",
  });
}

// ------ PRODUCT IMAGES (EnterpriseAdmin) ------
export interface ProductImage {
  id: number;
  url: string;
  fileName: string;
  isApproved: boolean;
  createdAt: string;
}

export async function getProductImages(productId: number): Promise<ProductImage[]> {
  return request<ProductImage[]>(`/productimages/products/${productId}/images`, {
    method: "GET",
  });
}

export async function uploadProductImage(productId: number, file: File): Promise<{ success: boolean; message: string; imageId: number; imageUrl: string; fileName: string; isApproved: boolean }> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/productimages/products/${productId}/images`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    credentials: "omit",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload product image failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function deleteProductImage(productId: number, imageId: number): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/productimages/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

// ------ ADMIN IMAGES (SystemAdmin) ------
export interface AdminImage {
  id: number;
  url: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  imageType: string;
  userId?: number;
  productId?: number;
  enterpriseId?: number;
  productName?: string;
  enterpriseName?: string;
  uploadedByUserId?: number;
  uploadedByRole?: string;
  uploadedByName?: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface AdminImagesResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  images: AdminImage[];
}

export async function getAdminImages(params?: {
  imageType?: string;
  isApproved?: boolean;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<AdminImagesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.imageType) searchParams.append("imageType", params.imageType);
  if (params?.isApproved !== undefined) searchParams.append("isApproved", String(params.isApproved));
  if (params?.isActive !== undefined) searchParams.append("isActive", String(params.isActive));
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize) searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  return request<AdminImagesResponse>(`/admin/images${query ? "?" + query : ""}`, {
    method: "GET",
  });
}

export async function getAdminImage(imageId: number): Promise<AdminImage> {
  return request<AdminImage>(`/admin/images/${imageId}`, {
    method: "GET",
  });
}

export async function approveAdminImage(imageId: number): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/admin/images/${imageId}/approve`, {
    method: "PUT",
  });
}

export async function rejectAdminImage(imageId: number): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/admin/images/${imageId}/reject`, {
    method: "PUT",
  });
}

export async function deleteAdminImage(imageId: number): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/admin/images/${imageId}`, {
    method: "DELETE",
  });
}

export interface AdminImageStats {
  totalImages: number;
  activeImages: number;
  approvedImages: number;
  pendingImages: number;
  byType: Array<{
    imageType: string;
    count: number;
    activeCount: number;
    approvedCount: number;
  }>;
}

export async function getAdminImageStats(): Promise<AdminImageStats> {
  return request<AdminImageStats>("/admin/images/stats", {
    method: "GET",
  });
}

// ------ MAP FILTER (Enhanced) ------
// Note: getMapFilterOptions is already defined above (line 1166), so we don't duplicate it here

export async function filterMapEnterprises(params: MapSearchParams): Promise<{ data: EnterpriseMapDto[]; total: number; page: number; pageSize: number }> {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.append("keyword", params.keyword);
  if (params.district) searchParams.append("district", params.district);
  if (params.province) searchParams.append("province", params.province);
  if (params.businessField) searchParams.append("businessField", params.businessField);
  if (params.ocopRating) searchParams.append("ocopRating", String(params.ocopRating));
  if (params.minLat) searchParams.append("minLatitude", String(params.minLat));
  if (params.maxLat) searchParams.append("maxLatitude", String(params.maxLat));
  if (params.minLon) searchParams.append("minLongitude", String(params.minLon));
  if (params.maxLon) searchParams.append("maxLongitude", String(params.maxLon));
  if (params.latitude) searchParams.append("userLatitude", String(params.latitude));
  if (params.longitude) searchParams.append("userLongitude", String(params.longitude));
  if (params.radiusKm) searchParams.append("maxDistance", String(params.radiusKm));
  if (params.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params.page) searchParams.append("page", String(params.page));
  if (params.pageSize) searchParams.append("pageSize", String(params.pageSize));

  return request<{ data: EnterpriseMapDto[]; total: number; page: number; pageSize: number }>(`/map/filter?${searchParams.toString()}`, {
    method: "GET",
  });
}

// ------ SHIPPING ADDRESSES (Enhanced with GPS) ------
export interface ShippingAddressWithGps extends ShippingAddress {
  latitude?: number;
  longitude?: number;
}

export async function getAddressFromGpsForShipping(lat: number, lng: number): Promise<GpsAddressLookupDto> {
  return getAddressFromGps(lat, lng);
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
