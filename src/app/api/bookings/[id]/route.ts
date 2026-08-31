import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { counselors } from "@/lib/db/schema/counselors";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;

  const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  // 权限：来访者本人或咨询师本人或管理员可看
  const isOwner = row.clientId === r.user.id;
  let isCounselor = false;
  if (!isOwner && row.counselorId) {
    const [c] = await db.select().from(counselors).where(eq(counselors.id, row.counselorId));
    isCounselor = c?.userId === r.user.id;
  }
  const isAdmin = r.user.role === "admin";
  if (!isOwner && !isCounselor && !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 关联咨询师信息
  let counselorInfo: any = null;
  if (row.counselorId) {
    const [c] = await db.select().from(counselors).where(eq(counselors.id, row.counselorId));
    if (c) {
      counselorInfo = {
        id: c.id,
        displayName: c.displayName,
        avatarUrl: c.avatarUrl,
        counselorTypes: c.counselorTypes,
      };
    }
  }

  return NextResponse.json({
    id: row.id,
    status: row.status,
    scheduledAt: row.scheduledAt,
    durationMinutes: row.durationMinutes ?? 50,
    sessionMode: row.sessionMode ?? "video",
    priceAmount: row.priceAmount ?? 0,
    sessionNumber: row.sessionNumber ?? 1,
    applicationForm: row.applicationForm,
    agreementSigned: row.agreementSigned,
    createdAt: row.createdAt,
    clientNote: row.clientNote,
    counselor: counselorInfo,
  });
}
