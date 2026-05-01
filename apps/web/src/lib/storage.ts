import type { AuthResponse, Call, User } from "@emessenger/shared";

const AUTH_KEY = "emessenger_web_auth";

export interface StoredAuth extends AuthResponse {}

export interface IncomingCallState {
  call: Call;
  conversationTitle: string;
  caller?: User;
}

export function loadAuth(): StoredAuth | null {
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth | null) {
  if (!auth) {
    window.localStorage.removeItem(AUTH_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}
