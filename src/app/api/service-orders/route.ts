import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createServiceOrder, getClientServiceOrders, getCounselorServiceOrders,
  getAllServiceOrders, getServiceById, markServiceOrderPaid,
} from "@/lib/db/queries/services";
import { getCounselorByUserId } from "@/lib/db/queries/counselors";
import { notifyUser } from "@/lib/notifications/notify";

/** 下单（来访购买个性服务） */
export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const body = await req.json();
  const { serviceId, paymentMethod, offline } = body;
  if (!serviceId || !paymentMethod) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const service = await getServiceById(String(serviceId));
  if (!service || service.status !== "active") {
    return NextResponse.json({ error: "service_not_found" }, { status: 404 });
  }

  // 线上支付直接生效；线下转账先落待支付，由客服/管理员确认收款
  const isOffline = offline === true;
  const order = await createServiceOrder({
    id: `so_${Date.now()}`,
    serviceId: service.id,
    counselorId: service.counselorId,
    clientId: r.user.id,
    price: Number(service.price) || 0,
    status: isOffline ? "pending_payment" : "paid",
    ...(isOffline ? {} : { paidAt: new Date() }),
    paymentMethod: String(paymentMethod),
    serviceName: service.name,
  });

  // 通知老师有新订单（待支付也提醒，便于跟进转账）
  try {
    if (service.counselor?.userId) {
      await notifyUser({
        userId: service.counselor.userId,
        title: isOffline ? "新评估服务订单（待支付）" : "新评估服务订单",
        body: `${r.user.name || r.user.email?.split("@")[0] || "来访"} 购买了「${service.name}」${isOffline ? "，已选择线下转账，确认收款后即可填写" : ""}。`,
        data: { type: "new_service_order", orderId: order.id },
      });
    }
  } catch (e) { console.error("[notify service order]", e); }

  return NextResponse.json(order, { status: 201 });
}

/** 订单列表：来访=自己的单；老师=挂自己服务的单 + 自己购买的单；管理员/客服=全部 */
export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const role = r.user.role;
  if (role === "admin" || role === "support") {
    return NextResponse.json(await getAllServiceOrders());
  }
  const c = await getCounselorByUserId(r.user.id);
  if (c) {
    // 老师也可能自己购买别人的服务：合并"挂自己服务的单"与"自己买的单"
    const [asCounselor, asClient] = await Promise.all([
      getCounselorServiceOrders(c.id),
      getClientServiceOrders(r.user.id),
    ]);
    const seen = new Set(asCounselor.map(o => o.id));
    return NextResponse.json([...asCounselor, ...asClient.filter(o => !seen.has(o.id))]);
  }
  return NextResponse.json(await getClientServiceOrders(r.user.id));
}
