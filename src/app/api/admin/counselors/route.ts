import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const rows = await db.select().from(counselors).where(eq(counselors.reviewStatus, status));
  return NextResponse.json(rows);
}
