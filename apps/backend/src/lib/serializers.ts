import { Prisma } from "@prisma/client";

export const publicUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  phone: true,
  email: true,
  username: true,
  avatarUrl: true,
  role: true,
  status: true,
  lastSeenAt: true,
  createdAt: true,
  updatedAt: true
});

export const conversationMemberSelect = Prisma.validator<Prisma.ConversationMemberSelect>()({
  id: true,
  userId: true,
  role: true,
  joinedAt: true,
  leftAt: true,
  user: {
    select: publicUserSelect
  }
});

export const messageSelect = Prisma.validator<Prisma.MessageSelect>()({
  id: true,
  conversationId: true,
  senderId: true,
  type: true,
  body: true,
  attachmentUrl: true,
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
});

export const callParticipantSelect = Prisma.validator<Prisma.CallParticipantSelect>()({
  id: true,
  userId: true,
  status: true,
  joinedAt: true,
  leftAt: true,
  user: {
    select: publicUserSelect
  }
});
