import type { UserRole } from "@prisma/client";

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  sessionId: string;
  type: "access";
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  type: "refresh";
}

export interface RequestAuth {
  userId: string;
  role: UserRole;
  sessionId: string;
}
