import { AccessToken } from 'livekit-server-sdk';
import { env } from '../../config/env.js';
import type {
  RealtimeConnectionToken,
  RealtimeProvider,
  RealtimeTokenOptions,
} from '../interfaces.js';

export class LiveKitRealtimeProvider implements RealtimeProvider {
  async createParticipantToken(
    options: RealtimeTokenOptions,
  ): Promise<RealtimeConnectionToken> {
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: options.participantIdentity,
      name: options.participantName,
      ttl: env.LIVEKIT_TOKEN_TTL,
    });

    at.addGrant({
      roomJoin: true,
      room: options.roomName,
      canPublish: options.canPublishAudio,
      canPublishData: options.canPublishData,
      canSubscribe: options.canSubscribe,
    });

    return {
      url: env.LIVEKIT_URL,
      roomName: options.roomName,
      token: await at.toJwt(),
    };
  }
}

export const livekitRealtimeProvider = new LiveKitRealtimeProvider();
