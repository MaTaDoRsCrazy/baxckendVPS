import type { ApiEnvelope, ApiError, AuthResponse } from "@emessenger/shared";
import { loadAuth, saveAuth, type StoredAuth } from "../lib/storage";
import { translateWebError } from "../lib/ui";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
let authCache: StoredAuth | null = loadAuth();

export function setApiAuth(auth: StoredAuth | null) {
  authCache = auth;
  saveAuth(auth);
}

async function refreshAccessToken() {
  if (!authCache?.refreshToken) {
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refreshToken: authCache.refreshToken })
  });

  if (!response.ok) {
    setApiAuth(null);
    return null;
  }

  const json = (await response.json()) as ApiEnvelope<AuthResponse>;
  const auth = json.data;
  setApiAuth(auth);
  return auth;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (authCache?.accessToken) {
    headers.set("Authorization", `Bearer ${authCache.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers
  });

  if (response.status === 401 && retry && authCache?.refreshToken) {
    const nextAuth = await refreshAccessToken();
    if (nextAuth) {
      return apiRequest<T>(path, init, false);
    }
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(translateWebError(payload?.error.message ?? "Request failed"));
  }

  return response.json() as Promise<T>;
}
