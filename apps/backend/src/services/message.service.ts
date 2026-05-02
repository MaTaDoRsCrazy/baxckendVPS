import type { PrismaClient } from "@prisma/client";
import { MessageDeliveryStatus } from "@prisma/client";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { messageSelect, serializeMessage } from "../lib/serializers.js";

interface CreateMessageInput {
  conversationId: string;
  clientTempId?: string | null;
  type: "TEXT" | "IMAGE" | "FILE" | "VOICE" | "SYSTEM";
  body?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
  replyToMessageId?: string | null;
}

interface UpdateMessageInput {
  body?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
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
          clientTempId: input.clientTempId ?? null,
          senderId: userId,
          type: input.type,
          body: input.body ?? null,
          attachmentUrl: input.attachmentUrl ?? null,
          attachmentName: input.attachmentName ?? null,
          attachmentMimeType: input.attachmentMimeType ?? null,
          attachmentSize: input.attachmentSize ?? null,
          replyToMessageId: input.replyToMessageId ?? null,
          statuses: {
            createMany: {
              data: members.map((member) => ({
                userId: member.userId,
                status: member.userId === userId ? MessageDeliveryStatus.READ : MessageDeliveryStatus.SENT
              }))
            }
          }
        } as any,
        select: messageSelect as any
      });

      void prisma.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() }
      }).catch((error) => {
        console.error("message:create:conversation_touch_error", {
          conversationId: input.conversationId,
          messageId: message.id,
          error: error instanceof Error ? error.message : String(error)
        });
      });

      return serializeMessage(message);
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
          attachmentName: input.attachmentName ?? (current as any).attachmentName,
          attachmentMimeType: input.attachmentMimeType ?? (current as any).attachmentMimeType,
          attachmentSize: input.attachmentSize ?? (current as any).attachmentSize,
          isEdited: true
        } as any,
        select: messageSelect as any
      });

      await prisma.conversation.update({
        where: { id: current.conversationId },
        data: { updatedAt: new Date() }
      });

      return serializeMessage(message);
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
          attachmentName: null,
          attachmentMimeType: null,
          attachmentSize: null,
          isDeleted: true
        } as any,
        select: messageSelect as any
      });

      return serializeMessage(message);
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
          attachmentName: null,
          attachmentMimeType: null,
          attachmentSize: null,
          isDeleted: true
        } as any,
        select: messageSelect as any
      }).then(serializeMessage);
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

      const updatedMessage = await prisma.message.findUniqueOrThrow({
        where: { id: messageId },
        select: messageSelect as any
      });

      return serializeMessage(updatedMessage);
    }
  };
}
