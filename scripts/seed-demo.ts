import { db } from '@/lib/db/client';
import { counselors } from '@/lib/db/schema/counselors';
import { bookings } from '@/lib/db/schema/scheduling';
import { eq } from 'drizzle-orm';

const MY_USER_ID = "69ff23aac0eda4d310fe2139";
const COUNSELOR_ID = "demo-counselor-qiujing";

async function main() {
  // 1. 确保咨询师档案存在（用你自己的 userId）
  const existing = await db.select().from(counselors).where(eq(counselors.userId, MY_USER_ID)).limit(1);
  
  if (existing.length === 0) {
    await db.insert(counselors).values({
      id: COUNSELOR_ID,
      userId: MY_USER_ID,
      displayName: "邱婧",
      counselorTypes: ["心理咨询师"],
      bio: "专注于神经多样性人群的心理支持，擅长 ADHD、焦虑、人际关系等议题。",
      tagline: "与你一起，找到属于自己的节奏。",
      specializations: ["ADHD", "焦虑", "人际关系", "自我成长"],
      workingGroups: ["成人", "青少年", "神经多样性"],
      approaches: ["认知行为疗法", "正念疗法", "叙事疗法"],
      sessionModes: ["视频", "面谈"],
      sessionDuration: 50,
      pricePerSession: 350,
      isAccepting: true,
      isSupervisor: false,
      reviewStatus: "pending",
      region: "广东·广州",
    }).onConflictDoNothing();
    console.log("✅ 咨询师档案已创建（待审核状态）");
  } else {
    const c = existing[0];
    // 更新为 pending 状态方便测试审核
    await db.update(counselors).set({ reviewStatus: "pending" }).where(eq(counselors.userId, MY_USER_ID));
    console.log("✅ 咨询师档案已更新为待审核状态，id:", c.id);
  }

  // 2. 拿到实际 counselorId
  const [counselor] = await db.select().from(counselors).where(eq(counselors.userId, MY_USER_ID)).limit(1);
  const counselorId = counselor.id;

  // 3. 插入三条不同状态的预约订单（来访是自己，咨询师也是自己）
  const now = new Date();
  const future3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const future7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 待确认订单
  await db.insert(bookings).values({
    id: "demo-bk-pending-001",
    clientId: MY_USER_ID,
    counselorId: counselorId,
    sessionMode: "视频",
    scheduledAt: future7,
    durationMinutes: 50,
    priceAmount: 350,
    status: "pending",
    sessionNumber: 1,
    applicationForm: JSON.stringify({
      reason: "最近工作压力很大，经常焦虑睡不着，想找人聊聊。",
      expectation: "希望能找到缓解焦虑的方法",
      emergencyName: "张先生",
      emergencyPhone: "13800138001",
    }),
    createdAt: now,
  }).onConflictDoNothing();

  // 待支付订单
  await db.insert(bookings).values({
    id: "demo-bk-confirmed-002",
    clientId: MY_USER_ID,
    counselorId: counselorId,
    sessionMode: "视频",
    scheduledAt: future3,
    durationMinutes: 50,
    priceAmount: 350,
    status: "confirmed",
    sessionNumber: 2,
    applicationForm: JSON.stringify({
      reason: "第二次咨询，继续探讨人际关系问题。",
      emergencyName: "张先生",
      emergencyPhone: "13800138001",
    }),
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
  }).onConflictDoNothing();

  // 已完成订单
  await db.insert(bookings).values({
    id: "demo-bk-completed-003",
    clientId: MY_USER_ID,
    counselorId: counselorId,
    sessionMode: "面谈",
    scheduledAt: past7,
    durationMinutes: 50,
    priceAmount: 350,
    status: "completed",
    sessionNumber: 3,
    applicationForm: JSON.stringify({
      reason: "第三次咨询，主题：自我认知。",
      emergencyName: "张先生",
      emergencyPhone: "13800138001",
    }),
    createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    paidAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
    paymentMethod: "微信支付",
  }).onConflictDoNothing();

  console.log("✅ 三条模拟预约订单已创建：待确认 / 待支付 / 已完成");
  console.log("👤 来访端：我的 → 可以看到这三条订单");
  console.log("🧑‍⚕️ 咨询师端：预约管理 → 可以确认/处理订单");
  console.log("🛠 管理员端：审核 → 可以审核咨询师档案；订单管理 → 可以看到这三条");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
