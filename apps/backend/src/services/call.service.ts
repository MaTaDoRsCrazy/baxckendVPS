import type { PrismaClient } from "@prisma/client";
import { CallParticipantStatus, CallStatus } from "@prisma/client";
import type { AppEnv } from "../config/env.js";
import { forbidden, notFound } from "../lib/errors.js";
import { createLiveKitAccess } from "../lib/livekit.js";
import { callParticipantSelect } from "../lib/serializers.js";

interface StartCallInput {
  conversationId: string;
  type: "AUDIO" | "VIDEO";
}

function buildRoomName(conversationId: string, callId: string) {
  return `conv_${conversationId}_${callId}`;
}

async function assertCallParticipant(prisma: PrismaClient, callId: string, userId: string) {
  const participant = await prisma.callParticipant.findUnique({
    where: {
      callId_userId: {
        callId,
        userId
      }
    }
  });

  if (!participant) {
    throw forbidden("User is not a call participant");
  }

  return participant;
}

export function createCallService(prisma: PrismaClient, env: AppEnv) {
  return {
    async startCall(userId: string, input: StartCallInput) {
      const membership = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId
          }
        }
      });

      if (!membership || membership.leftAt) {
        throw forbidden("User is not a conversation member");
      }

      const members = await prisma.conversationMember.findMany({
        where: {
          conversationId: input.conversationId,
          leftAt: null
        },
        select: { userId: true }
      });

      const call = await prisma.call.create({
        data: {
          conversationId: input.conversationId,
          createdById: userId,
          type: input.type,
          status: CallStatus.RINGING,
          livekitRoomName: "pending"
        }
      });

      const roomName = buildRoomName(input.conversationId, call.id);

      await prisma.call.update({
        where: { id: call.id },
        data: {
          livekitRoomName: roomName,
          participants: {
            createMany: {
              data: members.map((member) => ({
                userId: member.userId,
                status: member.userId === userId ? CallParticipantStatus.JOINED : CallParticipantStatus.INVITED,
                joinedAt: member.userId === userId ? new Date() : null
              }))
            }
          }
        }
      });

      await prisma.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() }
      });

      return prisma.call.findUniqueOrThrow({
        where: { id: call.id },
        include: {
          participants: {
            select: callParticipantSelect
          },
          conversation: true
        }
      });
    },

    async acceptCall(userId: string, callId: string) {
      await assertCallParticipant(prisma, callId, userId);

      await prisma.callParticipant.update({
        where: {
          callId_userId: {
            callId,
            userId
          }
        },
        data: {
          status: CallParticipantStatus.JOINED,
          joinedAt: new Date()
        }
      });

      await prisma.call.update({
        where: { id: callId },
        data: {
          status: CallStatus.ACCEPTED,
          startedAt: new Date()
        }
      });

      return prisma.call.findUniqueOrThrow({
        where: { id: callId },
        include: {
          participants: {
            select: callParticipantSelect
          },
          conversation: true
        }
      });
    },

    async rejectCall(userId: string, callId: string) {
      await assertCallParticipant(prisma, callId, userId);

      await prisma.callParticipant.update({
        where: {
          callId_userId: {
            callId,
            userId
          }
        },
        data: {
          status: CallParticipantStatus.REJECTED,
          leftAt: new Date()
        }
      });

      const acceptedParticipants = await prisma.callParticipant.count({
        where: {
          callId,
          status: CallParticipantStatus.JOINED
        }
      });

      if (acceptedParticipants === 0) {
        await prisma.call.update({
          where: { id: callId },
          data: { status: CallStatus.REJECTED }
        });
      }

      return prisma.call.findUniqueOrThrow({
        where: { id: callId },
        include: {
          participants: {
            select: callParticipantSelect
          },
          conversation: true
        }
      });
    },

    async endCall(userId: string, callId: string) {
      await assertCallParticipant(prisma, callId, userId);

      await prisma.callParticipant.updateMany({
        where: {
          callId,
          status: {
            in: [CallParticipantStatus.JOINED, CallParticipantStatus.INVITED]
          }
        },
        data: {
          status: CallParticipantStatus.LEFT,
          leftAt: new Date()
        }
      });

      await prisma.call.update({
        where: { id: callId },
        data: {
          status: CallStatus.ENDED,
          endedAt: new Date()
        }
      });

      return prisma.call.findUniqueOrThrow({
        where: { id: callId },
        include: {
          participants: {
            select: callParticipantSelect
          },
          conversation: true
        }
      });
    },

    async createJoinToken(userId: string, callId: string) {
      const call = await prisma.call.findUnique({
        where: { id: callId },
        include: {
          participants: true
        }
      });

      if (!call) {
        throw notFound("Call not found");
      }

      if (!call.participants.some((participant) => participant.userId === userId)) {
        throw forbidden("User is not allowed to join this call");
      }

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          username: true
        }
      });

      const token = await createLiveKitAccess(env, {
        identity: user.id,
        displayName: user.username,
        roomName: call.livekitRoomName,
        ttlSeconds: 600
      });

      return {
        url: env.LIVEKIT_URL,
        token,
        roomName: call.livekitRoomName
      };
    },

    async getHistory(userId: string) {
      return prisma.call.findMany({
        where: {
          participants: {
            some: {
              userId
            }
          }
        },
        orderBy: { createdAt: "desc" },
        include: {
          conversation: true,
          participants: {
            select: callParticipantSelect
          }
        }
      });
    }
  };
}
