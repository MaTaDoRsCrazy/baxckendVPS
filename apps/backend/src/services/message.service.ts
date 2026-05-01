import type { PrismaClient } from "@prisma/client";
import { MessageDeliveryStatus } from "@prisma/client";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { messageSelect } from "../lib/serializers.js";

interface CreateMessageInput {
  conversationId: string;
  type: "TEXT" | "IMAGE" | "FILE" | "VOICE" | "SYSTEM";
  body?: string | null;
  attachmentUrl?: string | null;
  replyToMessageId?: string | null;
}

interface UpdateMessageInput {
  body?: string | null;
  attachmentUrl?: string | null;
}

async function assertActiveMembership(prisma: PrismaClient, conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId
      }
    }
  });

  if (!membership || membership.leftAt) {
    throw forbidden("User is not a conversation member");
  }
}

export function createMessageService(prisma: PrismaClient) {
  return {
    async createMessage(userId: string, input: CreateMessageInput) {
      await assertActiveMembership(prisma, input.conversationId, userId);

      if (!input.body && !input.attachmentUrl) {
        throw badRequest("Message body or attachment is required");
      }

      const members = await prisma.conversationMember.findMany({
        where: {
          conversationId: input.conversationId,
          leftAt: null
        },
        select: { userId: true }
      });

      const message = await prisma.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: userId,
          type: input.type,
          body: input.body ?? null,
          attachmentUrl: input.attachmentUrl ?? null,
          replyToMessageId: input.replyToMessageId ?? null,
          statuses: {
            createMany: {
              data: members.map((member) => ({
                userId: member.userId,
                status: member.userId === userId ? MessageDeliveryStatus.READ : MessageDeliveryStatus.SENT
              }))
            }
          }
        },
        select: messageSelect
      });

      await prisma.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() }
      });

      return message;
    },

    async updateMessage(userId: string, messageId: string, input: UpdateMessageInput) {
      const current = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!current) {
        throw notFound("Message not found");
      }

      if (current.senderId !== userId) {
        throw forbidden("Only sender can edit the message");
      }

      const message = await prisma.message.update({
        where: { id: messageId },
        data: {
          body: input.body ?? current.body,
          attachmentUrl: input.attachmentUrl ?? current.attachmentUrl,
          isEdited: true
        },
        select: messageSelect
      });

      await prisma.conversation.update({
        where: { id: current.conversationId },
        data: { updatedAt: new Date() }
      });

      return message;
    },

    async deleteMessage(userId: string, messageId: string) {
      const current = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!current) {
        throw notFound("Message not found");
      }

      if (current.senderId !== userId) {
        throw forbidden("Only sender can delete the message");
      }

      const message = await prisma.message.update({
        where: { id: messageId },
        data: {
          body: null,
          attachmentUrl: null,
          isDeleted: true
        },
        select: messageSelect
      });

      return message;
    },

    async adminDeleteMessage(messageId: string) {
      const current = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!current) {
        throw notFound("Message not found");
      }

      return prisma.message.update({
        where: { id: messageId },
        data: {
          body: null,
          attachmentUrl: null,
          isDeleted: true
        },
        select: messageSelect
      });
    },

    async markRead(userId: string, messageId: string) {
      const message = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!message) {
        throw notFound("Message not found");
      }

      await assertActiveMembership(prisma, message.conversationId, userId);

      await prisma.messageStatus.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId
          }
        },
        create: {
          messageId,
          userId,
          status: MessageDeliveryStatus.READ
        },
        update: {
          status: MessageDeliveryStatus.READ,
          createdAt: new Date()
        }
      });

      return prisma.message.findUniqueOrThrow({
        where: { id: messageId },
        select: messageSelect
      });
    }
  };
}
