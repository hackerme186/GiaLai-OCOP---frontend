// Backend API Integration for GiaLai OCOP
// API URL được lấy từ environment variable:
// - Local: .env.local → NEXT_PUBLIC_API_BASE=http://localhost:5003/api
// - Production: .env.production → NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
// Hoặc set trực tiếp trên hosting platform (Render, Vercel, etc.)
import { getAuthToken, getClaimsFromJwt } from "@/lib/auth";

// API Base URL - lấy từ environment variable
// Next.js tự động load .env.local (development) hoặc .env.production (production)
// Fallback: production URL nếu không có env var
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE || "https://gialai-ocop-be.onrender.com/api";

type Json = unknown;

// Track last error log time to prevent spam
let lastErrorLogTime = 0;
const ERROR_LOG_COOLDOWN = 30000; // 30 seconds

// Retry configuration for cold start
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 3000]; // 1s, 2s, 3s delays

async function request<TResponse>(
  path: string,
  options: RequestInit & {
    json?: Json;
    silent?: boolean;
    retries?: number;
  } = {}
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;
  const retries = options.retries ?? 0;

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
      body:
        options.json !== undefined
          ? JSON.stringify(options.json)
          : options.body,
      // credentials: "include", // REMOVED: Causes CORS error with wildcard Access-Control-Allow-Origin
      credentials: "omit", // Don't send cookies - fixes CORS with wildcard origin
      cache: "no-store",
    });

    if (path.includes("/auth/login")) {
      console.log(
        "🌐 [API] Response status:",
        response.status,
        response.statusText
      );
      console.log(
        "🌐 [API] Response headers:",
        Object.fromEntries(response.headers.entries())
      );
    }
  } catch (fetchError) {
    // Network error - backend không available
    const errorMsg =
      fetchError instanceof Error ? fetchError.message : "Network error";

    // Retry logic for cold start (only for GET requests and if retries not exhausted)
    const isGetRequest = !options.method || options.method === "GET";
    const shouldRetry =
      isGetRequest && retries < MAX_RETRIES && !options.silent;

    if (shouldRetry) {
      const delay = RETRY_DELAYS[retries] || 3000;
      console.info(
        `🔄 [API] Retry ${
          retries + 1
        }/${MAX_RETRIES} sau ${delay}ms (cold start?)...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry with incremented retry count
      return request<TResponse>(path, {
        ...options,
        retries: retries + 1,
      });
    }

    // Only log error if not in silent mode and cooldown has passed
    const now = Date.now();
    if (!options.silent && now - lastErrorLogTime > ERROR_LOG_COOLDOWN) {
      // Use console.warn instead of console.error for network errors (less alarming)
      console.warn(
        `⚠️ Backend API không khả dụng (${API_BASE_URL}):`,
        errorMsg
      );
      console.info(
        "💡 Backend có thể đang cold start. Render free tier sleep sau 15 phút không hoạt động."
      );
      console.info(
        "💡 Đợi 30-60 giây để backend khởi động, hoặc chạy local backend với: dotnet run"
      );
      lastErrorLogTime = now;
    }

    // Create a custom error with more context
    const apiError = new Error(
      `Lỗi kết nối. Vui lòng kiểm tra internet hoặc thử lại sau.`
    ) as any;
    apiError.status = 0; // Network error
    apiError.isNetworkError = true;
    apiError.originalError = errorMsg;
    apiError.silent = options.silent; // Mark error as silent

    // Suppress stack trace in console for silent errors
    if (options.silent) {
      // Create a minimal error object without stack trace to reduce console noise
      const silentError: any = {
        message: apiError.message,
        status: apiError.status,
        isNetworkError: apiError.isNetworkError,
        originalError: apiError.originalError,
        silent: true,
        name: "NetworkError",
        // Override toString to prevent stack trace display
        toString: () => apiError.message,
      };
      // Prevent stack trace from being captured
      if (Error.captureStackTrace) {
        Error.captureStackTrace(silentError, () => {});
      }
      throw silentError;
    }

    throw apiError;
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
    let bodyMessage =
      (isJson && data && typeof data === "object" && (data as any).message) ||
      "";
    let bodyDetails =
      (isJson && data && typeof data === "object" && (data as any).details) ||
      "";
    let bodyError =
      (isJson && data && typeof data === "object" && (data as any).error) || "";

    if (!bodyMessage && !isJson && typeof data === "string") {
      bodyMessage = data as string;
    }

    // Handle 401 Unauthorized with a clear error message
    if (response.status === 401) {
      // Clear invalid token (always logout on 401, even in silent mode)
      if (typeof window !== "undefined") {
        try {
          const { logout } = require("@/lib/auth");
          logout();
        } catch {
          // ignore if logout not available
        }
      }
      const authError = new Error(
        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại."
      );
      (authError as any).status = 401;
      (authError as any).isAuthError = true;
      (authError as any).silent = options.silent;

      // Suppress stack trace in console for silent errors
      if (options.silent) {
        authError.toString = () => authError.message;
        if (Error.captureStackTrace) {
          Error.captureStackTrace(authError, () => {});
        }
      }

      throw authError;
    }

    // Tạo error message thân thiện với người dùng (không hiển thị mã HTTP)
    let message = "";

    // Ưu tiên sử dụng message từ backend
    if (bodyMessage) {
      message = bodyMessage;
    } else if (bodyError) {
      message = bodyError;
    } else {
      // Fallback: Map HTTP status codes to user-friendly messages
      switch (response.status) {
        case 400:
          message = "Thông tin không hợp lệ. Vui lòng kiểm tra lại.";
          break;
        case 403:
          message = "Bạn không có quyền thực hiện thao tác này.";
          break;
        case 404:
          message = "Không tìm thấy dữ liệu. Vui lòng thử lại.";
          break;
        case 409:
          message = "Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.";
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          message = "Lỗi server. Vui lòng thử lại sau.";
          break;
        default:
          message = "Đã xảy ra lỗi. Vui lòng thử lại.";
      }
    }

    // Thêm chi tiết nếu có (không hiển thị trực tiếp cho user, chỉ log)
    if (bodyDetails && typeof bodyDetails === "string" && !options.silent) {
      console.warn("⚠️ [API] Error details:", bodyDetails);
    }

    // Ensure message is a valid string (defensive programming)
    const errorMessage = (
      message && typeof message === "string"
        ? message
        : "Đã xảy ra lỗi. Vui lòng thử lại."
    ).trim();

    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).response = data; // Lưu toàn bộ response data để debug
    (error as any).bodyMessage = bodyMessage;
    (error as any).bodyDetails = bodyDetails;
    (error as any).bodyError = bodyError;
    (error as any).silent = options.silent; // Mark error as silent

    // Suppress stack trace in console for silent errors
    if (options.silent) {
      // Override toString to prevent stack trace display
      error.toString = () => errorMessage;
      // Prevent stack trace from being captured
      if (Error.captureStackTrace) {
        Error.captureStackTrace(error, () => {});
      }
    }

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
  enterpriseId?: number; // Optional: để SystemAdmin có thể tạo product cho enterprise khác
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
  enterpriseImageUrl?: string; // URL ảnh enterprise từ backend
}

export interface CustomerInfo {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  address?: string;
}

export interface OrderEnterpriseStatus {
  id: number;
  orderId: number;
  enterpriseId: number;
  enterpriseName?: string;
  status: string; // "Pending" | "Processing" | "Shipped" | "Completed"
  updatedAt?: string;
  updatedBy?: number;
  notes?: string;
}

export interface Order {
  id: number;
  userId: number;
  orderDate: string;
  shippingAddress?: string;
  shippingAddressId?: number;
  totalAmount: number;
  status: string; // "Pending" | "Processing" | "Shipped" | "Completed" | "Cancelled" | "PendingCompletion"
  completionRequestedAt?: string; // Thời gian EnterpriseAdmin yêu cầu xác nhận hoàn thành
  completionApprovedAt?: string; // Thời gian SystemAdmin xác nhận hoàn thành
  completionRejectedAt?: string; // Thời gian SystemAdmin từ chối
  completionRejectionReason?: string; // Lý do từ chối
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string;
  orderItems?: OrderItem[];
  payments?: Payment[];
  enterpriseApprovalStatus?: string;
  enterpriseStatuses?: OrderEnterpriseStatus[]; // Trạng thái riêng của từng Enterprise (chỉ cho SystemAdmin)
  shipperId?: number;
  shippedAt?: string;
  deliveredAt?: string;
  deliveryNotes?: string;
  customer?: CustomerInfo; // Customer info for EnterpriseAdmin
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
  status:
    | "Pending"
    | "Processing"
    | "Shipped"
    | "Completed"
    | "Cancelled"
    | "PendingCompletion";
  shippingAddress?: string;
}

export interface RequestOrderCompletionDto {
  orderId: number;
  notes?: string;
}

export interface ApproveOrderCompletionDto {
  orderId: number;
  approved: boolean;
  rejectionReason?: string;
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

export interface ConfirmBankTransferDto {
  orderId: number;
  confirmed: boolean;
  rejectionReason?: string;
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
  silent?: boolean; // Silent mode to reduce console errors
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
export async function register(
  payload: RegisterPayload
): Promise<AuthResponse> {
  // Đăng ký đơn giản - chỉ gửi name, email, password
  // Backend tự động trả về JWT token (không cần OTP)
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    json: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
    },
  });
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  console.log("🌐 [API] Login request:", {
    email: payload.email,
    url: `${API_BASE_URL}/auth/login`,
  });
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

export async function loginWithFacebook(
  payload: FacebookLoginPayload
): Promise<AuthResponse> {
  console.log("🌐 [API] Facebook login request:", {
    url: `${API_BASE_URL}/auth/facebook`,
  });
  try {
    // Backend expects AccessToken (PascalCase) - ASP.NET Core automatically maps camelCase to PascalCase
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

export async function loginWithGoogle(
  payload: GoogleLoginPayload
): Promise<AuthResponse> {
  console.log("🌐 [API] Google login request:", {
    url: `${API_BASE_URL}/auth/google`,
  });
  try {
    // Backend expects IdToken (PascalCase) - ASP.NET Core automatically maps camelCase to PascalCase
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

export async function sendOtp(
  payload: SendOtpDto
): Promise<{ message: string; otpCode?: string }> {
  return request<{ message: string; otpCode?: string }>("/auth/send-otp", {
    method: "POST",
    json: payload,
  });
}

export async function verifyOtp(
  payload: VerifyOtpDto
): Promise<{ message: string; verified: boolean }> {
  return request<{ message: string; verified: boolean }>("/auth/verify-otp", {
    method: "POST",
    json: payload,
  });
}

export async function loginWithOtp(
  payload: LoginWithOtpDto
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login-with-otp", {
    method: "POST",
    json: payload,
  });
}

export async function registerWithOtp(
  payload: RegisterWithOtpDto
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register-with-otp", {
    method: "POST",
    json: payload,
  });
}

export async function resendVerificationOtp(
  payload: ResendVerificationOtpDto
): Promise<{ message: string; otpCode?: string }> {
  return request<{ message: string; otpCode?: string }>(
    "/auth/resend-verification-otp",
    {
      method: "POST",
      json: payload,
    }
  );
}

export async function verifyEmail(
  payload: VerifyOtpDto
): Promise<{ message: string; isEmailVerified: boolean }> {
  return request<{ message: string; isEmailVerified: boolean }>(
    "/auth/verify-email",
    {
      method: "POST",
      json: payload,
    }
  );
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

export async function updateUser(
  id: number,
  payload: UpdateUserDto
): Promise<User> {
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
    console.log(
      "📤 [API] updateCurrentUser - Request payload:",
      JSON.stringify(payload, null, 2)
    );
  }

  const result = await request<User>("/users/me", {
    method: "PUT",
    json: payload,
  });

  // Log response để debug
  if (typeof window !== "undefined") {
    console.log(
      "📥 [API] updateCurrentUser - Response:",
      JSON.stringify(result, null, 2)
    );

    // Kiểm tra dữ liệu có được cập nhật không
    const fieldsNotInResponse: string[] = [];
    const fieldsNotUpdated: string[] = [];

    if (payload.name && result.name !== payload.name)
      fieldsNotUpdated.push("name");

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

    if (
      payload.shippingAddress &&
      result.shippingAddress !== payload.shippingAddress
    ) {
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
      console.warn(
        "⚠️ [API] updateCurrentUser - Các trường sau không khớp với payload:",
        fieldsNotUpdated
      );
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

export async function updateShippingAddressDetail(
  payload: UpdateShippingAddressDetailDto
): Promise<User> {
  return request<User>("/users/update-shipping-address", {
    method: "PUT",
    json: payload,
  });
}

// ------ CATEGORIES ------
export async function getCategories(isActive?: boolean): Promise<Category[]> {
  const query = isActive !== undefined ? `?isActive=${isActive}` : "";
  return request<Category[]>(`/categories${query}`, {
    method: "GET",
  });
}

export async function getCategory(id: number): Promise<Category> {
  return request<Category>(`/categories/${id}`, {
    method: "GET",
  });
}

export async function createCategory(
  payload: CreateCategoryDto
): Promise<Category> {
  return request<Category>("/categories", {
    method: "POST",
    json: payload,
  });
}

export async function updateCategory(
  id: number,
  payload: Partial<CreateCategoryDto>
): Promise<Category> {
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
  silent?: boolean; // Silent mode to reduce console errors
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));
  if (params?.status) searchParams.append("status", params.status);
  if (params?.categoryId)
    searchParams.append("categoryId", String(params.categoryId));

  // Support both 'search' and 'q' parameters (BE may use either)
  // If both are provided, prefer 'q', otherwise use whichever is provided
  const searchTerm = params?.q || params?.search;
  if (searchTerm) {
    // Try 'q' parameter first (more common in REST APIs)
    if (params?.q) {
      searchParams.append("q", params.q);
    }
    // Also try 'search' if provided (some APIs use this)
    if (params?.search && !params?.q) {
      searchParams.append("search", params.search);
    }
  }
  if (params?.enterpriseId)
    searchParams.append("enterpriseId", String(params.enterpriseId));

  const query = searchParams.toString();
  const url = `/products${query ? "?" + query : ""}`;

  // Debug: Log the API call
  if (params?.search || params?.q) {
    console.log("🔍 API Call:", {
      fullUrl: `${API_BASE_URL}${url}`,
      searchTerm: params?.search || params?.q,
      params: { q: params?.q, search: params?.search },
    });
  }

  try {
    const response = await request<
      Product[] | { products?: Product[]; items?: Product[]; data?: Product[] }
    >(url, {
      method: "GET",
      silent: params?.silent, // Pass silent mode to request
    });

    // Debug: Log the response
    if (params?.search || params?.q) {
      const resultCount = Array.isArray(response)
        ? response.length
        : response && typeof response === "object"
        ? (response as any).products?.length ||
          (response as any).items?.length ||
          (response as any).data?.length ||
          0
        : 0;
      console.log("✅ API Response:", {
        searchTerm: params?.search || params?.q,
        count: resultCount,
        responseType: Array.isArray(response) ? "array" : typeof response,
        responseKeys:
          response && typeof response === "object" ? Object.keys(response) : [],
      });
    }

    // Normalize response: handle both array and object formats
    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === "object") {
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
    console.warn("⚠️ Unexpected products response format:", response);
    return [];
  } catch (error) {
    // If silent mode and network error, return empty array instead of throwing
    if (
      params?.silent &&
      ((error as any)?.isNetworkError || (error as any)?.status === 0)
    ) {
      return [];
    }
    throw error;
  }
}

export async function getProduct(
  id: number,
  options?: { silent?: boolean }
): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: "GET",
    silent: options?.silent,
  });
}

export async function createProduct(
  payload: CreateProductDto
): Promise<Product> {
  return request<Product>("/products", {
    method: "POST",
    json: payload,
  });
}

export async function updateProduct(
  id: number,
  payload: Partial<CreateProductDto>
): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: "PUT",
    json: payload,
  });
}

/// <summary>
/// SystemAdmin: Cập nhật chỉ ảnh sản phẩm
/// </summary>
export async function updateProductImage(
  id: number,
  imageUrl: string
): Promise<void> {
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

export async function updateProductStatus(
  id: number,
  payload: UpdateProductStatusDto
): Promise<Product> {
  return request<Product>(`/products/${id}/status`, {
    method: "POST",
    json: payload,
  });
}

// ------ ENTERPRISE APPLICATIONS ------
export async function createEnterpriseApplication(
  payload: CreateEnterpriseApplicationDto
): Promise<EnterpriseApplication> {
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
  if (params?.status) searchParams.append("status", params.status);
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  return request<EnterpriseApplication[]>(
    `/enterpriseapplications${query ? "?" + query : ""}`,
    {
      method: "GET",
    }
  );
}

export async function approveEnterpriseApplication(id: number): Promise<void> {
  return request<void>(`/enterpriseapplications/${id}/approve`, {
    method: "PUT",
  });
}

export async function rejectEnterpriseApplication(
  id: number,
  comment: string
): Promise<void> {
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
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));
  if (params?.search) searchParams.append("search", params.search);
  if (params?.district) searchParams.append("district", params.district);
  if (params?.province) searchParams.append("province", params.province);
  if (params?.businessField)
    searchParams.append("businessField", params.businessField);

  const query = searchParams.toString();
  return request<Enterprise[]>(`/enterprises${query ? "?" + query : ""}`, {
    method: "GET",
  });
}

export async function getEnterprise(id: number): Promise<Enterprise> {
  return request<Enterprise>(`/enterprises/${id}`, {
    method: "GET",
  });
}

export async function updateEnterprise(
  id: number,
  payload: Partial<Enterprise>
): Promise<Enterprise> {
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
export interface OrdersResponse {
  items: Order[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export async function getOrders(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.startDate) searchParams.append("startDate", params.startDate);
  if (params?.endDate) searchParams.append("endDate", params.endDate);
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  return request<OrdersResponse>(`/orders${query ? "?" + query : ""}`, {
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

export async function updateOrderStatus(
  id: number,
  payload: UpdateOrderStatusDto
): Promise<Order> {
  return request<Order>(`/orders/${id}/status`, {
    method: "PUT",
    json: payload,
  });
}

// Request order completion approval (EnterpriseAdmin)
export async function requestOrderCompletion(
  payload: RequestOrderCompletionDto
): Promise<Order> {
  return request<Order>(`/orders/${payload.orderId}/request-completion`, {
    method: "POST",
    json: { notes: payload.notes },
  });
}

// Approve/Reject order completion (SystemAdmin)
export async function approveOrderCompletion(
  payload: ApproveOrderCompletionDto
): Promise<Order> {
  return request<Order>(`/orders/${payload.orderId}/approve-completion`, {
    method: "POST",
    json: {
      approved: payload.approved,
      rejectionReason: payload.rejectionReason,
    },
  });
}

export async function updateOrderShippingAddress(
  id: number,
  shippingAddress: string
): Promise<void> {
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
export async function createPayment(
  payload: CreatePaymentDto
): Promise<Payment[]> {
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

export async function updatePaymentStatus(
  id: number,
  payload: UpdatePaymentStatusDto
): Promise<Payment> {
  return request<Payment>(`/payments/${id}/status`, {
    method: "POST",
    json: payload,
  });
}

export async function confirmBankTransfer(
  payload: ConfirmBankTransferDto
): Promise<Order> {
  return request<Order>(`/orders/${payload.orderId}/confirm-bank-transfer`, {
    method: "POST",
    json: payload,
  });
}

// ------ MAP API ------
export async function searchMap(
  params: MapSearchParams
): Promise<EnterpriseMapDto[]> {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.append("keyword", params.keyword);
  if (params.latitude) searchParams.append("latitude", String(params.latitude));
  if (params.longitude)
    searchParams.append("longitude", String(params.longitude));
  if (params.radiusKm) searchParams.append("radiusKm", String(params.radiusKm));
  if (params.minLat) searchParams.append("minLat", String(params.minLat));
  if (params.maxLat) searchParams.append("maxLat", String(params.maxLat));
  if (params.minLon) searchParams.append("minLon", String(params.minLon));
  if (params.maxLon) searchParams.append("maxLon", String(params.maxLon));
  if (params.district) searchParams.append("district", params.district);
  if (params.province) searchParams.append("province", params.province);
  if (params.businessField)
    searchParams.append("businessField", params.businessField);
  if (params.ocopRating)
    searchParams.append("ocopRating", String(params.ocopRating));
  if (params.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params.page) searchParams.append("page", String(params.page));
  if (params.pageSize) searchParams.append("pageSize", String(params.pageSize));

  // Nếu không có tham số nào, gọi endpoint không có query string
  const queryString = searchParams.toString();
  const url = queryString ? `/map/search?${queryString}` : "/map/search";

  try {
    return await request<EnterpriseMapDto[]>(url, {
      method: "GET",
      silent: params?.silent, // Pass silent mode to request
    });
  } catch (error) {
    // If silent mode and network error, return empty array instead of throwing
    if (
      params?.silent &&
      ((error as any)?.isNetworkError || (error as any)?.status === 0)
    ) {
      return [];
    }
    throw error;
  }
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

  return request<EnterpriseMapDto[]>(
    `/map/bounding-box?${searchParams.toString()}`,
    {
      method: "GET",
    }
  );
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

export async function getMapEnterpriseProducts(
  id: number,
  params?: {
    page?: number;
    pageSize?: number;
  }
): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  return request<Product[]>(
    `/map/enterprises/${id}/products${query ? "?" + query : ""}`,
    {
      method: "GET",
    }
  );
}

// Get products for a specific enterprise (for EnterpriseAdmin)
export async function getEnterpriseProducts(
  enterpriseId: number,
  params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }
): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));
  if (params?.status) searchParams.append("status", params.status);

  const query = searchParams.toString();

  // Try multiple endpoints in order until one works
  const endpoints = [
    `/enterprises/${enterpriseId}/products${query ? "?" + query : ""}`,
    `/products${query ? "?" + query : ""}?enterpriseId=${enterpriseId}`,
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
      console.warn(
        `❌ Failed ${endpoint}:`,
        error instanceof Error ? error.message : error
      );
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

export async function assignOrderToShipper(
  orderId: number,
  shipperId: number
): Promise<{ message: string }> {
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

export async function deliverOrder(
  orderId: number,
  notes?: string
): Promise<{ message: string }> {
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
  if (params?.productId)
    searchParams.append("productId", String(params.productId));
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  try {
    return request<InventoryHistoryResponse>(
      `/inventory/history${query ? "?" + query : ""}`,
      {
        method: "GET",
      }
    );
  } catch (error) {
    // Fallback to empty array if 404
    if (error instanceof Error && error.message.includes("404")) {
      console.warn(
        "Inventory history endpoint not found, returning empty array"
      );
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

export async function adjustInventory(
  payload: AdjustInventoryDto
): Promise<InventoryHistory> {
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
    return request<Notification[]>(
      `/notifications${query ? "?" + query : ""}`,
      {
        method: "GET",
      }
    );
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

export async function updateEnterpriseSettings(
  payload: EnterpriseSettings
): Promise<EnterpriseSettings> {
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

export async function updateMyEnterprise(
  payload: UpdateMyEnterpriseDto
): Promise<void> {
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

export async function uploadImage(
  file: File,
  folder?: string
): Promise<UploadImageResponse> {
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

  const url = `${API_BASE_URL}/fileupload/image${
    folder ? `?folder=${encodeURIComponent(folder)}` : ""
  }`;
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

export async function createReview(
  payload: Omit<Review, "id" | "createdAt" | "updatedAt" | "user" | "product">
): Promise<Review> {
  return request<Review>("/reviews", {
    method: "POST",
    json: payload,
  });
}

export async function updateReview(
  id: number,
  payload: Partial<
    Omit<
      Review,
      | "id"
      | "userId"
      | "productId"
      | "createdAt"
      | "updatedAt"
      | "user"
      | "product"
    >
  >
): Promise<Review> {
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

export async function createShippingAddress(
  payload: CreateShippingAddressDto
): Promise<ShippingAddress> {
  return request<ShippingAddress>("/shipping-addresses", {
    method: "POST",
    json: payload,
  });
}

export async function updateShippingAddress(
  id: number,
  payload: UpdateShippingAddressDto
): Promise<ShippingAddress> {
  return request<ShippingAddress>(`/shipping-addresses/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function setDefaultShippingAddress(
  id: number
): Promise<ShippingAddress> {
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

export async function deleteAvatar(): Promise<{
  success: boolean;
  message: string;
}> {
  return request<{ success: boolean; message: string }>("/profile/avatar", {
    method: "DELETE",
  });
}

export async function getAvatar(): Promise<AvatarResponse> {
  return request<AvatarResponse>("/profile/avatar", {
    method: "GET",
  });
}

export async function uploadDocument(
  file: File
): Promise<UploadDocumentResponse> {
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

export async function changePassword(
  payload: ChangePasswordDto
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/change-password", {
    method: "PUT",
    json: {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      confirmNewPassword: payload.confirmNewPassword,
    },
  });
}

// ------ FORGOT PASSWORD (Auth) ------
export interface ForgotPasswordDto {
  email: string;
}

export async function forgotPassword(
  payload: ForgotPasswordDto
): Promise<void> {
  return request<void>("/auth/forgot-password", {
    method: "POST",
    json: {
      email: payload.email,
    },
  });
}

// ------ RESET PASSWORD (Auth) ------
export interface ResetPasswordDto {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmNewPassword: string;
}

export async function resetPassword(
  payload: ResetPasswordDto
): Promise<void> {
  return request<void>("/auth/reset-password", {
    method: "POST",
    json: {
      email: payload.email,
      otpCode: payload.otpCode,
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

export async function createEnterpriseAdmin(
  payload: CreateEnterpriseAdminDto
): Promise<User> {
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

export async function getAddressFromGps(
  lat: number,
  lng: number
): Promise<GpsAddressLookupDto> {
  return request<GpsAddressLookupDto>(
    `/shippingaddress/from-gps?lat=${lat}&lng=${lng}`,
    {
      method: "GET",
    }
  );
}

// ------ TRANSACTION HISTORY ------
export type TransactionSort =
  | "date_desc"
  | "date_asc"
  | "amount_desc"
  | "amount_asc";

export interface TransactionHistoryFilter {
  searchTerm?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  status?: string;
  paymentMethod?: string;
  type?: string;
  sortBy?: TransactionSort;
  page?: number;
  pageSize?: number;
}

export interface TransactionHistoryItem {
  transactionCode: string;
  orderCode?: string;
  transactionDate: string;
  amount: number;
  paymentMethod: string;
  status: string;
  type: string;
  description?: string;
  orderId?: number; // derived from code for easy navigation
}

export interface TransactionHistoryResponse {
  items: TransactionHistoryItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface TransactionCustomerInfo {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  address?: string;
}

export interface TransactionOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  productImage?: string;
}

export interface TransactionPaymentInfo {
  method: string;
  status: string;
  reference: string;
  maskedBankAccount?: string;
  bankName?: string;
  paidAt?: string;
}

export interface TransactionShippingInfo {
  shipperName?: string;
  trackingNumber?: string;
  status: string;
  shippedAt?: string;
  deliveredAt?: string;
  deliveryNotes?: string;
  shippingAddress?: string;
}

export interface TransactionDetail {
  id: number;
  transactionCode: string;
  transactionDate: string;
  status: string;
  type: string;
  totalAmount: number;
  customer?: TransactionCustomerInfo;
  orderItems?: TransactionOrderItem[];
  payments?: TransactionPaymentInfo[];
  shippingInfo?: TransactionShippingInfo;
}

const extractOrderId = (code?: string): number | undefined => {
  if (!code) return undefined;
  const match = code.match(/(\d+)/);
  if (!match) return undefined;
  const id = Number(match[1]);
  return Number.isNaN(id) ? undefined : id;
};

const normalizeDateParam = (value?: string | Date): string | undefined => {
  if (!value) return undefined;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export async function getTransactionHistory(
  filter: TransactionHistoryFilter = {}
): Promise<TransactionHistoryResponse> {
  const params = new URLSearchParams();

  if (filter.searchTerm?.trim())
    params.set("searchTerm", filter.searchTerm.trim());
  const startDate = normalizeDateParam(filter.startDate);
  const endDate = normalizeDateParam(filter.endDate);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (filter.status) params.set("status", filter.status);
  if (filter.paymentMethod) params.set("paymentMethod", filter.paymentMethod);
  if (filter.type) params.set("type", filter.type);
  if (filter.sortBy) params.set("sortBy", filter.sortBy);
  if (filter.page) params.set("page", filter.page.toString());
  if (filter.pageSize) params.set("pageSize", filter.pageSize.toString());

  const query = params.toString();
  const response = await request<TransactionHistoryResponse>(
    `/transactionhistory${query ? `?${query}` : ""}`,
    {
      method: "GET",
    }
  );

  const itemsWithOrderId = (response.items || []).map((item) => ({
    ...item,
    orderId: extractOrderId(item.orderCode || item.transactionCode),
  }));

  return {
    ...response,
    items: itemsWithOrderId,
  };
}

export async function getTransactionDetail(
  id: number
): Promise<TransactionDetail> {
  return request<TransactionDetail>(`/transactionhistory/${id}`, {
    method: "GET",
  });
}

// Backward-compatible aliases
export async function getTransactions(
  filter?: TransactionHistoryFilter
): Promise<TransactionHistoryItem[]> {
  const res = await getTransactionHistory(filter);
  return res.items;
}

export async function getTransaction(id: number): Promise<TransactionDetail> {
  return getTransactionDetail(id);
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

export async function createLocation(
  payload: CreateLocationDto
): Promise<Location> {
  return request<Location>("/locations", {
    method: "POST",
    json: payload,
  });
}

export async function updateLocation(
  id: number,
  payload: CreateLocationDto
): Promise<void> {
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

export async function createProducer(
  payload: CreateProducerDto
): Promise<Producer> {
  return request<Producer>("/producers", {
    method: "POST",
    json: payload,
  });
}

export async function updateProducer(
  id: number,
  payload: CreateProducerDto
): Promise<void> {
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

export async function getProductImages(
  productId: number
): Promise<ProductImage[]> {
  return request<ProductImage[]>(
    `/productimages/products/${productId}/images`,
    {
      method: "GET",
    }
  );
}

export async function uploadProductImage(
  productId: number,
  file: File
): Promise<{
  success: boolean;
  message: string;
  imageId: number;
  imageUrl: string;
  fileName: string;
  isApproved: boolean;
}> {
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
    throw new Error(
      `Upload product image failed: ${response.status} ${errorText}`
    );
  }

  return response.json();
}

export async function deleteProductImage(
  productId: number,
  imageId: number
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/productimages/products/${productId}/images/${imageId}`,
    {
      method: "DELETE",
    }
  );
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
  if (params?.isApproved !== undefined)
    searchParams.append("isApproved", String(params.isApproved));
  if (params?.isActive !== undefined)
    searchParams.append("isActive", String(params.isActive));
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  return request<AdminImagesResponse>(
    `/admin/images${query ? "?" + query : ""}`,
    {
      method: "GET",
    }
  );
}

export async function getAdminImage(imageId: number): Promise<AdminImage> {
  return request<AdminImage>(`/admin/images/${imageId}`, {
    method: "GET",
  });
}

export async function approveAdminImage(
  imageId: number
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/admin/images/${imageId}/approve`,
    {
      method: "PUT",
    }
  );
}

export async function rejectAdminImage(
  imageId: number
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/admin/images/${imageId}/reject`,
    {
      method: "PUT",
    }
  );
}

export async function deleteAdminImage(
  imageId: number
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/admin/images/${imageId}`,
    {
      method: "DELETE",
    }
  );
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

export async function filterMapEnterprises(params: MapSearchParams): Promise<{
  data: EnterpriseMapDto[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.append("keyword", params.keyword);
  if (params.district) searchParams.append("district", params.district);
  if (params.province) searchParams.append("province", params.province);
  if (params.businessField)
    searchParams.append("businessField", params.businessField);
  if (params.ocopRating)
    searchParams.append("ocopRating", String(params.ocopRating));
  if (params.minLat) searchParams.append("minLatitude", String(params.minLat));
  if (params.maxLat) searchParams.append("maxLatitude", String(params.maxLat));
  if (params.minLon) searchParams.append("minLongitude", String(params.minLon));
  if (params.maxLon) searchParams.append("maxLongitude", String(params.maxLon));
  if (params.latitude)
    searchParams.append("userLatitude", String(params.latitude));
  if (params.longitude)
    searchParams.append("userLongitude", String(params.longitude));
  if (params.radiusKm)
    searchParams.append("maxDistance", String(params.radiusKm));
  if (params.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params.page) searchParams.append("page", String(params.page));
  if (params.pageSize) searchParams.append("pageSize", String(params.pageSize));

  return request<{
    data: EnterpriseMapDto[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/map/filter?${searchParams.toString()}`, {
    method: "GET",
  });
}

// ------ SHIPPING ADDRESSES (Enhanced with GPS) ------
export interface ShippingAddressWithGps extends ShippingAddress {
  latitude?: number;
  longitude?: number;
}

export async function getAddressFromGpsForShipping(
  lat: number,
  lng: number
): Promise<GpsAddressLookupDto> {
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

// ------ WALLET ------
export interface Wallet {
  id: number;
  userId: number;
  balance: number;
  currency: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: number;
  walletId: number;
  type: "deposit" | "withdraw" | "payment" | "refund";
  amount: number;
  balanceAfter: number;
  description: string;
  status: "pending" | "success" | "failed";
  createdAt: string;
  orderId?: number;
  paymentGatewayTransactionId?: string;
  paymentGateway?: string;
}

export interface DepositRequest {
  amount: number;
  description?: string;
}

export interface DepositResponse {
  paymentUrl: string;
  transactionId: string;
  amount: number;
  paymentGateway: string;
  description: string;
  reference: string;
}

export interface PayOrderRequest {
  orderId: number;
  description?: string;
}

export interface RefundRequest {
  orderId: number;
  amount: number;
  description?: string;
}

export interface WithdrawRequest {
  amount: number;
  description?: string;
}

export async function getWallet(): Promise<Wallet> {
  return request<Wallet>("/wallet", {
    method: "GET",
  });
}

export async function getWalletTransactions(params?: {
  page?: number;
  pageSize?: number;
}): Promise<WalletTransaction[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  return request<WalletTransaction[]>(
    `/wallet/transactions${query ? "?" + query : ""}`,
    {
      method: "GET",
    }
  );
}

export async function depositToWallet(
  payload: DepositRequest
): Promise<DepositResponse> {
  return request<DepositResponse>("/wallet/deposit", {
    method: "POST",
    json: payload,
  });
}

export async function payOrderWithWallet(
  payload: PayOrderRequest
): Promise<WalletTransaction> {
  return request<WalletTransaction>("/wallet/pay", {
    method: "POST",
    json: payload,
  });
}

export async function refundOrder(
  payload: RefundRequest
): Promise<WalletTransaction> {
  return request<WalletTransaction>("/wallet/refund", {
    method: "POST",
    json: payload,
  });
}

export async function withdrawFromWallet(
  payload: WithdrawRequest
): Promise<WalletTransaction> {
  return request<WalletTransaction>("/wallet/withdraw", {
    method: "POST",
    json: payload,
  });
}

// ------ WALLET REQUEST ------
export interface WalletRequest {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  walletId: number;
  currentBalance: number;
  type: "deposit" | "withdraw";
  amount: number;
  description: string;
  status: "pending" | "approved" | "rejected" | "completed";
  rejectionReason?: string;
  processedBy?: number;
  processedByName?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt?: string;
  bankAccountId?: number;
  bankAccount?: BankAccount;
}

export interface CreateWalletRequestDto {
  type: "deposit" | "withdraw";
  amount: number;
  description?: string;
  bankAccountId?: number; // Required when type = "withdraw"
}

export interface ProcessWalletRequestDto {
  action: "approve" | "reject";
  rejectionReason?: string;
}

export interface WalletRequestResponse {
  message: string;
  request: WalletRequest;
}

export async function createWalletRequest(
  payload: CreateWalletRequestDto
): Promise<WalletRequest> {
  return request<WalletRequest>("/walletrequest", {
    method: "POST",
    json: payload,
  });
}

export async function getWalletRequests(params?: {
  type?: "deposit" | "withdraw";
  status?: "pending" | "approved" | "rejected" | "completed";
  page?: number;
  pageSize?: number;
}): Promise<WalletRequest[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append("type", params.type);
  if (params?.status) searchParams.append("status", params.status);
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  return request<WalletRequest[]>(`/walletrequest${query ? "?" + query : ""}`, {
    method: "GET",
  });
}

export async function getWalletRequest(id: number): Promise<WalletRequest> {
  return request<WalletRequest>(`/walletrequest/${id}`, {
    method: "GET",
  });
}

export async function getPendingWalletRequestsCount(): Promise<{
  count: number;
}> {
  return request<{ count: number }>("/walletrequest/pending/count", {
    method: "GET",
  });
}

export async function processWalletRequest(
  id: number,
  payload: ProcessWalletRequestDto
): Promise<WalletRequestResponse> {
  return request<WalletRequestResponse>(`/walletrequest/${id}/process`, {
    method: "POST",
    json: payload,
  });
}

// ------ BANK ACCOUNT ------
export interface BankAccount {
  id: number;
  userId: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  qrCodeUrl?: string;
}

export interface CreateBankAccountDto {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  isDefault?: boolean;
}

export interface UpdateBankAccountDto {
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  branch?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export async function getBankAccounts(): Promise<BankAccount[]> {
  return request<BankAccount[]>("/bankaccount", {
    method: "GET",
  });
}

export async function getBankAccount(id: number): Promise<BankAccount> {
  return request<BankAccount>(`/bankaccount/${id}`, {
    method: "GET",
  });
}

export async function getDefaultBankAccount(): Promise<BankAccount> {
  return request<BankAccount>("/bankaccount/default", {
    method: "GET",
  });
}

export async function createBankAccount(
  payload: CreateBankAccountDto
): Promise<BankAccount> {
  return request<BankAccount>("/bankaccount", {
    method: "POST",
    json: payload,
  });
}

export async function updateBankAccount(
  id: number,
  payload: UpdateBankAccountDto
): Promise<BankAccount> {
  return request<BankAccount>(`/bankaccount/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export async function deleteBankAccount(id: number): Promise<void> {
  return request<void>(`/bankaccount/${id}`, {
    method: "DELETE",
  });
}

export async function setDefaultBankAccount(id: number): Promise<BankAccount> {
  return request<BankAccount>(`/bankaccount/${id}/set-default`, {
    method: "POST",
  });
}

// ------ SYSTEM ADMIN WALLET MANAGEMENT ------
export interface SystemWalletSummary {
  totalSystemBalance: number;
  systemAdminBalance: number;
  allUsersBalance: number;
  totalUsers: number;
  totalCustomers: number;
  totalEnterpriseAdmins: number;
  breakdown: {
    customersBalance: number;
    enterpriseAdminsBalance: number;
  };
}

export interface UserWalletInfo {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  walletId: number;
  balance: number;
  currency: string;
  walletCreatedAt: string;
  totalTransactions: number;
}

export interface UpdateUserBalanceDto {
  amount: number; // Positive = add, Negative = subtract
  description: string;
}

export interface UpdateUserBalanceResponse {
  message: string;
  transaction: WalletTransaction;
}

export interface EnsureAllWalletsResponse {
  message: string;
  createdWalletsCount: number;
}

export async function getSystemWalletSummary(): Promise<SystemWalletSummary> {
  return request<SystemWalletSummary>("/wallet/system/summary", {
    method: "GET",
  });
}

export async function getAllUserWallets(params?: {
  page?: number;
  pageSize?: number;
}): Promise<UserWalletInfo[]> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.pageSize)
    searchParams.append("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  return request<UserWalletInfo[]>(
    `/wallet/system/users${query ? "?" + query : ""}`,
    {
      method: "GET",
    }
  );
}

export async function getUserWallet(userId: number): Promise<Wallet> {
  return request<Wallet>(`/wallet/user/${userId}`, {
    method: "GET",
  });
}

export async function updateUserBalance(
  userId: number,
  payload: UpdateUserBalanceDto
): Promise<UpdateUserBalanceResponse> {
  return request<UpdateUserBalanceResponse>(`/wallet/user/${userId}/balance`, {
    method: "PUT",
    json: payload,
  });
}

export async function ensureAllUserWallets(): Promise<EnsureAllWalletsResponse> {
  return request<EnsureAllWalletsResponse>(
    "/wallet/system/ensure-all-wallets",
    {
      method: "POST",
    }
  );
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
