import { db } from "@/lib/db/client";
import { services, serviceOrders, counselors, users } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

// ── 商品 ──

/** 上架中的服务列表（来访端浏览，带老师档案信息，供按老师分组展示） */
export async function getActiveServices() {
  const rows = await db.select().from(services).where(eq(services.status, "active")).orderBy(desc(services.createdAt));
  const counselorIds = [...new Set(rows.map(r => r.counselorId))];
  const cs = counselorIds.length
    ? await db.select({
        id: counselors.id, userId: counselors.userId, displayName: counselors.displayName,
        title: counselors.title, avatarUrl: counselors.avatarUrl, bio: counselors.bio,
        counselorTypes: counselors.counselorTypes, specialties: counselors.specialties,
        customSpecialties: counselors.customSpecialties,
      }).from(counselors).where(inArray(counselors.id, counselorIds))
    : [];
  const cmap = new Map(cs.map(c => [c.id, c]));
  return rows.map(r => {
    const c: any = cmap.get(r.counselorId) ?? {};
    return { ...r, counselorName: c.displayName ?? "", counselorTypes: c.counselorTypes ?? null, counselor: c.id ? c : null };
  });
}

export async function getServiceById(id: string) {
  const [r] = await db.select().from(services).where(eq(services.id, id));
  if (!r) return null;
  const [c] = await db.select({
    id: counselors.id, userId: counselors.userId, displayName: counselors.displayName,
    title: counselors.title, avatarUrl: counselors.avatarUrl,
    counselorTypes: counselors.counselorTypes, specialties: counselors.specialties,
  }).from(counselors).where(eq(counselors.id, r.counselorId));
  return { ...r, counselorName: c?.displayName ?? "", counselorTypes: c?.counselorTypes ?? null, counselor: c ?? null };
}

export async function getCounselorServices(counselorId: string) {
  return db.select().from(services).where(eq(services.counselorId, counselorId)).orderBy(desc(services.createdAt));
}

export async function createService(data: typeof services.$inferInsert) {
  const [r] = await db.insert(services).values(data).returning();
  return r;
}

export async function updateService(id: string, counselorId: string, data: Partial<typeof services.$inferInsert>) {
  const [r] = await db.update(services).set(data)
    .where(and(eq(services.id, id), eq(services.counselorId, counselorId)))
    .returning();
  return r ?? null;
}

// ── 订单 ──

export async function createServiceOrder(data: typeof serviceOrders.$inferInsert) {
  const [r] = await db.insert(serviceOrders).values(data).returning();
  return r;
}

export async function getServiceOrderById(id: string) {
  const [r] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id));
  return r ?? null;
}

/** 来访的评估订单 */
export async function getClientServiceOrders(clientId: string) {
  return db.select().from(serviceOrders).where(eq(serviceOrders.clientId, clientId)).orderBy(desc(serviceOrders.createdAt));
}

/** 老师的评估订单（挂自己服务的） */
export async function getCounselorServiceOrders(counselorId: string) {
  return db.select().from(serviceOrders).where(eq(serviceOrders.counselorId, counselorId)).orderBy(desc(serviceOrders.createdAt));
}

/** 管理员/客服：全部评估订单（附来访者名与老师名） */
export async function getAllServiceOrders() {
  return db.select({
    id: serviceOrders.id, serviceId: serviceOrders.serviceId, counselorId: serviceOrders.counselorId,
    clientId: serviceOrders.clientId, serviceName: serviceOrders.serviceName, price: serviceOrders.price,
    status: serviceOrders.status, paymentMethod: serviceOrders.paymentMethod,
    answers: serviceOrders.answers, report: serviceOrders.report,
    reportLink: serviceOrders.reportLink, reportFileUrl: serviceOrders.reportFileUrl,
    questionnaireLink: serviceOrders.questionnaireLink,
    createdAt: serviceOrders.createdAt, paidAt: serviceOrders.paidAt,
    submittedAt: serviceOrders.submittedAt, reportAt: serviceOrders.reportAt,
    clientName: users.name, counselorName: counselors.displayName,
  }).from(serviceOrders)
    .leftJoin(users, eq(serviceOrders.clientId, users.id))
    .leftJoin(counselors, eq(serviceOrders.counselorId, counselors.id))
    .orderBy(desc(serviceOrders.createdAt));
}

/** 客服/管理员确认收款 / 线上支付成功 → paid（幂等：仅 pending_payment 可转） */
export async function markServiceOrderPaid(id: string, paymentMethod?: string) {
  const cur = await getServiceOrderById(id);
  if (!cur || cur.status !== "pending_payment") return null;
  const [r] = await db.update(serviceOrders).set({
    status: "paid",
    paidAt: new Date(),
    ...(paymentMethod ? { paymentMethod } : {}),
  }).where(eq(serviceOrders.id, id)).returning();
  return r;
}

/** 来访提交答卷 → submitted */
export async function submitServiceAnswers(id: string, clientId: string, answers: unknown) {
  const cur = await getServiceOrderById(id);
  if (!cur || cur.clientId !== clientId) return null;
  if (cur.status !== "paid") return { error: "invalid_status" } as const;
  const [r] = await db.update(serviceOrders).set({
    answers: answers as any,
    status: "submitted",
    submittedAt: new Date(),
  }).where(eq(serviceOrders.id, id)).returning();
  return r;
}

/** 老师发布报告 → completed（文本报告 + 可选外链/文件） */
export async function saveServiceReport(id: string, counselorId: string, report: string, extra?: { reportLink?: string | null; reportFileUrl?: string | null }) {
  const cur = await getServiceOrderById(id);
  if (!cur || cur.counselorId !== counselorId) return null;
  if (cur.status !== "submitted") return { error: "invalid_status" } as const;
  const [r] = await db.update(serviceOrders).set({
    report,
    reportAt: new Date(),
    status: "completed",
    ...(extra?.reportLink !== undefined ? { reportLink: extra.reportLink || null } : {}),
    ...(extra?.reportFileUrl !== undefined ? { reportFileUrl: extra.reportFileUrl || null } : {}),
  }).where(eq(serviceOrders.id, id)).returning();
  return r;
}

/** 老师针对订单发送/更新问卷链接（外链问卷场景），并记录通知 */
export async function setOrderQuestionnaireLink(id: string, counselorId: string, link: string) {
  const cur = await getServiceOrderById(id);
  if (!cur || cur.counselorId !== counselorId) return null;
  if (!["pending_payment", "paid"].includes(cur.status)) return { error: "invalid_status" } as const;
  const [r] = await db.update(serviceOrders).set({ questionnaireLink: link }).where(eq(serviceOrders.id, id)).returning();
  return r;
}

/** 退款（管理员/客服；老师仅限未开始作答前） */
export async function refundServiceOrder(id: string) {
  const cur = await getServiceOrderById(id);
  if (!cur) return null;
  if (!["pending_payment", "paid"].includes(cur.status)) return { error: "invalid_status" } as const;
  const [r] = await db.update(serviceOrders).set({ status: "refunded" }).where(eq(serviceOrders.id, id)).returning();
  return r;
}

/** 来访取消待支付订单 */
export async function cancelServiceOrder(id: string, clientId: string) {
  const cur = await getServiceOrderById(id);
  if (!cur || cur.clientId !== clientId) return null;
  if (cur.status !== "pending_payment") return { error: "invalid_status" } as const;
  const [r] = await db.update(serviceOrders).set({ status: "cancelled" }).where(eq(serviceOrders.id, id)).returning();
  return r;
}
