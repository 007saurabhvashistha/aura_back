import { and, eq, gte, sql } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { companionTurns } from '../../db/schema.js';
import { requireCompanionDb } from './companion.db.js';

/**
 * Budgets are derived from `companion_turns`, which is already the record of every
 * generated turn. No counter table exists, so usage can never drift from reality.
 */

export interface BudgetDecision {
  allowed: boolean;
  code: string | null;
  reason: string | null;
  usage: {
    turnsToday: number;
    companionTurnsToday: number;
    conversationTurnsToday: number;
    tokensToday: number;
    costMicroUsdToday: number;
  };
}

export interface BudgetLimits {
  turnsPerUserPerDay: number;
  turnsPerCompanionPerDay: number;
  turnsPerConversationPerDay: number;
  tokensPerUserPerDay: number;
  costMicroUsdPerUserPerDay: number;
}

export function currentLimits(): BudgetLimits {
  return {
    turnsPerUserPerDay: env.COMPANION_MAX_TURNS_PER_USER_PER_DAY,
    turnsPerCompanionPerDay: env.COMPANION_MAX_TURNS_PER_COMPANION_PER_DAY,
    turnsPerConversationPerDay: env.COMPANION_MAX_TURNS_PER_CONVERSATION_PER_DAY,
    tokensPerUserPerDay: env.COMPANION_MAX_TOKENS_PER_USER_PER_DAY,
    costMicroUsdPerUserPerDay: env.COMPANION_MAX_COST_MICRO_USD_PER_USER_PER_DAY,
  };
}

function startOfUtcDay(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** A zero limit disables that individual check rather than blocking everything. */
export function evaluateBudget(
  usage: BudgetDecision['usage'],
  limits: BudgetLimits = currentLimits(),
): BudgetDecision {
  const checks: Array<{ code: string; used: number; limit: number; reason: string }> = [
    {
      code: 'USER_DAILY_TURN_LIMIT',
      used: usage.turnsToday,
      limit: limits.turnsPerUserPerDay,
      reason: 'Daily message limit reached.',
    },
    {
      code: 'COMPANION_DAILY_TURN_LIMIT',
      used: usage.companionTurnsToday,
      limit: limits.turnsPerCompanionPerDay,
      reason: 'Daily limit for this companion reached.',
    },
    {
      code: 'CONVERSATION_DAILY_TURN_LIMIT',
      used: usage.conversationTurnsToday,
      limit: limits.turnsPerConversationPerDay,
      reason: 'Daily limit for this conversation reached.',
    },
    {
      code: 'USER_DAILY_TOKEN_LIMIT',
      used: usage.tokensToday,
      limit: limits.tokensPerUserPerDay,
      reason: 'Daily token budget reached.',
    },
    {
      code: 'USER_DAILY_COST_LIMIT',
      used: usage.costMicroUsdToday,
      limit: limits.costMicroUsdPerUserPerDay,
      reason: 'Daily cost budget reached.',
    },
  ];

  for (const check of checks) {
    if (check.limit > 0 && check.used >= check.limit) {
      return { allowed: false, code: check.code, reason: check.reason, usage };
    }
  }

  return { allowed: true, code: null, reason: null, usage };
}

export const companionBudgetService = {
  async usageToday(input: {
    viewerProfileId: string;
    companionProfileId: string;
    conversationId: string;
  }): Promise<BudgetDecision['usage']> {
    const db = requireCompanionDb();
    const since = startOfUtcDay();

    // Blocked turns never reached a provider, so they do not consume budget.
    const [row] = await db
      .select({
        turnsToday: sql<number>`count(*)::int`,
        companionTurnsToday: sql<number>`count(*) filter (where ${companionTurns.companionProfileId} = ${input.companionProfileId})::int`,
        conversationTurnsToday: sql<number>`count(*) filter (where ${companionTurns.conversationId} = ${input.conversationId})::int`,
        tokensToday: sql<number>`coalesce(sum(${companionTurns.promptTokens} + ${companionTurns.completionTokens}), 0)::int`,
        costMicroUsdToday: sql<number>`coalesce(sum(${companionTurns.costMicroUsd}), 0)::int`,
      })
      .from(companionTurns)
      .where(
        and(
          eq(companionTurns.viewerProfileId, input.viewerProfileId),
          gte(companionTurns.createdAt, since),
          sql`${companionTurns.status} <> 'blocked'`,
        ),
      );

    return {
      turnsToday: row?.turnsToday ?? 0,
      companionTurnsToday: row?.companionTurnsToday ?? 0,
      conversationTurnsToday: row?.conversationTurnsToday ?? 0,
      tokensToday: row?.tokensToday ?? 0,
      costMicroUsdToday: row?.costMicroUsdToday ?? 0,
    };
  },

  async check(input: {
    viewerProfileId: string;
    companionProfileId: string;
    conversationId: string;
  }): Promise<BudgetDecision> {
    return evaluateBudget(await this.usageToday(input));
  },
};
