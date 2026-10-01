import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getServiceOrderById, markServiceOrderPaid, submitServiceAnswers,
  saveServiceReport, refundServiceOrder, cancelServiceOrder, getServiceById,
  setOrderQuestionnaireLink,
} from "@/lib/db/queries/services";
import { getCounselorByUserId } from "@/lib/db/queries/counselors";
import { notifyUser } from "@/lib/notifications/notify";

/** 订单详情：本人 / 挂靠老师 / 管理员客服 可见 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  const order = await getServiceOrderById(id);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const role = r.user.role;
  let allowed = order.clientId === r.user.id || role === "admin" || role === "support";
  if (!allowed) {
    const c = await getCounselorByUserId(r.user.id);
    if (c && c.id === order.counselorId) allowed = true;
  }
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // 报告仅完成状态对来访可见；老师/管理员随时可见
  const isStaff = allowed && order.clientId !== r.user.id;
  const service = await getServiceById(order.serviceId).catch(() => null);
  const visibleReport = order.status === "completed" || isStaff ? order.report : null;
  // 问卷链接：订单级（老师发送）优先，其次服务级默认链接；仅待作答及之后展示
  const questionnaireLink = ["paid", "submitted", "completed"].includes(order.status)
    ? (order.questionnaireLink ?? service?.questionnaireLink ?? null)
    : null;
  const reportExtras = order.status === "completed" || isStaff
    ? { reportLink: order.reportLink, reportFileUrl: order.reportFileUrl }
    : { reportLink: null, reportFileUrl: null };
  // 老师档案（来访端展示 + 联系老师）
  const { getCounselorById } = await import("@/lib/db/queries/counselors");
  const counselor = await getCounselorById(order.counselorId).catch(() => null);
  return NextResponse.json({
    ...order,
    report: visibleReport,
    ...reportExtras,
    questionnaireLink,
    questions: service?.questions ?? [],
    counselor: counselor ? {
      id: counselor.id, userId: counselor.userId, displayName: counselor.displayName,
      title: counselor.title, avatarUrl: counselor.avatarUrl, counselorTypes: counselor.counselorTypes,
    } : null,
  });
}

/**
 * 状态流转：
 * - client: 提交答卷 paid→submitted；取消待支付 pending_payment→cancelled
 * - counselor（挂靠老师）/staff: 确认收款 pending_payment→paid；写报告 submitted→completed；退款 pending_payment/paid→refunded
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  const body = await req.json();
  const { action, answers, report } = body;

  const order = await getServiceOrderById(id);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const role = r.user.role;
  const isClient = order.clientId === r.user.id;
  let isCounselor = false;
  if (role !== "admin" && role !== "support") {
    const c = await getCounselorByUserId(r.user.id);
    isCounselor = !!c && c.id === order.counselorId;
  }
  const isStaff = role === "admin" || role === "support";

  if (action === "pay") {
    // 线上补支付（来访）
    if (!isClient) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const updated = await markServiceOrderPaid(id, String(body.paymentMethod ?? "online"));
    if (!updated) return NextResponse.json({ error: "invalid_status" }, { status: 409 });
    return NextResponse.json(updated);
  }

  if (action === "confirm_paid") {
    // 确认收到转账（管理员/客服/挂靠老师）
    if (!isStaff && !isCounselor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const updated = await markServiceOrderPaid(id);
    if (!updated) return NextResponse.json({ error: "invalid_status" }, { status: 409 });
    try {
      await notifyUser({
        userId: order.clientId, title: "评估服务已开通",
        body: `「${order.serviceName}」的转账已确认，你现在可以开始填写评估问卷了。`,
        data: { type: "service_paid", orderId: order.id },
      });
    } catch {}
    return NextResponse.json(updated);
  }

  if (action === "submit") {
    // 提交答卷（来访本人）：拦截空答卷
    if (!isClient) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "答卷不能为空" }, { status: 400 });
    }
    const res = await submitServiceAnswers(id, r.user.id, answers);
    if (!res) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: 409 });
    // 通知老师写报告
    try {
      const service = await getServiceById(order.serviceId);
      if (service?.counselor?.userId) {
        await notifyUser({
          userId: service.counselor.userId, title: "评估问卷已提交",
          body: `${r.user.name || r.user.email?.split("@")[0] || "来访"} 已完成「${order.serviceName}」的问卷，请查看答卷并撰写评估报告。`,
          data: { type: "service_submitted", orderId: order.id },
        });
      }
    } catch {}
    return NextResponse.json(res);
  }

  if (action === "set_link") {
    // 老师针对该订单发送/更新问卷链接（外链问卷场景）
    if (!isCounselor && !isStaff) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const link = String(body.link ?? "").trim();
    if (!link || !/^https?:\/\//.test(link)) return NextResponse.json({ error: "invalid_link" }, { status: 400 });
    const res = await setOrderQuestionnaireLink(id, order.counselorId, link);
    if (!res) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: 409 });
    try {
      await notifyUser({
        userId: order.clientId, title: "评估问卷链接已发送",
        body: `老师已为你的「${order.serviceName}」发送问卷链接，请前往订单打开链接完成填写。`,
        data: { type: "service_link_sent", orderId: order.id },
      });
    } catch {}
    return NextResponse.json(res);
  }

  if (action === "report") {
    // 发布报告（挂靠老师）：文本报告 + 可选报告外链/文件
    if (!isCounselor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const reportText = typeof report === "string" ? report.trim() : "";
    const reportLink = typeof body.reportLink === "string" ? body.reportLink.trim() : "";
    const reportFileUrl = typeof body.reportFileUrl === "string" ? body.reportFileUrl.trim() : "";
    if (!reportText && !reportLink && !reportFileUrl) {
      return NextResponse.json({ error: "请填写报告内容、链接或上传文件" }, { status: 400 });
    }
    const res = await saveServiceReport(id, order.counselorId, reportText, { reportLink, reportFileUrl });
    if (!res) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: 409 });
    try {
      await notifyUser({
        userId: order.clientId, title: "评估报告已生成",
        body: `「${order.serviceName}」的评估报告已完成，请前往查看。`,
        data: { type: "service_report_ready", orderId: order.id },
      });
    } catch {}
    return NextResponse.json(res);
  }

  if (action === "refund") {
    // 退款：管理员/客服任意阶段（paid 前）；挂靠老师仅限作答前
    if (!isStaff && !isCounselor) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (isCounselor && !isStaff && !["pending_payment", "paid"].includes(order.status)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const res = await refundServiceOrder(id);
    if (!res) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: 409 });
    try {
      await notifyUser({
        userId: order.clientId, title: "评估订单已退款",
        body: `「${order.serviceName}」的订单已退款，费用将原路退回（模拟支付，未实际扣款）。`,
        data: { type: "service_refunded", orderId: order.id },
      });
    } catch {}
    return NextResponse.json(res);
  }

  if (action === "cancel") {
    if (!isClient) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const res = await cancelServiceOrder(id, r.user.id);
    if (!res) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: 409 });
    return NextResponse.json(res);
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
