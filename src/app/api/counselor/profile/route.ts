import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notifyAdminNewCounselorApplication } from "@/lib/notifications/notify";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const rows = await db.select().from(counselors).where(eq(counselors.userId, userId)).limit(1);
  if (rows.length === 0) {
    // 返回空档案
    return NextResponse.json({ exists: false, profile: null });
  }
  return NextResponse.json({ exists: true, profile: rows[0] });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const body = await request.json();
  const { action, ...fields } = body; // action: 'save' | 'submit'

  const existing = await db.select({ id: counselors.id })
    .from(counselors).where(eq(counselors.userId, userId)).limit(1);

  const now = new Date().toISOString();
  const newStatus = action === "submit" ? "pending" : (fields.reviewStatus ?? "draft");

  const data = {
    displayName:        fields.displayName ?? "",
    bio:                fields.bio ?? "",
    tagline:            fields.tagline ?? "",
    location:           fields.location ?? "",
    totalHours:         fields.totalHours ? parseInt(fields.totalHours) : 0,
    avatarUrl:          fields.avatarUrl ?? "",
    counselorTypes:     fields.counselorTypes ?? [],
    isSupervisor:       fields.isSupervisor ?? false,
    specialties:        fields.specialties ?? [],
    customSpecialties:  fields.customSpecialties ?? [],
    workingGroups:      fields.workingGroups ?? [],
    customWorkingGroups: fields.customWorkingGroups ?? [],
    approaches:         fields.approaches ?? [],
    customApproaches:   fields.customApproaches ?? [],
    sessionModes:       fields.sessionModes ?? [],
    sessionDuration:    fields.sessionDuration ? parseInt(fields.sessionDuration) : 50,
    pricePerSession:    fields.pricePerSession ? parseInt(fields.pricePerSession) : 0,
    languages:          fields.languages ?? [],
    sessionDescription: fields.sessionDescription ?? "",
    qualifications:     (fields.qualifications ?? []).map((x: unknown) =>
                          typeof x === "string" ? x : JSON.stringify(x)),
    education:          (fields.education ?? []).map((x: unknown) =>
                          typeof x === "string" ? x : JSON.stringify(x)),
    trainings:          (fields.trainings ?? []).map((x: unknown) =>
                          typeof x === "string" ? x : JSON.stringify(x)),
    workExperiences:    (fields.workExperiences ?? []).map((x: unknown) =>
                          typeof x === "string" ? x : JSON.stringify(x)),
    reviewStatus:       newStatus,
  };

  if (existing.length === 0) {
    const id = `c_${userId.slice(-8)}_${Date.now()}`;
    await db.insert(counselors).values({ id, userId, ...data });
    const rows = await db.select().from(counselors).where(eq(counselors.userId, userId)).limit(1);
    // 提交审核时通知管理员
    if (action === "submit") {
      try {
        await notifyAdminNewCounselorApplication({
          adminUserId: "admin",
          counselorName: fields.displayName || "咨询师",
          counselorId: id,
        });
      } catch (e) { console.error("[notify admin]", e); }
    }
    return NextResponse.json({ profile: rows[0] }, { status: 201 });
  } else {
    await db.update(counselors).set(data).where(eq(counselors.userId, userId));
    const rows = await db.select().from(counselors).where(eq(counselors.userId, userId)).limit(1);
    // 提交审核时通知管理员
    if (action === "submit" && rows[0]) {
      try {
        await notifyAdminNewCounselorApplication({
          adminUserId: "admin",
          counselorName: fields.displayName || "咨询师",
          counselorId: rows[0].id,
        });
      } catch (e) { console.error("[notify admin]", e); }
    }
    return NextResponse.json({ profile: rows[0] });
  }
}
