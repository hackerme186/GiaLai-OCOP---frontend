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
  
  // Check NextAuth session first
  try {
    const session = await getSession();
    if (session) return true;
  } catch {
    // Ignore session errors
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
  name?: string;
  email?: string;
  avatarUrl?: string;
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
  const roleKey = Object.keys(claims).find(k => k.toLowerCase().includes("/role") || k.toLowerCase() === 'role');
  const raw = (roleKey ? (claims as any)[roleKey] : (claims as any).role) as unknown;
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw[0] || '').toString();
  return String(raw);
}
