export interface RealtimeTokenOptions {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  canPublishAudio: boolean;
  canSubscribe: boolean;
  canPublishData: boolean;
}

export interface RealtimeConnectionToken {
  url: string;
  roomName: string;
  token: string;
}

export interface RealtimeProvider {
  createParticipantToken(options: RealtimeTokenOptions): Promise<RealtimeConnectionToken>;
}

export interface STTProvider {
  transcribe(audioBuffer: ArrayBuffer): Promise<{ text: string; latencyMs: number }>;
}

export interface LLMProvider {
  complete(input: { systemPrompt: string; messages: Array<{ role: string; content: string }> }): Promise<{
    text: string;
    latencyMs: number;
    estimatedCostUsd?: number;
  }>;
}

export interface TTSProvider {
  synthesize(input: { text: string; voice: string }): Promise<{ audio: ArrayBuffer; latencyMs: number }>;
}
