import { loadAuth, saveAuth, type StoredAuth } from "../lib/storage";
import { translateAdminError } from "../lib/ui";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

let authCache: StoredAuth | null = loadAuth();

export function setApiAuth(auth: StoredAuth | null) {
  authCache = auth;
  saveAuth(auth);
}

async function refreshTokens() {
  if (!authCache?.refreshToken) {
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      refreshToken: authCache.refreshToken
    })
  });

  if (!response.ok) {
    setApiAuth(null);
    return null;
  }

  const json = await response.json();
  const nextAuth: StoredAuth = {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken,
    user: {
      id: json.data.user.id,
      username: json.data.user.username,
      email: json.data.user.email,
      role: json.data.user.role
    }
  };

  setApiAuth(nextAuth);
  return nextAuth;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (authCache?.accessToken) {
    headers.set("Authorization", `Bearer ${authCache.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers
  });

  if (response.status === 401 && retry && authCache?.refreshToken) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return apiRequest<T>(path, init, false);
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(translateAdminError(payload?.error?.message ?? "Request failed"));
  }

  return response.json() as Promise<T>;
}
