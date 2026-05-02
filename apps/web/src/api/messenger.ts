import type { ApiEnvelope, AuthResponse, Call, Conversation, Message, UploadResult, User } from "@emessenger/shared";
import { apiRequest } from "./client";

export function login(identifier: string, password: string) {
  return apiRequest<ApiEnvelope<AuthResponse>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password })
  });
}

export function register(input: {
  username: string;
  email?: string;
  phone?: string;
  password: string;
  country?: string;
}) {
  return apiRequest<ApiEnvelope<AuthResponse>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getMe() {
  return apiRequest<ApiEnvelope<User>>("/auth/me");
}

export function logout(refreshToken: string) {
  return apiRequest<ApiEnvelope<{ success: boolean }>>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export function getChats() {
  return apiRequest<ApiEnvelope<Conversation[]>>("/chats");
}

export function getChat(chatId: string) {
  return apiRequest<ApiEnvelope<Conversation>>(`/chats/${chatId}`);
}

export function getChatMessages(chatId: string) {
  return apiRequest<ApiEnvelope<Message[]>>(`/chats/${chatId}/messages`);
}

export function searchUsers(q: string) {
  return apiRequest<ApiEnvelope<User[]>>(`/users/search?q=${encodeURIComponent(q)}`);
}

export function updateProfile(
  input: Partial<Pick<User, "fullName" | "username" | "avatarUrl" | "email" | "phone" | "about" | "country">>
) {
  return apiRequest<ApiEnvelope<User>>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<ApiEnvelope<UploadResult>>("/uploads", {
    method: "POST",
    body: formData
  });
}

export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<ApiEnvelope<User>>("/users/me/avatar", {
    method: "POST",
    body: formData
  });
}

export function createPrivateChat(participantId: string) {
  return apiRequest<ApiEnvelope<Conversation>>("/chats/private", {
    method: "POST",
    body: JSON.stringify({ participantId })
  });
}

export function createGroupChat(title: string, memberIds: string[]) {
  return apiRequest<ApiEnvelope<Conversation>>("/chats/group", {
    method: "POST",
    body: JSON.stringify({ title, memberIds })
  });
}

export function createMessage(input: {
  conversationId: string;
  type?: string;
  body?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
  replyToMessageId?: string | null;
}) {
  return apiRequest<ApiEnvelope<Message>>("/messages", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function markMessageRead(messageId: string) {
  return apiRequest<ApiEnvelope<Message>>(`/messages/${messageId}/read`, {
    method: "POST"
  });
}

export function startCall(input: { conversationId: string; type: "AUDIO" | "VIDEO" }) {
  return apiRequest<ApiEnvelope<Call>>("/calls/start", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function acceptCall(callId: string) {
  return apiRequest<ApiEnvelope<Call>>(`/calls/${callId}/accept`, {
    method: "POST"
  });
}

export function rejectCall(callId: string) {
  return apiRequest<ApiEnvelope<Call>>(`/calls/${callId}/reject`, {
    method: "POST"
  });
}

export function endCall(callId: string) {
  return apiRequest<ApiEnvelope<Call>>(`/calls/${callId}/end`, {
    method: "POST"
  });
}

export function getCallHistory() {
  return apiRequest<ApiEnvelope<Call[]>>("/calls/history");
}

export function getCallToken(callId: string) {
  return apiRequest<{ url: string; token: string; roomName: string }>(`/calls/${callId}/token`, {
    method: "POST"
  });
}
