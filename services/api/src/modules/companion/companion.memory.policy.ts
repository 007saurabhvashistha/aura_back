import { env } from '../../config/env.js';
import type { CompanionMemory, CompanionMemoryLayer } from './companion.types.js';

/**
 * Memory policy.
 *
 * Layers differ in how long a fact stays relevant, not in how it is stored. Decay is
 * computed from age and importance so retention needs no background job and no vector
 * store. `long_term` remains accepted as a legacy alias for `important`.
 */
export interface MemoryLayerPolicy {
  layer: CompanionMemoryLayer;
  /** Null means the layer does not expire on age alone. */
  ttlDays: number | null;
  /** Days after which decayed importance drops by one. Null disables decay. */
  halfLifeDays: number | null;
  maxItems: number;
  /** Ceiling applied to candidates so a model cannot inflate its own memory. */
  maxImportance: number;
}

export const MEMORY_LAYERS: Record<CompanionMemoryLayer, MemoryLayerPolicy> = {
  short_term: { layer: 'short_term', ttlDays: 7, halfLifeDays: 2, maxItems: 40, maxImportance: 3 },
  episodic: { layer: 'episodic', ttlDays: 90, halfLifeDays: 30, maxItems: 120, maxImportance: 4 },
  relationship: { layer: 'relationship', ttlDays: null, halfLifeDays: null, maxItems: 40, maxImportance: 5 },
  important: { layer: 'important', ttlDays: null, halfLifeDays: 180, maxItems: 60, maxImportance: 5 },
};

export function normalizeLayer(value: string): CompanionMemoryLayer {
  if (value === 'long_term') return 'important';
  return value === 'episodic' || value === 'relationship' || value === 'important' || value === 'short_term'
    ? value
    : 'short_term';
}

export function policyFor(layer: CompanionMemoryLayer): MemoryLayerPolicy {
  return MEMORY_LAYERS[layer] ?? MEMORY_LAYERS.short_term;
}

export function expiryFor(layer: CompanionMemoryLayer, from: Date = new Date()): Date | null {
  const { ttlDays } = policyFor(layer);
  if (ttlDays === null) return null;
  return new Date(from.getTime() + ttlDays * 24 * 60 * 60 * 1000);
}

function ageInDays(iso: string, now: number): number {
  const created = new Date(iso).getTime();
  return Number.isNaN(created) ? 0 : Math.max(0, (now - created) / (24 * 60 * 60 * 1000));
}

/**
 * Effective importance after decay. Recall (`lastAccessedAt`) counts as freshness, so a
 * memory the companion keeps using does not silently age out.
 */
export function decayedImportance(memory: CompanionMemory, now: number = Date.now()): number {
  const { halfLifeDays } = policyFor(memory.layer);
  if (!env.COMPANION_MEMORY_DECAY_ENABLED || halfLifeDays === null) return memory.importance;
  const reference = memory.lastAccessedAt || memory.createdAt;
  const steps = Math.floor(ageInDays(reference, now) / halfLifeDays);
  return memory.importance - steps;
}

export function isExpired(memory: CompanionMemory, now: number = Date.now()): boolean {
  if (memory.expiresAt && new Date(memory.expiresAt).getTime() <= now) return true;
  return decayedImportance(memory, now) <= 0;
}

/**
 * Decides which memories to archive. Returns ids only; the caller owns the write so this
 * stays testable without a database.
 */
export function selectForArchival(memories: CompanionMemory[], now: number = Date.now()): string[] {
  const active = memories.filter((memory) => memory.status === 'active');
  const expired = active.filter((memory) => isExpired(memory, now));
  const expiredIds = new Set(expired.map((memory) => memory.id));

  const surviving = active.filter((memory) => !expiredIds.has(memory.id));
  const overflow: CompanionMemory[] = [];

  // Per-layer caps first, then the global ceiling. Lowest decayed importance goes first.
  const byLayer = new Map<CompanionMemoryLayer, CompanionMemory[]>();
  for (const memory of surviving) {
    const list = byLayer.get(memory.layer) ?? [];
    list.push(memory);
    byLayer.set(memory.layer, list);
  }

  const ranked = (items: CompanionMemory[]): CompanionMemory[] =>
    [...items].sort(
      (a, b) =>
        decayedImportance(b, now) - decayedImportance(a, now) ||
        new Date(b.lastAccessedAt || b.createdAt).getTime() - new Date(a.lastAccessedAt || a.createdAt).getTime(),
    );

  const kept: CompanionMemory[] = [];
  for (const [layer, items] of byLayer) {
    const order = ranked(items);
    kept.push(...order.slice(0, policyFor(layer).maxItems));
    overflow.push(...order.slice(policyFor(layer).maxItems));
  }

  const globalOrder = ranked(kept);
  overflow.push(...globalOrder.slice(env.COMPANION_MEMORY_MAX_PER_COMPANION));

  return [...expiredIds, ...overflow.map((memory) => memory.id)];
}
