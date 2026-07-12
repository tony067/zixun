import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema/counselors";
import { userFavoriteCounselors } from "@/lib/db/schema/favorites";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const rows = await db
    .select({
      id: counselors.id,
      displayName: counselors.displayName,
      title: counselors.title,
      bio: counselors.bio,
      specialties: counselors.specialties,
      counselorTypes: counselors.counselorTypes,
      isSupervisor: counselors.isSupervisor,
      sessionModes: counselors.sessionModes,
      sessionDuration: counselors.sessionDuration,
      pricePerSession: counselors.pricePerSession,
      isAccepting: counselors.isAccepting,
      totalHours: counselors.totalHours,
      rating: counselors.rating,
      location: counselors.location,
      avatarUrl: counselors.avatarUrl,
      favoritedAt: userFavoriteCounselors.createdAt,
    })
    .from(userFavoriteCounselors)
    .innerJoin(counselors, eq(userFavoriteCounselors.counselorId, counselors.id))
    .where(eq(userFavoriteCounselors.userId, auth.user.id))
    .orderBy(desc(userFavoriteCounselors.createdAt));

  return NextResponse.json({ counselors: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { counselorId } = await req.json();
  if (!counselorId || typeof counselorId !== "string") {
    return NextResponse.json({ error: "counselorId is required" }, { status: 400 });
  }

  const [counselor] = await db
    .select({ id: counselors.id })
    .from(counselors)
    .where(eq(counselors.id, counselorId));
  if (!counselor) {
    return NextResponse.json({ error: "Counselor not found" }, { status: 404 });
  }

  await db
    .insert(userFavoriteCounselors)
    .values({ userId: auth.user.id, counselorId })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { counselorId } = await req.json();
  if (!counselorId || typeof counselorId !== "string") {
    return NextResponse.json({ error: "counselorId is required" }, { status: 400 });
  }

  await db
    .delete(userFavoriteCounselors)
    .where(
      and(
        eq(userFavoriteCounselors.userId, auth.user.id),
        eq(userFavoriteCounselors.counselorId, counselorId),
      ),
    );

  return NextResponse.json({ ok: true });
}
