import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { users } from "@/lib/db/schema/users";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const [b] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [client] = await db.select({ id: users.id, name: users.name, email: users.email })
    .from(users).where(eq(users.id, b.clientId));
  const [counselor] = await db.select({ id: counselors.id, displayName: counselors.displayName })
    .from(counselors).where(eq(counselors.id, b.counselorId));
  return NextResponse.json({ booking: { ...b, client: client ?? null, counselor: counselor ?? null } });
}
