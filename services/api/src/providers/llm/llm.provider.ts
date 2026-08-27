import { env } from '../../config/env.js';
import type { LLMCompletionInput, LLMCompletionResult, LLMProvider } from '../interfaces.js';
import { DemoLLMProvider } from './demo.provider.js';
import { OpenAICompatibleProductionProvider } from './openai-compatible.provider.js';

/** Placeholder adapter; selected when no provider is configured. */
export class NoopLLMProvider implements LLMProvider {
  readonly name = 'none';
  readonly model = 'none';

  async complete(): Promise<LLMCompletionResult> {
    throw new Error('LLM provider is not configured');
  }
}

/**
 * Provider registry. Selection is configuration-driven so a vendor adapter can be
 * registered here without any caller changing.
 */
const registry: Record<string, () => LLMProvider> = {
  demo: () => new DemoLLMProvider(env.LLM_MODEL),
  openai_compatible: () => new OpenAICompatibleProductionProvider(),
  none: () => new NoopLLMProvider(),
};

export function createLlmProvider(name: string = env.LLM_PROVIDER): LLMProvider {
  const factory = registry[name];
  return factory ? factory() : new NoopLLMProvider();
}

export const llmProvider: LLMProvider = createLlmProvider();

export type { LLMCompletionInput, LLMCompletionResult, LLMProvider };
