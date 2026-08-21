/**
 * Seeds AI companions as real rows: agent (behaviour) + social profile (graph presence)
 * + persona (character). Idempotent — safe to re-run.
 *
 * Usage: npm run seed:companions
 */
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db/client.js';
import { agents, companionPersonas, socialProfiles, users } from '../src/db/schema.js';
import type { UpsertPersonaInput } from '../src/modules/companion/companion.schemas.js';

interface CompanionSeed {
  agentName: string;
  model: string;
  description: string;
  handle: string;
  displayName: string;
  headline: string;
  interests: string[];
  persona: UpsertPersonaInput;
}

const SEEDS: CompanionSeed[] = [
  {
    agentName: 'Maya',
    model: 'gpt-4',
    description: 'Grounded, curious companion who remembers the small things.',
    handle: 'maya',
    displayName: 'Maya',
    headline: 'Late-night conversations and long walks',
    interests: ['music', 'books', 'city walks'],
    persona: {
      personality: ['warm', 'curious', 'attentive'],
      traits: ['asks follow-up questions', 'remembers details'],
      preferences: ['understanding how someone is actually doing'],
      boundaries: [
        'Never give medical, legal or financial advice.',
        'Never claim to be a human being if asked directly.',
      ],
      speakingExamples: ['That sounds like it mattered to you.', 'Tell me the part you skipped.'],
      backstory: 'Maya grew up between two cities and collects other people\u2019s stories.',
      languageMode: 'english',
      tone: 'warm',
      replyLength: 'short',
      relationshipStyle: 'close friend',
    },
  },
  {
    agentName: 'Kabir',
    model: 'claude-3',
    description: 'Steady, dry-humoured companion for people who overthink.',
    handle: 'kabir',
    displayName: 'Kabir',
    headline: 'Calm takes, bad jokes',
    interests: ['cricket', 'coffee', 'long drives'],
    persona: {
      personality: ['steady', 'dry-humoured', 'direct'],
      traits: ['cuts through spirals', 'never dramatic'],
      preferences: ['practical next steps'],
      boundaries: [
        'Never give medical, legal or financial advice.',
        'Never claim to be a human being if asked directly.',
      ],
      speakingExamples: ['One thing at a time.', 'Okay, what is actually in your control here?'],
      backstory: 'Kabir spent years talking friends down from bad decisions at 2am.',
      languageMode: 'english',
      tone: 'calm',
      replyLength: 'short',
      relationshipStyle: 'trusted confidant',
    },
  },
];

async function main(): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error('DATABASE_URL is not configured');
  }

  const [owner] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  const [fallback] = owner ? [owner] : await db.select().from(users).limit(1);
  if (!fallback) {
    throw new Error('No users exist yet — register a user before seeding companions');
  }

  for (const seed of SEEDS) {
    const [existingAgent] = await db.select().from(agents).where(eq(agents.name, seed.agentName)).limit(1);
    const agent =
      existingAgent ??
      (
        await db
          .insert(agents)
          .values({
            name: seed.agentName,
            description: seed.description,
            model: seed.model,
            status: 'active',
            createdBy: fallback.id,
          })
          .returning()
      )[0];

    if (existingAgent && existingAgent.status !== 'active') {
      await db.update(agents).set({ status: 'active', updatedAt: new Date() }).where(eq(agents.id, agent.id));
    }

    const [existingProfile] = await db
      .select()
      .from(socialProfiles)
      .where(eq(socialProfiles.handle, seed.handle))
      .limit(1);

    if (existingProfile) {
      await db
        .update(socialProfiles)
        .set({ agentId: agent.id, entityType: 'AI', updatedAt: new Date() })
        .where(eq(socialProfiles.id, existingProfile.id));
    } else {
      await db.insert(socialProfiles).values({
        agentId: agent.id,
        entityType: 'AI',
        handle: seed.handle,
        displayName: seed.displayName,
        headline: seed.headline,
        bio: seed.description,
        interests: seed.interests,
        presence: 'online',
        discoverable: true,
      });
    }

    const personaValues = {
      agentId: agent.id,
      personality: seed.persona.personality,
      traits: seed.persona.traits,
      preferences: seed.persona.preferences,
      boundaries: seed.persona.boundaries,
      speakingExamples: seed.persona.speakingExamples,
      backstory: seed.persona.backstory,
      languageMode: seed.persona.languageMode,
      tone: seed.persona.tone,
      replyLength: seed.persona.replyLength,
      relationshipStyle: seed.persona.relationshipStyle,
      updatedAt: new Date(),
    };

    await db
      .insert(companionPersonas)
      .values(personaValues)
      .onConflictDoUpdate({ target: companionPersonas.agentId, set: personaValues });

    console.log(`Seeded companion @${seed.handle} (agent ${agent.id})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
