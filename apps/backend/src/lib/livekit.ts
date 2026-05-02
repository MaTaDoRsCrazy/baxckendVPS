import { AccessToken } from "livekit-server-sdk";
import type { AppEnv } from "../config/env.js";

interface LiveKitGrantInput {
  identity: string;
  roomName: string;
  displayName?: string;
  ttlSeconds?: number;
}

export async function createLiveKitAccess(env: AppEnv, input: LiveKitGrantInput): Promise<string> {
  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: input.identity,
    name: input.displayName ?? input.identity,
    ttl: input.ttlSeconds ?? 1800
  });

  token.addGrant({
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    room: input.roomName
  });

  return token.toJwt();
}
