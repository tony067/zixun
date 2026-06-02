import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const { action } = await req.json();
  const newStatus = action === "approve" ? "active" : action === "reject" ? "rejected" : "inactive";
  await db.update(counselors).set({ status: newStatus }).where(eq(counselors.id, id));
  return NextResponse.json({ ok: true });
}
