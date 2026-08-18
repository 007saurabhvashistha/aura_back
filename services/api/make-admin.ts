import { getDb } from './src/db/client.js';
import { users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

const db = getDb();
if (!db) {
  console.error('Database not available');
  process.exit(1);
}

const email = process.argv[2] || 'admin@test.com';

await db
  .update(users)
  .set({ role: 'admin' })
  .where(eq(users.email, email));

console.log(`User ${email} updated to admin role`);
process.exit(0);
