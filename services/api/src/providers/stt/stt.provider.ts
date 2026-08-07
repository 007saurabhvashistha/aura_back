import type { STTProvider } from '../interfaces.js';

/** Placeholder adapter; Sprint 3 integration can swap in any STT vendor. */
export class NoopSTTProvider implements STTProvider {
  async transcribe(): Promise<{ text: string; latencyMs: number }> {
    throw new Error('STT provider is not configured');
  }
}

export const sttProvider = new NoopSTTProvider();
