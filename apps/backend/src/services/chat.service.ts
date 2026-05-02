import type { PrismaClient } from "@prisma/client";
import { ConversationType } from "@prisma/client";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { conversationMemberSelect, messageSelect, serializeConversation, serializeMessage } from "../lib/serializers.js";

function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string) {
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  const [createdAtRaw, id] = decoded.split("|");
  if (!createdAtRaw || !id) {
    throw badRequest("Invalid cursor");
  }

  const createdAt = new Date(createdAtRaw);
  if (Number.isNaN(createdAt.getTime())) {
    throw badRequest("Invalid cursor");
  }

  return { createdAt, id };
}

async function assertConversationMember(prisma: PrismaClient, conversationId: string, userId: string) {
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

export function createChatService(prisma: PrismaClient) {
  return {
    async listForUser(userId: string) {
      const memberships = await prisma.conversationMember.findMany({
        where: {
          userId,
          leftAt: null
        },
        include: {
          conversation: {
            include: {
              members: {
                where: { leftAt: null },
                select: conversationMemberSelect
              },
              messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: messageSelect
              }
            }
          }
        },
        orderBy: {
          conversation: {
            updatedAt: "desc"
          }
        }
      });

      return memberships.map((membership) => serializeConversation(membership.conversation));
    },

    async createPrivate(userId: string, participantId: string) {
      if (userId === participantId) {
        throw badRequest("Cannot create a private chat with yourself");
      }

      const existing = await prisma.conversation.findMany({
        where: {
          type: ConversationType.PRIVATE,
          members: {
            some: { userId, leftAt: null }
          }
        },
        include: {
          members: true
        }
      });

      const matched = existing.find((conversation) => {
        const activeMembers = conversation.members.filter((member) => !member.leftAt).map((member) => member.userId);
        return activeMembers.length === 2 && activeMembers.includes(userId) && activeMembers.includes(participantId);
      });

      if (matched) {
        const conversation = await prisma.conversation.findUniqueOrThrow({
          where: { id: matched.id },
          include: {
            members: {
              where: { leftAt: null },
              select: conversationMemberSelect
            }
          }
        });

        return serializeConversation(conversation);
      }

      const conversation = await prisma.conversation.create({
        data: {
          type: ConversationType.PRIVATE,
          createdById: userId,
          members: {
            createMany: {
              data: [
                { userId, role: "OWNER" },
                { userId: participantId, role: "MEMBER" }
              ]
            }
          }
        },
        include: {
          members: {
            where: { leftAt: null },
            select: conversationMemberSelect
          }
        }
      });

      return serializeConversation(conversation);
    },

    async createGroup(userId: string, title: string, memberIds: string[]) {
      const uniqueMembers = Array.from(new Set([userId, ...memberIds]));
      if (uniqueMembers.length < 2) {
        throw badRequest("Group chat requires at least two members");
      }

      const conversation = await prisma.conversation.create({
        data: {
          type: ConversationType.GROUP,
          title,
          createdById: userId,
          members: {
            createMany: {
              data: uniqueMembers.map((memberId) => ({
                userId: memberId,
                role: memberId === userId ? "OWNER" : "MEMBER"
              }))
            }
          }
        },
        include: {
          members: {
            where: { leftAt: null },
            select: conversationMemberSelect
          }
        }
      });

      return serializeConversation(conversation);
    },

    async getConversation(userId: string, conversationId: string) {
      await assertConversationMember(prisma, conversationId, userId);

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          members: {
            where: { leftAt: null },
            select: conversationMemberSelect
          },
          messages: {
            take: 20,
            orderBy: { createdAt: "desc" },
            select: messageSelect
          }
        }
      });

      if (!conversation) {
        throw notFound("Conversation not found");
      }

      return serializeConversation({
        ...conversation,
        messages: [...conversation.messages].reverse()
      });
    },

    async getMessages(
      userId: string,
      conversationId: string,
      options: { limit?: number; cursor?: string | null; since?: string | null } = {}
    ) {
      await assertConversationMember(prisma, conversationId, userId);

      const take = Math.min(Math.max(options.limit ?? 50, 1), 100);
      const cursor = options.cursor ? decodeCursor(options.cursor) : null;
      const sinceDate = options.since ? new Date(options.since) : null;
      const validSince = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null;

      const messages = await prisma.message.findMany({
        where: {
          conversationId,
          ...(validSince ? { createdAt: { gt: validSince } } : {}),
          ...(cursor
            ? {
                OR: [
                  { createdAt: { lt: cursor.createdAt } },
                  { createdAt: cursor.createdAt, id: { lt: cursor.id } }
                ]
              }
            : {})
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" }
        ],
        take: take + 1,
        select: messageSelect
      });

      const hasMore = messages.length > take;
      const pageItems = hasMore ? messages.slice(0, take) : messages;
      const lastPageItem = pageItems[pageItems.length - 1];
      const nextCursor = hasMore && lastPageItem
        ? encodeCursor(lastPageItem.createdAt as Date, lastPageItem.id)
        : null;

      return {
        items: [...pageItems].reverse().map(serializeMessage),
        nextCursor,
        hasMore
      };
    },

    assertConversationMember: (conversationId: string, userId: string) =>
      assertConversationMember(prisma, conversationId, userId)
  };
}
