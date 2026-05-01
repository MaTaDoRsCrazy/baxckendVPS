export const USER_ROLES = ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"] as const;
export const USER_STATUSES = ["ACTIVE", "BLOCKED", "DELETED"] as const;
export const CONVERSATION_TYPES = ["PRIVATE", "GROUP"] as const;
export const CONVERSATION_MEMBER_ROLES = ["MEMBER", "ADMIN", "OWNER"] as const;
export const MESSAGE_TYPES = ["TEXT", "IMAGE", "FILE", "VOICE", "SYSTEM"] as const;
export const MESSAGE_DELIVERY_STATUSES = ["SENT", "DELIVERED", "READ"] as const;
export const CALL_TYPES = ["AUDIO", "VIDEO"] as const;
export const CALL_STATUSES = ["RINGING", "ACCEPTED", "REJECTED", "MISSED", "ENDED"] as const;
export const CALL_PARTICIPANT_STATUSES = ["INVITED", "JOINED", "LEFT", "REJECTED", "MISSED"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type ConversationType = (typeof CONVERSATION_TYPES)[number];
export type ConversationMemberRole = (typeof CONVERSATION_MEMBER_ROLES)[number];
export type MessageType = (typeof MESSAGE_TYPES)[number];
export type MessageDeliveryStatus = (typeof MESSAGE_DELIVERY_STATUSES)[number];
export type CallType = (typeof CALL_TYPES)[number];
export type CallStatus = (typeof CALL_STATUSES)[number];
export type CallParticipantStatus = (typeof CALL_PARTICIPANT_STATUSES)[number];

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiEnvelope<T> {
  data: T;
}

export interface AdminDashboardStats {
  usersTotal: number;
  usersBlocked: number;
  chatsTotal: number;
  messagesTotal: number;
  callsTotal: number;
  activeCalls: number;
}

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  username: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  lastSeenAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ConversationMember {
  id: string;
  userId: string;
  role: ConversationMemberRole;
  joinedAt: string | Date;
  leftAt: string | Date | null;
  user: User;
}

export interface MessageStatus {
  userId: string;
  status: MessageDeliveryStatus;
  createdAt: string | Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  body: string | null;
  attachmentUrl: string | null;
  replyToMessageId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  sender?: User;
  statuses?: MessageStatus[];
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  avatarUrl: string | null;
  createdById: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  members?: ConversationMember[];
  messages?: Message[];
}

export interface CallParticipant {
  id: string;
  userId: string;
  status: CallParticipantStatus;
  joinedAt: string | Date | null;
  leftAt: string | Date | null;
  user?: User;
}

export interface Call {
  id: string;
  conversationId: string;
  createdById: string;
  type: CallType;
  status: CallStatus;
  livekitRoomName: string;
  startedAt: string | Date | null;
  endedAt: string | Date | null;
  createdAt: string | Date;
  conversation?: Conversation;
  participants?: CallParticipant[];
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SocketClientEvents {
  "message:send": {
    conversationId: string;
    type?: MessageType;
    body?: string | null;
    attachmentUrl?: string | null;
    replyToMessageId?: string | null;
  };
  "message:read": {
    messageId: string;
  };
  "typing:start": {
    conversationId: string;
  };
  "typing:stop": {
    conversationId: string;
  };
  "call:start": {
    conversationId: string;
    type: CallType;
  };
  "call:accept": {
    callId: string;
  };
  "call:reject": {
    callId: string;
  };
  "call:end": {
    callId: string;
  };
}

export interface SocketServerEvents {
  "message:new": Message;
  "message:updated": Message;
  "message:deleted": Message;
  "message:read": {
    messageId: string;
    conversationId: string;
    userId: string;
  };
  "typing:start": {
    conversationId: string;
    userId: string;
  };
  "typing:stop": {
    conversationId: string;
    userId: string;
  };
  "user:online": {
    userId: string;
  };
  "user:offline": {
    userId: string;
  };
  "call:incoming": Call;
  "call:accepted": Call;
  "call:rejected": Call;
  "call:ended": Call;
}

export interface SocketEvents {
  client: SocketClientEvents;
  server: SocketServerEvents;
}
