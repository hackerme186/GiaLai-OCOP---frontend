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
    const bodyMessage = (isJson && data && typeof data === "object" && (data as any).message) || "";
    const message = `${response.status} ${response.statusText} ${bodyMessage ? "- " + bodyMessage : ""} @ ${url}`.trim();
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

export const api = {
  request,
  login,
  register,
};


