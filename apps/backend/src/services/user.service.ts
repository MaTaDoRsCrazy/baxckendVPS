import type { PrismaClient } from "@prisma/client";
import { conflict } from "../lib/errors.js";
import { publicUserSelect, serializeUser } from "../lib/serializers.js";

interface UpdateMeInput {
  email?: string | null;
  phone?: string | null;
  username?: string;
  fullName?: string | null;
  about?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
}

export function createUserService(prisma: PrismaClient) {
  return {
    async getMe(userId: string) {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: publicUserSelect as any
      });

      return serializeUser(user);
    },

    async updateMe(userId: string, input: UpdateMeInput) {
      if (input.username || input.email) {
        const existing = await prisma.user.findFirst({
          where: {
            id: { not: userId },
            OR: [
              ...(input.username ? [{ username: input.username }] : []),
              ...(input.email ? [{ email: input.email }] : [])
            ]
          },
          select: { id: true }
        });

        if (existing) {
          throw conflict("User with provided username or email already exists");
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          email: input.email,
          phone: input.phone,
          username: input.username,
          fullName: input.fullName,
          about: input.about,
          country: input.country,
          avatarUrl: input.avatarUrl
        } as any,
        select: publicUserSelect as any
      });

      return serializeUser(user);
    },

    async updateAvatar(userId: string, avatarUrl: string) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl
        },
        select: publicUserSelect as any
      });

      return serializeUser(user);
    },

    async searchUsers(query: string, currentUserId: string) {
      const users = await prisma.user.findMany({
        where: {
          id: { not: currentUserId },
          status: "ACTIVE",
          OR: [
            { fullName: { contains: query, mode: "insensitive" } } as any,
            { username: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } }
          ]
        },
        orderBy: { username: "asc" },
        take: 20,
        select: publicUserSelect as any
      });

      return users.map(serializeUser);
    }
  };
}
