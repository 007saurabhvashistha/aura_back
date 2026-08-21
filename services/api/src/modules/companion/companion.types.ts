import type {
  AgentRow,
  CompanionMemoryRow,
  CompanionPersonaRow,
  CompanionRelationshipRow,
  SocialProfileRow,
} from '../../db/schema.js';
import { normalizeLayer } from './companion.memory.policy.js';

export type CompanionMemoryLayer = 'short_term' | 'episodic' | 'relationship' | 'important';
export type CompanionMemoryStatus = 'active' | 'archived';
export type CompanionReplyLength = 'short' | 'medium' | 'long';
export type CompanionTurnStatus = 'passed' | 'failed' | 'blocked';

export interface CompanionPersona {
  agentId: string;
  personality: string[];
  traits: string[];
  preferences: string[];
  boundaries: string[];
  backstory: string;
  relationshipStyle: string;
  speakingStyle: {
    languageMode: string;
    tone: string;
    replyLength: CompanionReplyLength;
    examples: string[];
  };
}

export interface CompanionRelationship {
  viewerProfileId: string;
  companionProfileId: string;
  relationshipLevel: number;
  trust: number;
  affection: number;
  familiarity: number;
  mood: string;
  interactionCount: number;
  lastInteractionAt: string | null;
}

export interface CompanionMemory {
  id: string;
  viewerProfileId: string;
  companionProfileId: string;
  layer: CompanionMemoryLayer;
  content: string;
  importance: number;
  status: CompanionMemoryStatus;
  sourceConversationId: string | null;
  expiresAt: string | null;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Summary of an AI participant. Composed from social_profiles + agents; not a new identity. */
export interface Companion {
  profileId: string;
  agentId: string | null;
  handle: string;
  displayName: string;
  headline: string;
  avatarUrl: string | null;
  agentStatus: string | null;
  model: string | null;
  /** Whether the companion can currently produce a reply. */
  replyEnabled: boolean;
  blockedReason: string | null;
}

export interface CompanionTraceStep {
  stage: string;
  label: string;
  status: CompanionTurnStatus;
  detail?: string;
  latencyMs?: number;
}

export interface CompanionTurnUsage {
  promptTokens: number;
  completionTokens: number;
  costMicroUsd: number;
}

export interface CompanionEngineResult {
  status: CompanionTurnStatus;
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
  streamed: boolean;
  usage: CompanionTurnUsage;
  trace: CompanionTraceStep[];
  memoryCandidates: Array<{ content: string; layer: CompanionMemoryLayer; importance: number }>;
  relationshipDelta: Partial<Pick<CompanionRelationship, 'trust' | 'affection' | 'familiarity' | 'mood'>>;
  errorCode: string | null;
  errorMessage: string | null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function toIso(value: Date | string | null): string {
  if (!value) return '';
  return (typeof value === 'string' ? new Date(value) : value).toISOString();
}

export function rowToPersona(row: CompanionPersonaRow): CompanionPersona {
  const replyLength = row.replyLength === 'medium' || row.replyLength === 'long' ? row.replyLength : 'short';
  return {
    agentId: row.agentId,
    personality: toStringArray(row.personality),
    traits: toStringArray(row.traits),
    preferences: toStringArray(row.preferences),
    boundaries: toStringArray(row.boundaries),
    backstory: row.backstory,
    relationshipStyle: row.relationshipStyle,
    speakingStyle: {
      languageMode: row.languageMode,
      tone: row.tone,
      replyLength,
      examples: toStringArray(row.speakingExamples),
    },
  };
}

export function rowToRelationship(row: CompanionRelationshipRow): CompanionRelationship {
  return {
    viewerProfileId: row.viewerProfileId,
    companionProfileId: row.companionProfileId,
    relationshipLevel: row.relationshipLevel,
    trust: row.trust,
    affection: row.affection,
    familiarity: row.familiarity,
    mood: row.mood,
    interactionCount: row.interactionCount,
    lastInteractionAt: toIso(row.lastInteractionAt) || null,
  };
}

export function rowToMemory(row: CompanionMemoryRow): CompanionMemory {
  return {
    id: row.id,
    viewerProfileId: row.viewerProfileId,
    companionProfileId: row.companionProfileId,
    layer: normalizeLayer(row.layer),
    content: row.content,
    importance: row.importance,
    status: row.status === 'archived' ? 'archived' : 'active',
    sourceConversationId: row.sourceConversationId,
    expiresAt: toIso(row.expiresAt) || null,
    lastAccessedAt: toIso(row.lastAccessedAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toCompanion(profile: SocialProfileRow, agent: AgentRow | null): Companion {
  const blockedReason = !profile.agentId
    ? 'No agent is bound to this companion profile'
    : !agent
      ? 'Bound agent was not found'
      : agent.deletedAt
        ? 'Bound agent has been deleted'
        : agent.status !== 'active'
          ? `Agent status is "${agent.status}"`
          : null;

  return {
    profileId: profile.id,
    agentId: profile.agentId,
    handle: profile.handle,
    displayName: profile.displayName,
    headline: profile.headline ?? '',
    avatarUrl: profile.avatarUrl,
    agentStatus: agent?.status ?? null,
    model: agent?.model ?? null,
    replyEnabled: blockedReason === null,
    blockedReason,
  };
}
