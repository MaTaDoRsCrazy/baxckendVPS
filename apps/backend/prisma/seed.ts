import { UserRole, UserStatus } from "@prisma/client";
import { env } from "../src/config/env.js";
import { hashValue } from "../src/lib/hash.js";
import { createPrismaClient } from "../src/lib/prisma.js";

async function main() {
  const prisma = createPrismaClient();
  const passwordHash = await hashValue(env.ADMIN_PASSWORD);

  await prisma.user.upsert({
    where: {
      email: env.ADMIN_EMAIL
    },
    update: {
      username: env.ADMIN_USERNAME,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE
    },
    create: {
      email: env.ADMIN_EMAIL,
      username: env.ADMIN_USERNAME,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.$disconnect();
  console.log("SUPER_ADMIN seed completed");
}

void main();
