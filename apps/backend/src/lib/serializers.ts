import { getDisplayName } from "@emessenger/shared";

export const publicUserSelect = {
  id: true,
  phone: true,
  email: true,
  username: true,
  fullName: true,
  about: true,
  avatarUrl: true,
  country: true,
  role: true,
  status: true,
  lastSeenAt: true,
  createdAt: true,
  updatedAt: true
} as const;

export const conversationMemberSelect = {
  id: true,
  userId: true,
  role: true,
  joinedAt: true,
  leftAt: true,
  user: {
    select: publicUserSelect
  }
} as const;

export const messageSelect = {
  id: true,
  clientTempId: true,
  conversationId: true,
  senderId: true,
  type: true,
  body: true,
  attachmentUrl: true,
  attachmentName: true,
  attachmentMimeType: true,
  attachmentSize: true,
  replyToMessageId: true,
  isEdited: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  sender: {
    select: publicUserSelect
  },
  statuses: {
    select: {
      userId: true,
      status: true,
      createdAt: true
    }
  }
} as const;

export const callParticipantSelect = {
  id: true,
  userId: true,
  status: true,
  joinedAt: true,
  leftAt: true,
  user: {
    select: publicUserSelect
  }
} as const;

export const loginEventBaseSelect = {
  id: true,
  eventType: true,
  userId: true,
  emailOrUsername: true,
  ipAddress: true,
  userAgent: true,
  country: true,
  city: true,
  region: true,
  asn: true,
  provider: true,
  success: true,
  failureReason: true,
  createdAt: true
} as const;

export const loginEventSelect = {
  ...loginEventBaseSelect,
  user: {
    select: publicUserSelect
  }
} as const;

export const userSessionSelect = {
  id: true,
  userId: true,
  ipAddress: true,
  userAgent: true,
  country: true,
  city: true,
  lastSeenAt: true,
  createdAt: true,
  expiresAt: true,
  revokedAt: true,
  user: {
    select: publicUserSelect
  }
} as const;

export const ipBlockSelect = {
  id: true,
  ipAddress: true,
  cidr: true,
  reason: true,
  isActive: true,
  blockedByAdminId: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  blockedByAdmin: {
    select: publicUserSelect
  }
} as const;

export function serializeUser<T extends Record<string, any>>(user: T) {
  return {
    ...user,
    displayName: getDisplayName(user)
  };
}

export function serializeConversationMember<T extends Record<string, any>>(member: T) {
  return {
    ...member,
    user: member.user ? serializeUser(member.user) : member.user
  };
}

export function serializeMessage<T extends Record<string, any>>(message: T) {
  const sender = message.sender ? serializeUser(message.sender) : message.sender;
  return {
    ...message,
    sender,
    senderLabel: sender ? getDisplayName(sender) : "Пользователь",
    deliveryState: message.deliveryState ?? "SENT"
  };
}

export function serializeConversation<T extends Record<string, any>>(conversation: T) {
  return {
    ...conversation,
    members: Array.isArray(conversation.members)
      ? conversation.members.map(serializeConversationMember)
      : conversation.members,
    messages: Array.isArray(conversation.messages)
      ? conversation.messages.map(serializeMessage)
      : conversation.messages,
    displayName: getDisplayName({
      name: conversation.title
    })
  };
}

export function serializeCallParticipant<T extends Record<string, any>>(participant: T) {
  return {
    ...participant,
    user: participant.user ? serializeUser(participant.user) : participant.user
  };
}

export function serializeCall<T extends Record<string, any>>(call: T) {
  return {
    ...call,
    createdBy: call.createdBy ? serializeUser(call.createdBy) : call.createdBy,
    conversation: call.conversation ? serializeConversation(call.conversation) : call.conversation,
    participants: Array.isArray(call.participants)
      ? call.participants.map(serializeCallParticipant)
      : call.participants
  };
}

export function serializeLoginEvent<T extends Record<string, any>>(event: T) {
  return {
    ...event,
    user: event.user ? serializeUser(event.user) : event.user
  };
}

export function serializeUserSession<T extends Record<string, any>>(session: T) {
  return {
    ...session,
    user: session.user ? serializeUser(session.user) : session.user
  };
}

export function serializeIpBlock<T extends Record<string, any>>(block: T) {
  return {
    ...block,
    blockedByAdmin: block.blockedByAdmin ? serializeUser(block.blockedByAdmin) : block.blockedByAdmin
  };
}
