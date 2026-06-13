import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema/users';
import { desc } from 'drizzle-orm';

async function main() {
  const rows = await db.select({ id: users.id, email: users.email, name: users.name }).from(users).orderBy(desc(users.createdAt)).limit(10);
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
main();
