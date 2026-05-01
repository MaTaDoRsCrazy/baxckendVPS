import type { PrismaClient, UserStatus } from "@prisma/client";
import { publicUserSelect } from "../lib/serializers.js";

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
      return prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: publicUserSelect
      });
    },

    async setUserStatus(userId: string, status: UserStatus) {
      return prisma.user.update({
        where: { id: userId },
        data: { status },
        select: publicUserSelect
      });
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
      return prisma.message.findMany({
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
    },

    async getCalls() {
      return prisma.call.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          conversation: {
            select: {
              id: true,
              title: true,
              type: true
            }
          },
          participants: {
            select: {
              id: true,
              status: true,
              joinedAt: true,
              leftAt: true,
              user: {
                select: publicUserSelect
              }
            }
          }
        }
      });
    },

    async getAuditLog() {
      return prisma.adminAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          admin: {
            select: publicUserSelect
          }
        }
      });
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
