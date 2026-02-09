import type { User } from "@/src/mock/types";

export function setAuthCookie(token: string) {
  // Set cookie for middleware
  document.cookie = `offerpulse_auth=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
}

export function removeAuthCookie() {
  document.cookie = "offerpulse_auth=; path=/; max-age=0";
}

export function getStoredUser(): User | null {
  try {
    const userStr = localStorage.getItem("offerpulse_user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("offerpulse_auth_token");
}
