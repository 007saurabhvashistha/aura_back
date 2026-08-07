import type { LLMProvider } from '../interfaces.js';

/** Placeholder adapter; Sprint 3 integration can swap in any LLM vendor. */
export class NoopLLMProvider implements LLMProvider {
  async complete(): Promise<{ text: string; latencyMs: number; estimatedCostUsd?: number }> {
    throw new Error('LLM provider is not configured');
  }
}

export const llmProvider = new NoopLLMProvider();
