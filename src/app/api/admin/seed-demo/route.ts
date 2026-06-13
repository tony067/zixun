import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  // 只允许带特定 header 调用（防止误触）
  const secret = req.headers.get("x-seed-secret");
  if (secret !== "mindpace-seed-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    // 1. 找到当前登录用户的 counselor 档案，设为 pending（等待审核）
    const allCounselors = await db.select().from(counselors).limit(20);
    let targetCounselor = allCounselors.find(c => c.reviewStatus !== "approved") ?? allCounselors[0];

    if (targetCounselor) {
      await db.update(counselors).set({
        reviewStatus: "pending",
        displayName: targetCounselor.displayName || "邱婧",
        bio: "我是一名专注于神经多样性咨询的心理咨询师，擅长 ADHD、自闭症谱系、焦虑等议题。",
        tagline: "温和、专业、以人为本",
        specialties: ["ADHD", "焦虑", "情绪管理", "自我认知"],
        workingGroups: ["成人", "青少年", "神经多样性人群"],
        counselorTypes: ["心理咨询师"],
        pricePerSession: 600,
        sessionDuration: 50,
        sessionModes: ["视频咨询", "面对面咨询"],
        isAccepting: true,
      }).where(eq(counselors.id, targetCounselor.id));
    }

    // 2. 插入三条示范订单（覆盖三种状态）
    const now = new Date();
    const d1 = new Date(now); d1.setDate(now.getDate() + 3);
    const d2 = new Date(now); d2.setDate(now.getDate() + 7);
    const d3 = new Date(now); d3.setDate(now.getDate() - 7);

    const userId = targetCounselor?.userId ?? "";
    const counselorId = targetCounselor?.id ?? "";

    const existingBookings = await db.select({ id: bookings.id }).from(bookings)
      .where(eq(bookings.counselorId, counselorId));

    if (existingBookings.length === 0 && userId && counselorId) {
      await db.insert(bookings).values([
        {
          id: `demo_bk_001_${Date.now()}`,
          clientId: userId,
          counselorId,
          status: "pending",
          scheduledAt: d1,
          sessionMode: "视频咨询",
          sessionDuration: 50,
          priceAtBooking: 600,
          sessionNumber: 1,
          applicationForm: JSON.stringify({
            name: "邱婧", phone: "138xxxxxxxx",
            reason: "希望通过咨询更好地了解自己",
            concerns: ["情绪管理", "人际关系"],
            safetyAssessment: { q1: false, q2: false, q3: false, q4: false, q5: false },
          }),
          agreementSigned: true,
          emergencyContactName: "紧急联系人",
          emergencyContactPhone: "139xxxxxxxx",
          createdAt: now,
        },
        {
          id: `demo_bk_002_${Date.now() + 1}`,
          clientId: userId,
          counselorId,
          status: "confirmed",
          scheduledAt: d2,
          sessionMode: "视频咨询",
          sessionDuration: 50,
          priceAtBooking: 600,
          sessionNumber: 2,
          applicationForm: JSON.stringify({ name: "邱婧", reason: "第二次咨询" }),
          agreementSigned: true,
          emergencyContactName: "紧急联系人",
          emergencyContactPhone: "139xxxxxxxx",
          createdAt: new Date(now.getTime() - 86400000 * 3),
        },
        {
          id: `demo_bk_003_${Date.now() + 2}`,
          clientId: userId,
          counselorId,
          status: "completed",
          scheduledAt: d3,
          sessionMode: "视频咨询",
          sessionDuration: 50,
          priceAtBooking: 600,
          sessionNumber: 1,
          applicationForm: JSON.stringify({ name: "邱婧", reason: "初次咨询" }),
          agreementSigned: true,
          emergencyContactName: "紧急联系人",
          emergencyContactPhone: "139xxxxxxxx",
          createdAt: new Date(now.getTime() - 86400000 * 10),
          paidAt: new Date(now.getTime() - 86400000 * 10),
          paymentMethod: "微信支付",
        },
      ]);
    }

    return NextResponse.json({
      ok: true,
      counselorId,
      userId,
      message: "模拟数据写入成功：1条待审核档案 + 3条订单（待确认/待支付/已完成）",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
