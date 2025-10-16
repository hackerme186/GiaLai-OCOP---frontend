const AUTH_KEY = "ocop_auth_token";

export function setAuthToken(tokenOrFlag: string = "1") {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, tokenOrFlag);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAuthToken();
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}


