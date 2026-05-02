import type { PrismaClient, UserStatus } from "@prisma/client";
import { callParticipantSelect, publicUserSelect, serializeCall, serializeMessage, serializeUser } from "../lib/serializers.js";

export function createAdminService(prisma: PrismaClient) {
  return {
    async getDashboard() {
      const [usersTotal, usersBlocked, chatsTotal, messagesTotal, callsTotal, activeCalls] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "BLOCKED" } }),
        prisma.conversation.count(),
        prisma.message.count(),
        prisma.call.count(),
        prisma.call.count({ where: { status: { in: ["RINGING", "ACCEPTED"] } } })
      ]);

      return {
        usersTotal,
        usersBlocked,
        chatsTotal,
        messagesTotal,
        callsTotal,
        activeCalls
      };
    },

    async getUsers() {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: publicUserSelect
      });

      return users.map(serializeUser);
    },

    async setUserStatus(userId: string, status: UserStatus) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { status },
        select: publicUserSelect
      });

      return serializeUser(user);
    },

    async getChats() {
      return prisma.conversation.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          members: {
            where: { leftAt: null },
            select: {
              id: true,
              role: true,
              user: {
                select: publicUserSelect
              }
            }
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              body: true,
              type: true,
              createdAt: true
            }
          }
        }
      });
    },

    async getMessages() {
      const messages = await prisma.message.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          sender: {
            select: publicUserSelect
          },
          conversation: {
            select: {
              id: true,
              type: true,
              title: true
            }
          }
        }
      });

      return messages.map(serializeMessage);
    },

    async getCalls() {
      const calls = await prisma.call.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          conversation: {
            select: {
              id: true,
              title: true,
              type: true
            }
          },
          createdBy: {
            select: publicUserSelect
          },
          participants: {
            select: callParticipantSelect
          }
        }
      });

      return calls.map(serializeCall);
    },

    async getAuditLog() {
      const actions = await prisma.adminAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          admin: {
            select: publicUserSelect
          }
        }
      });

      return actions.map((action) => ({
        ...action,
        admin: serializeUser(action.admin)
      }));
    },

    async getServerStatus() {
      const startedAt = new Date(Date.now() - process.uptime() * 1000).toISOString();
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: "ok",
        environment: process.env.NODE_ENV ?? "development",
        uptimeSeconds: Math.round(process.uptime()),
        startedAt,
        memoryUsage: process.memoryUsage(),
        database: "up",
        timestamp: new Date().toISOString()
      };
    }
  };
}
