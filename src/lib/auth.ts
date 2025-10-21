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
