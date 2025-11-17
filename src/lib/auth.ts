import { getSession } from "next-auth/react"

const AUTH_KEY = "ocop_auth_token";
const PROFILE_KEY = "ocop_user_profile";

export function setAuthToken(tokenOrFlag: string = "1") {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, tokenOrFlag);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_KEY);
}

export async function isLoggedIn(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  // Check NextAuth session first (but don't fail if NextAuth is not available)
  try {
    const session = await getSession();
    if (session) return true;
  } catch (err) {
    // Ignore NextAuth errors (e.g., if API route is not available)
    // This allows the app to work with custom auth even if NextAuth fails
    console.debug("NextAuth session check failed (using fallback):", err);
  }
  
  // Fallback to local storage token
  return !!getAuthToken();
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export type UserProfile = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  enterpriseId?: number | null;
  avatarUrl?: string;
  createdAt?: string;
}

export function setUserProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile || {}));
  } catch {
    // ignore serialization errors
  }
}

export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

// Decode JWT (Base64Url) to extract claims safely on client
export function getClaimsFromJwt(token?: string | null): Record<string, unknown> | null {
  try {
    const t = token || getAuthToken();
    if (!t) return null;
    const parts = t.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof window !== 'undefined' ? decodeURIComponent(atob(base64).split('').map(c=>{
      const code = c.charCodeAt(0).toString(16).padStart(2,'0');
      return `%${code}`;
    }).join('')) : Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getRoleFromToken(token?: string | null): string | null {
  const claims = getClaimsFromJwt(token);
  if (!claims) return null;
  
  // Try multiple possible role key names
  const possibleKeys = [
    'role',
    'roles',
    'userRole',
    'user_role',
    'authority',
    'authorities',
    'permission',
    'permissions',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'
  ];
  
  // First try exact matches
  for (const key of possibleKeys) {
    const value = (claims as any)[key];
    if (value) {
      if (Array.isArray(value)) {
        const firstRole = value[0];
        if (firstRole) return String(firstRole);
      } else if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
      }
    }
  }
  
  // Then try case-insensitive partial matches
  const roleKey = Object.keys(claims).find(k => {
    const lower = k.toLowerCase();
    return lower.includes('role') || lower.includes('authority') || lower.includes('permission');
  });
  
  if (roleKey) {
    const raw = (claims as any)[roleKey];
    if (raw) {
      if (Array.isArray(raw)) return (raw[0] || '').toString();
      return String(raw);
    }
  }
  
  return null;
}
