import type {
  AdminDashboardStats,
  AdminUser,
  IpBlock,
  LoginEvent,
  PaginatedResult,
  UserSession
} from "@emessenger/shared";
import { apiRequest } from "./client";

export async function loginAdmin(identifier: string, password: string) {
  return apiRequest<{
    data: {
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        username: string;
        email: string | null;
        role: string;
      };
    };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password })
  });
}

export async function getDashboard() {
  return apiRequest<{ data: AdminDashboardStats }>("/admin/dashboard");
}

export async function getUsers() {
  return apiRequest<{ data: AdminUser[] }>("/admin/users");
}

export async function blockUser(userId: string) {
  return apiRequest<{ data: Record<string, unknown> }>(`/admin/users/${userId}/block`, {
    method: "PATCH"
  });
}

export async function unblockUser(userId: string) {
  return apiRequest<{ data: Record<string, unknown> }>(`/admin/users/${userId}/unblock`, {
    method: "PATCH"
  });
}

export async function revokeUserSessions(userId: string) {
  return apiRequest<{ data: { sessionIds: string[]; count: number } }>(`/admin/users/${userId}/sessions/revoke`, {
    method: "POST"
  });
}

export async function getChats() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>("/admin/chats");
}

export async function getMessages() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>("/admin/messages");
}

export async function deleteMessage(messageId: string) {
  return apiRequest<{ data: Record<string, unknown> }>(`/admin/messages/${messageId}`, {
    method: "DELETE"
  });
}

export async function getCalls() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>("/admin/calls");
}

export async function getSecurityLoginEvents(params: {
  page?: number;
  limit?: number;
  userId?: string;
  ip?: string;
  success?: boolean;
}) {
  const search = new URLSearchParams();

  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.userId) search.set("userId", params.userId);
  if (params.ip) search.set("ip", params.ip);
  if (typeof params.success === "boolean") search.set("success", String(params.success));

  const query = search.toString();
  return apiRequest<{ data: PaginatedResult<LoginEvent> }>(`/admin/security/login-events${query ? `?${query}` : ""}`);
}

export async function getSecurityIpBlocks() {
  return apiRequest<{ data: IpBlock[] }>("/admin/security/ip-blocks");
}

export async function createSecurityIpBlock(input: {
  ipAddress?: string | null;
  cidr?: string | null;
  reason: string;
  expiresAt?: string | null;
}) {
  return apiRequest<{ data: IpBlock }>("/admin/security/ip-blocks", {
    method: "POST",
    body: JSON.stringify({
      ipAddress: input.ipAddress ?? null,
      cidr: input.cidr ?? null,
      reason: input.reason,
      expiresAt: input.expiresAt ?? null
    })
  });
}

export async function deleteSecurityIpBlock(id: string) {
  return apiRequest<{ data: IpBlock }>(`/admin/security/ip-blocks/${id}`, {
    method: "DELETE"
  });
}

export async function getSecuritySessions(userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return apiRequest<{ data: UserSession[] }>(`/admin/security/sessions${query}`);
}

export async function revokeSecuritySession(id: string) {
  return apiRequest<{ data: UserSession }>(`/admin/security/sessions/${id}/revoke`, {
    method: "POST"
  });
}

export async function getAuditLog() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>("/admin/audit-log");
}

export async function getServerStatus() {
  return apiRequest<{ data: Record<string, unknown> }>("/admin/server/status");
}
