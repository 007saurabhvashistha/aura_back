import { getDb } from './src/db/client.js';
import { users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

const db = getDb();
if (!db) {
  console.error('Database not available');
  process.exit(1);
}

await db
  .update(users)
  .set({ role: 'admin' })
  .where(eq(users.email, 'admin@test.com'));

console.log('User updated to admin role');
process.exit(0);
