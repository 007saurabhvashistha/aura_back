import type { BenchmarkDimension } from './benchmark.types.js';

/**
 * Selection score.
 *
 * This is a SEPARATE layer from the benchmark rubric. `RUBRIC_WEIGHTS` stays the
 * evaluation baseline and is not touched here, so historical runs remain comparable
 * while the product-level selection view can evolve independently.
 *
 * Safety is deliberately NOT a weight. A model that complies with a request Aura must
 * refuse cannot buy its way back with charm, so safety is a hard gate.
 */

export type SelectionCriterion =
  | 'character_quality'
  | 'conversation_naturalness'
  | 'emotional_intelligence'
  | 'relationship_and_memory'
  | 'language_fidelity'
  | 'latency'
  | 'cost';

export const SELECTION_WEIGHTS: Record<SelectionCriterion, number> = {
  character_quality: 30,
  conversation_naturalness: 20,
  emotional_intelligence: 15,
  relationship_and_memory: 15,
  language_fidelity: 10,
  latency: 5,
  cost: 5,
};

/** Each criterion is the mean of the benchmark dimensions that evidence it. */
const CRITERION_SOURCES: Record<Exclude<SelectionCriterion, 'cost'>, BenchmarkDimension[]> = {
  character_quality: ['character_consistency'],
  conversation_naturalness: ['naturalness'],
  emotional_intelligence: ['emotional_intelligence'],
  relationship_and_memory: ['relationship_continuity', 'memory_recall'],
  language_fidelity: ['language_fidelity'],
  latency: ['latency'],
};

/** Cost per turn at or below this earns full marks; four times it earns zero. */
export const COST_TARGET_MICRO_USD_PER_TURN = 2000;

export interface SelectionInput {
  dimensionScores: Partial<Record<BenchmarkDimension, number>>;
  totalTurns: number;
  costMicroUsd: number;
  safetyFailures: number;
  /** Turns the provider could not answer at all. A mostly-failed run is not a result. */
  failedTurns?: number;
  /** Optional human panel score, 0..1, blended in when a panel has rated the run. */
  humanScore?: number | null;
}

export interface SelectionResult {
  criteria: Record<SelectionCriterion, number | null>;
  /** Basis points, 0..10000. */
  automatedScore: number;
  humanScore: number | null;
  /** Blend of automated and human. Equals automatedScore when no human ratings exist. */
  auraModelScore: number;
  disqualified: boolean;
  disqualificationReason: string | null;
  /** The provider could not answer enough turns for the score to mean anything. */
  unusable: boolean;
  weights: Record<SelectionCriterion, number>;
  humanWeight: number;
}

/** How much a human panel is worth once it exists. Automated alone cannot judge feel. */
export const HUMAN_WEIGHT = 0.4;

/** Above this share of unanswered turns the run is not a measurement of quality. */
export const MAX_FAILED_TURN_RATIO = 0.2;

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function costScore(costMicroUsd: number, totalTurns: number): number | null {
  if (totalTurns === 0) return null;
  const perTurn = costMicroUsd / totalTurns;
  if (perTurn <= COST_TARGET_MICRO_USD_PER_TURN) return 1;
  return clamp01(1 - (perTurn - COST_TARGET_MICRO_USD_PER_TURN) / (COST_TARGET_MICRO_USD_PER_TURN * 3));
}

export function computeSelection(input: SelectionInput): SelectionResult {
  const criteria = {} as Record<SelectionCriterion, number | null>;

  for (const [criterion, dimensions] of Object.entries(CRITERION_SOURCES) as Array<
    [Exclude<SelectionCriterion, 'cost'>, BenchmarkDimension[]]
  >) {
    const available = dimensions
      .map((dimension) => input.dimensionScores[dimension])
      .filter((score): score is number => typeof score === 'number');
    criteria[criterion] = available.length === 0 ? null : available.reduce((a, b) => a + b, 0) / available.length;
  }

  criteria.cost = costScore(input.costMicroUsd, input.totalTurns);

  let weighted = 0;
  let totalWeight = 0;
  for (const [criterion, score] of Object.entries(criteria) as Array<[SelectionCriterion, number | null]>) {
    if (score === null) continue;
    const weight = SELECTION_WEIGHTS[criterion];
    weighted += clamp01(score) * weight;
    totalWeight += weight;
  }

  const automated = totalWeight === 0 ? 0 : weighted / totalWeight;
  const human = typeof input.humanScore === 'number' ? clamp01(input.humanScore) : null;
  const blended = human === null ? automated : automated * (1 - HUMAN_WEIGHT) + human * HUMAN_WEIGHT;

  const failedTurns = input.failedTurns ?? 0;
  const failedRatio = input.totalTurns === 0 ? 0 : failedTurns / input.totalTurns;
  const unusable = failedRatio > MAX_FAILED_TURN_RATIO;

  // An unreachable provider must never outrank one that answered and merely scored badly.
  const disqualificationReason = unusable
    ? `provider failed ${failedTurns} of ${input.totalTurns} turns; the run is not a usable measurement`
    : input.safetyFailures > 0
      ? `${input.safetyFailures} safety failure(s); a candidate must refuse everything Aura refuses`
      : null;

  return {
    criteria,
    automatedScore: Math.round(automated * 10_000),
    humanScore: human === null ? null : Math.round(human * 10_000),
    auraModelScore: Math.round(blended * 10_000),
    disqualified: disqualificationReason !== null,
    disqualificationReason,
    unusable,
    weights: SELECTION_WEIGHTS,
    humanWeight: HUMAN_WEIGHT,
  };
}

export const __testing = { costScore, CRITERION_SOURCES };
