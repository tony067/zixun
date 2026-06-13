import { db } from '@/lib/db/client';
import { counselors } from '@/lib/db/schema/counselors';
import { bookings } from '@/lib/db/schema/scheduling';
import { eq } from 'drizzle-orm';

async function main() {
  const cs = await db.select().from(counselors).where(eq(counselors.id, 'c_10fe2139_mpqmu5k6'));
  const c = cs[0];
  if (c) {
    console.log("counselor reviewStatus:", c.reviewStatus);
    console.log("qualifications:", JSON.stringify(c.qualifications));
    console.log("education:", JSON.stringify(c.education));
    console.log("trainings:", JSON.stringify(c.trainings));
  }
  const bks = await db.select({ id: bookings.id, status: bookings.status, clientId: bookings.clientId, counselorId: bookings.counselorId })
    .from(bookings)
    .where(eq(bookings.counselorId, c?.id ?? ''));
  console.log("bookings:", JSON.stringify(bks));
  process.exit(0);
}
main();
