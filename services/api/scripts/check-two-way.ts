/**
 * Phase 4L end-to-end check against a running API.
 * Usage: npx tsx scripts/check-two-way.ts
 *
 * Tokens are signed locally with the app's own signer rather than posted to /auth/login,
 * because the login limiter (10/15min per IP) would otherwise throttle repeated runs.
 */
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db/client.js';
import { users } from '../src/db/schema.js';
import { signAccessToken } from '../src/utils/tokens.js';

const API = process.env.API_URL ?? 'http://localhost:4000';

async function login(email: string): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error(`No user ${email}`);
  return signAccessToken(user.id, user.email, user.role);
}

function client(token: string) {
  return async (path: string, init: RequestInit = {}) => {
    const res = await fetch(`${API}/api/v1${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...init.headers },
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, data: body?.data, message: body?.message };
  };
}

const check = (label: string, ok: boolean, extra = ''): void => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`);
  if (!ok) process.exitCode = 1;
};

async function main(): Promise<void> {
  const A = client(await login('phase5.tester@aura.dev'));
  const B = client(await login('phase5.friend@aura.dev'));

  const meA = (await A('/social/me')).data;
  const meB = (await B('/social/me')).data;
  console.log(`A = @${meA.handle}   B = @${meB.handle}\n`);

  // Start from a known state; a previous aborted run may have left a block in place.
  await A(`/social/profiles/${meB.id}/block`, { method: 'DELETE' });
  await B(`/social/profiles/${meA.id}/block`, { method: 'DELETE' });

  // 1. A starts a thread with B and sends.
  const created = await A('/social/conversations', {
    method: 'POST',
    body: JSON.stringify({ profileId: meB.id, channel: 'chat', topic: 'Phase 4L' }),
  });
  const convId = created.data.id;
  check('A creates a direct thread', created.data.kind === 'direct', `kind=${created.data.kind}`);

  const token = `4L-${Date.now()}`;
  await A(`/social/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify({ text: token }) });

  // 2. B sees the same thread, with A's message as incoming and unread.
  const bList = (await B('/social/conversations')).data as Array<Record<string, any>>;
  const bThread = bList.find((item) => item.id === convId);
  check('B sees the same conversation id', Boolean(bThread));
  check('B sees A\u2019s message', bThread?.messages?.some((m: any) => m.text === token) ?? false);
  check(
    'B sees it as incoming (participant)',
    bThread?.messages?.find((m: any) => m.text === token)?.author === 'participant',
    `author=${bThread?.messages?.find((m: any) => m.text === token)?.author}`,
  );
  // Pre-4L history merged into this pair's thread also counts, so assert unread > 0.
  check('B has unread messages', (bThread?.unreadCount ?? 0) >= 1, `unread=${bThread?.unreadCount}`);

  const aThread = ((await A('/social/conversations')).data as Array<Record<string, any>>).find(
    (item) => item.id === convId,
  );
  check(
    'A sees the same message as outgoing (operator)',
    aThread?.messages?.find((m: any) => m.text === token)?.author === 'operator',
  );
  check('A has unread = 0', aThread?.unreadCount === 0, `unread=${aThread?.unreadCount}`);

  // 3. B replies into the SAME thread; A sees it.
  const reply = `reply-${Date.now()}`;
  const bSend = await B(`/social/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text: reply }),
  });
  check('B can send into the shared thread', bSend.status === 201, `status=${bSend.status}`);

  const aAfter = (await A(`/social/conversations/${convId}`)).data;
  check('A sees B\u2019s reply', aAfter.messages.some((m: any) => m.text === reply));
  check(
    'A sees the reply as incoming',
    aAfter.messages.find((m: any) => m.text === reply)?.author === 'participant',
  );
  check('A now has unread = 1', aAfter.unreadCount === 1, `unread=${aAfter.unreadCount}`);

  // 4. Read state is per participant.
  await A(`/social/conversations/${convId}/read`, { method: 'POST' });
  const aRead = (await A(`/social/conversations/${convId}`)).data;
  check('A unread clears after read', aRead.unreadCount === 0);

  // Read position is per participant: a new message from A must only raise B's count.
  const nudge = `nudge-${Date.now()}`;
  await A(`/social/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify({ text: nudge }) });
  const aSelf = await A(`/social/conversations/${convId}`);
  const bSide = await B(`/social/conversations/${convId}`);
  check('B can still read the thread', bSide.status === 200, `status=${bSide.status}`);
  check('Sender stays at unread 0', aSelf.data?.unreadCount === 0, `A unread=${aSelf.data?.unreadCount}`);
  check('Recipient unread increments', bSide.data?.unreadCount === 1, `B unread=${bSide.data?.unreadCount}`);

  // 5. Dedup: starting again returns the same thread.
  const again = await A('/social/conversations', {
    method: 'POST',
    body: JSON.stringify({ profileId: meB.id, channel: 'chat', topic: 'duplicate attempt' }),
  });
  check('Re-opening returns the same thread', again.data.id === convId, `${again.data.id}`);

  // 6. Block denies messaging both ways.
  await A(`/social/profiles/${meB.id}/block`, { method: 'POST' });
  const blockedSend = await A(`/social/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text: 'should fail' }),
  });
  check('Blocked sender is denied', blockedSend.status === 404, `status=${blockedSend.status}`);

  const blockedReverse = await B(`/social/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text: 'should also fail' }),
  });
  check('Blocked recipient is denied too', blockedReverse.status === 404, `status=${blockedReverse.status}`);

  const aListBlocked = await A('/social/conversations');
  check(
    'Thread hidden from A while blocked',
    Array.isArray(aListBlocked.data) && !aListBlocked.data.some((item: any) => item.id === convId),
    `status=${aListBlocked.status} message=${aListBlocked.message}`,
  );
  const bListBlocked = await B('/social/conversations');
  check(
    'Thread hidden from B while blocked',
    Array.isArray(bListBlocked.data) && !bListBlocked.data.some((item: any) => item.id === convId),
    `status=${bListBlocked.status} message=${bListBlocked.message}`,
  );

  // 7. Unblock restores the thread with history intact.
  await A(`/social/profiles/${meB.id}/block`, { method: 'DELETE' });
  const restored = (await A(`/social/conversations/${convId}`)).data;
  check('Thread returns after unblock', restored.id === convId);
  check('History survived the block', restored.messages.some((m: any) => m.text === token));
  const restoredSend = await A(`/social/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text: `after-unblock-${Date.now()}` }),
  });
  check('Messaging works again after unblock', restoredSend.status === 201, `status=${restoredSend.status}`);

  // 8. A third party is not a member.
  const outsider = await B(`/social/conversations/${'00000000-0000-0000-0000-000000000000'}`);
  check('Unknown conversation is 404', outsider.status === 404, `status=${outsider.status}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
