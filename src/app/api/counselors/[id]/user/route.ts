import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c] = await db.select({ userId: counselors.userId }).from(counselors).where(eq(counselors.id, id));
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ userId: c.userId });
}
