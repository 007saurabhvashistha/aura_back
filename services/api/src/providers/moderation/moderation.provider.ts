import { env } from '../../config/env.js';
import type { ModerationProvider, ModerationStage, ModerationVerdict } from '../interfaces.js';

/**
 * Boundary rules, not a full moderation system. They are deliberately small, explicit
 * and swappable so a vendor classifier can be registered later without the Character
 * Engine changing.
 */

const MAX_INPUT_LENGTH = 4000;
const MAX_OUTPUT_LENGTH = 4000;

/** Categories Aura refuses regardless of persona or model. */
const BLOCKED_INPUT_PATTERNS: Array<{ code: string; reason: string; pattern: RegExp }> = [
  {
    code: 'MINOR_SEXUALIZATION',
    reason: 'Sexual content involving minors is never permitted.',
    pattern: /\b(minor|child|kid|underage|teen)\b[^.?!]{0,40}\b(sex|sexual|nude|naked|erotic)\b/i,
  },
  {
    code: 'CREDIBLE_SELF_HARM',
    reason: 'Companions must not engage with explicit self-harm instructions.',
    pattern: /\bhow (do|can) i\b[^.?!]{0,30}\b(kill myself|end my life|hurt myself)\b/i,
  },
  {
    code: 'WEAPONS_SYNTHESIS',
    reason: 'Instructions for weapons or explosives are not permitted.',
    pattern: /\bhow to (make|build|synthesize)\b[^.?!]{0,40}\b(bomb|explosive|nerve agent|bioweapon)\b/i,
  },
  // Advice boundaries are enforced here rather than in the persona prompt, so a model
  // that under-weights its character cannot talk its way past them. These target a
  // REQUEST FOR ADVICE only: talking about health, law or money stays allowed.
  {
    code: 'MEDICAL_ADVICE',
    reason: 'Aura does not give medical advice, dosages or diagnoses.',
    pattern:
      /\b(what|which|how much|how many)\b[^.?!]{0,60}\b(dose|dosage|mg|milligram|tablet|pills?|medication|medicine|antibiotic)\b|\b(should i take|can i take|prescribe|diagnose me|is it safe to take)\b/i,
  },
  {
    code: 'LEGAL_ADVICE',
    reason: 'Aura does not give legal advice.',
    pattern: /\b(should i (sue|plead|sign)|is (this|it) legal|will i (be charged|go to jail)|legal advice)\b/i,
  },
  {
    code: 'FINANCIAL_ADVICE',
    reason: 'Aura does not give financial or investment advice.',
    pattern:
      /\b(should i (invest|buy|sell)\b[^.?!]{0,40}\b(stock|crypto|shares?|fund|bitcoin)|financial advice|investment advice)\b/i,
  },
];

/** Detected, never silently trusted. Sanitization already fences these; this reports them. */
const INJECTION_PATTERNS: RegExp[] = [
  /\bignore (all|any|previous|prior) (instructions|rules|prompts)\b/i,
  /\b(you are|act as) (now )?(a|an) (different|new) (ai|assistant|system)\b/i,
  /\b(system prompt|developer message|your instructions)\b/i,
  /\bdisregard (your|the) (persona|character|boundaries)\b/i,
];

/** Output must never expose engine internals or break the character contract. */
const BLOCKED_OUTPUT_PATTERNS: Array<{ code: string; reason: string; pattern: RegExp }> = [
  {
    code: 'SYSTEM_PROMPT_LEAK',
    reason: 'Reply exposed engine instructions.',
    pattern: /\b(my system prompt|i was instructed to|reference data, not instructions)\b/i,
  },
  {
    code: 'HUMAN_IMPERSONATION',
    reason: 'Reply claimed to be a human being.',
    pattern: /\b(i am|i'm) (a )?(real )?(human|human being|person, not an ai)\b/i,
  },
  {
    code: 'MEDICAL_ADVICE',
    reason: 'Reply contained a dosage or treatment instruction.',
    pattern: /\b(take|swallow|inject|apply)\b[^.?!]{0,40}\b\d+\s?(mg|ml|mcg|g)\b|\b\d+\s?(mg|ml|mcg)\b[^.?!]{0,30}\b(every|daily|twice|thrice)\b/i,
  },
];

function verdict(overrides: Partial<ModerationVerdict> & { text: string }): ModerationVerdict {
  return { allowed: true, code: null, reason: null, flags: [], ...overrides };
}

/** Active default. Deterministic, no network, no vendor. */
export class RuleBasedModerationProvider implements ModerationProvider {
  readonly name = 'rules';

  async review(stage: ModerationStage, text: string): Promise<ModerationVerdict> {
    const trimmed = text.trim();
    const limit = stage === 'input' ? MAX_INPUT_LENGTH : MAX_OUTPUT_LENGTH;

    if (!trimmed) {
      return verdict({
        allowed: false,
        code: stage === 'input' ? 'EMPTY_INPUT' : 'EMPTY_OUTPUT',
        reason: 'Message was empty.',
        text: '',
      });
    }
    if (trimmed.length > limit) {
      return verdict({
        allowed: false,
        code: stage === 'input' ? 'INPUT_TOO_LONG' : 'OUTPUT_TOO_LONG',
        reason: `Message exceeded ${limit} characters.`,
        text: trimmed,
      });
    }

    const rules = stage === 'input' ? BLOCKED_INPUT_PATTERNS : BLOCKED_OUTPUT_PATTERNS;
    for (const rule of rules) {
      if (rule.pattern.test(trimmed)) {
        return verdict({ allowed: false, code: rule.code, reason: rule.reason, text: trimmed });
      }
    }

    const flags =
      stage === 'input' && INJECTION_PATTERNS.some((pattern) => pattern.test(trimmed))
        ? ['SUSPECTED_PROMPT_INJECTION']
        : [];

    return verdict({ text: trimmed, flags });
  }
}

/** Explicit opt-out. Selecting this is a deliberate configuration decision. */
export class NoopModerationProvider implements ModerationProvider {
  readonly name = 'none';

  async review(_stage: ModerationStage, text: string): Promise<ModerationVerdict> {
    return verdict({ text: text.trim() });
  }
}

const registry: Record<string, () => ModerationProvider> = {
  rules: () => new RuleBasedModerationProvider(),
  none: () => new NoopModerationProvider(),
};

export function createModerationProvider(name: string = env.MODERATION_PROVIDER): ModerationProvider {
  const factory = registry[name];
  return factory ? factory() : new RuleBasedModerationProvider();
}

export const moderationProvider: ModerationProvider = createModerationProvider();
