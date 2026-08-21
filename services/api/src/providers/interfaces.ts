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

export interface LLMCompletionInput {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  /** Provider-agnostic generation hints. Providers may ignore unsupported fields. */
  maxOutputTokens?: number;
  temperature?: number;
  /** Cooperative cancellation; the gateway always supplies one. */
  signal?: AbortSignal;
}

export interface LLMCompletionResult {
  text: string;
  latencyMs: number;
  estimatedCostUsd?: number;
  promptTokens?: number;
  completionTokens?: number;
}

/** Receives incremental text. Called zero or more times before the result resolves. */
export type LLMStreamHandler = (delta: string) => void;

export interface LLMProvider {
  /** Stable identifier persisted on every generated turn (e.g. 'demo', 'openai'). */
  readonly name: string;
  /** Model identifier reported to observability; never a secret. */
  readonly model: string;
  complete(input: LLMCompletionInput): Promise<LLMCompletionResult>;
  /**
   * Optional incremental generation. The gateway falls back to `complete` when a
   * provider does not implement it, so callers never branch on provider capability.
   */
  stream?(input: LLMCompletionInput, onDelta: LLMStreamHandler): Promise<LLMCompletionResult>;
}

export type ModerationStage = 'input' | 'output';

export interface ModerationVerdict {
  allowed: boolean;
  /** Machine-readable reason; persisted on blocked turns. */
  code: string | null;
  reason: string | null;
  /** Text to use downstream. Providers may redact rather than block. */
  text: string;
  /** Non-blocking observations (e.g. suspected prompt injection). */
  flags: string[];
}

/**
 * Safety boundary. It sits outside the model so swapping a provider never changes
 * the safety architecture.
 */
export interface ModerationProvider {
  readonly name: string;
  review(stage: ModerationStage, text: string): Promise<ModerationVerdict>;
}

export interface TTSProvider {
  synthesize(input: { text: string; voice: string }): Promise<{ audio: ArrayBuffer; latencyMs: number }>;
}
