import { db } from '@/lib/db/client';
import { bookings } from '@/lib/db/schema/scheduling';
import { counselors } from '@/lib/db/schema/counselors';
import { eq } from 'drizzle-orm';

async function main() {
  const MY_USER_ID = "69ff23aac0eda4d310fe2139";
  
  const bks = await db.select({ id: bookings.id, status: bookings.status, clientId: bookings.clientId, counselorId: bookings.counselorId }).from(bookings).where(eq(bookings.clientId, MY_USER_ID));
  console.log("订单（clientId匹配）:", JSON.stringify(bks, null, 2));

  const bks2 = await db.select({ id: bookings.id, status: bookings.status, clientId: bookings.clientId, counselorId: bookings.counselorId }).from(bookings).limit(10);
  console.log("所有订单前10条:", JSON.stringify(bks2, null, 2));

  const cs = await db.select({ id: counselors.id, userId: counselors.userId, displayName: counselors.displayName, reviewStatus: counselors.reviewStatus }).from(counselors).limit(10);
  console.log("咨询师:", JSON.stringify(cs, null, 2));
  
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
