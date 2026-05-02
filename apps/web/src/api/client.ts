import type { ApiEnvelope, ApiError, AuthResponse } from "@emessenger/shared";
import { loadAuth, saveAuth, type StoredAuth } from "../lib/storage";
import { translateWebError } from "../lib/ui";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
let authCache: StoredAuth | null = loadAuth();

type JsonBody = Record<string, unknown> | Array<unknown>;
type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | JsonBody | null;
};

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

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const { body, ...restInit } = init;
  const nextInit: RequestInit = {
    ...restInit
  };

  if (body === undefined || body === null) {
    headers.delete("Content-Type");
  } else if (body instanceof FormData) {
    headers.delete("Content-Type");
    nextInit.body = body;
  } else if (typeof body === "string") {
    headers.set("Content-Type", "application/json");
    nextInit.body = body;
  } else {
    headers.set("Content-Type", "application/json");
    nextInit.body = JSON.stringify(body);
  }

  if (authCache?.accessToken) {
    headers.set("Authorization", `Bearer ${authCache.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...nextInit,
      headers
    });
  } catch {
    throw new Error(translateWebError("Network error"));
  }

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
