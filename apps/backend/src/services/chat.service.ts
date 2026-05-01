import type { PrismaClient } from "@prisma/client";
import { ConversationType } from "@prisma/client";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { conversationMemberSelect, messageSelect } from "../lib/serializers.js";

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

      return memberships.map((membership) => membership.conversation);
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
        return prisma.conversation.findUniqueOrThrow({
          where: { id: matched.id },
          include: {
            members: {
              where: { leftAt: null },
              select: conversationMemberSelect
            }
          }
        });
      }

      return prisma.conversation.create({
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
    },

    async createGroup(userId: string, title: string, memberIds: string[]) {
      const uniqueMembers = Array.from(new Set([userId, ...memberIds]));
      if (uniqueMembers.length < 2) {
        throw badRequest("Group chat requires at least two members");
      }

      return prisma.conversation.create({
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

      return {
        ...conversation,
        messages: [...conversation.messages].reverse()
      };
    },

    async getMessages(userId: string, conversationId: string, limit = 50) {
      await assertConversationMember(prisma, conversationId, userId);

      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: messageSelect
      });

      return [...messages].reverse();
    },

    assertConversationMember: (conversationId: string, userId: string) =>
      assertConversationMember(prisma, conversationId, userId)
  };
}
