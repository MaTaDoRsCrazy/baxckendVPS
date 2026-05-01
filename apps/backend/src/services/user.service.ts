import type { PrismaClient } from "@prisma/client";
import { publicUserSelect } from "../lib/serializers.js";

interface UpdateMeInput {
  email?: string | null;
  phone?: string | null;
  username?: string;
  avatarUrl?: string | null;
}

export function createUserService(prisma: PrismaClient) {
  return {
    async getMe(userId: string) {
      return prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: publicUserSelect
      });
    },

    async updateMe(userId: string, input: UpdateMeInput) {
      return prisma.user.update({
        where: { id: userId },
        data: {
          email: input.email,
          phone: input.phone,
          username: input.username,
          avatarUrl: input.avatarUrl
        },
        select: publicUserSelect
      });
    },

    async searchUsers(query: string, currentUserId: string) {
      return prisma.user.findMany({
        where: {
          id: { not: currentUserId },
          status: "ACTIVE",
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } }
          ]
        },
        orderBy: { username: "asc" },
        take: 20,
        select: publicUserSelect
      });
    }
  };
}
