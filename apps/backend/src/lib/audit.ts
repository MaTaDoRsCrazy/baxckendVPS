import type { PrismaClient } from "@prisma/client";

interface AuditInput {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
}

export function createAuditLogger(prisma: PrismaClient) {
  return {
    async log(input: AuditInput) {
      await prisma.adminAction.create({
        data: {
          adminId: input.adminId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId ?? null,
          metadata: input.metadata as never,
          ipAddress: input.ipAddress ?? null
        }
      });
    }
  };
}
