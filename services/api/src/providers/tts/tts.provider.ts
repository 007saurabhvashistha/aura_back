import type { TTSProvider } from '../interfaces.js';

/** Placeholder adapter; Sprint 3 integration can swap in any TTS vendor. */
export class NoopTTSProvider implements TTSProvider {
  async synthesize(): Promise<{ audio: ArrayBuffer; latencyMs: number }> {
    throw new Error('TTS provider is not configured');
  }
}

export const ttsProvider = new NoopTTSProvider();
