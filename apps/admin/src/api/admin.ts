import type { AdminDashboardStats } from "@emessenger/shared";
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
  return apiRequest<{ data: Array<Record<string, unknown>> }>("/admin/users");
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

export async function getAuditLog() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>("/admin/audit-log");
}

export async function getServerStatus() {
  return apiRequest<{ data: Record<string, unknown> }>("/admin/server/status");
}
