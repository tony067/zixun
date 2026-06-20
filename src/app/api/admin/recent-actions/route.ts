import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings, counselors } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/** 管理员最近动态 — 从数据库读真实数据 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const actions = [];

    // 最近5条待审核咨询师
    const pendingCounselors = await db
      .select({ id: counselors.id, displayName: counselors.displayName, createdAt: counselors.createdAt })
      .from(counselors)
      .where(eq(counselors.reviewStatus, "submitted"))
      .orderBy(desc(counselors.createdAt))
      .limit(5);

    for (const c of pendingCounselors) {
      actions.push({
        time: timeAgo(c.createdAt),
        text: `咨询师「${c.displayName}」提交入驻申请`,
        href: "/admin/counselors",
        type: "counselor",
        targetId: c.id,
        _ts: c.createdAt,
      });
    }

    // 最近5条订单
    const recentBookings = await db
      .select({ id: bookings.id, status: bookings.status, createdAt: bookings.createdAt })
      .from(bookings)
      .orderBy(desc(bookings.createdAt))
      .limit(5);

    for (const b of recentBookings) {
      const statusText: Record<string, string> = {
        pending_confirmation: "等待咨询师确认",
        pending_payment: "等待来访支付",
        paid: "已支付待咨询",
        completed: "咨询已完成",
        cancelled: "订单已取消",
        rejected: "订单已拒绝",
      };
      actions.push({
        time: timeAgo(b.createdAt),
        text: `订单 #${b.id.slice(-6)} ${statusText[b.status ?? ""] ?? b.status ?? ""}`,
        href: `/admin/orders/${b.id}`,
        type: "order",
        targetId: b.id,
        _ts: b.createdAt,
      });
    }

    // 按时间排序，取最新10条
    actions.sort((a, b) => new Date((b._ts as Date) ?? 0).getTime() - new Date((a._ts as Date) ?? 0).getTime());
    const result = actions.slice(0, 10).map(({ _ts, ...rest }) => rest);

    return NextResponse.json(result);
  } catch (e) {
    console.error("[recent-actions]", e);
    return NextResponse.json([]);
  }
}

function timeAgo(date: Date | string | null): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  const d = Math.floor(hr / 24);
  return `${d}天前`;
}
        time: timeAgo(c.createdAt),
        text: `咨询师「${c.displayName}」提交入驻申请`,
        href: "/admin/counselors",
        type: "counselor",
        targetId: c.id,
        _ts: c.createdAt,
      });
    }

    // 最近5条订单
    const recentBookings = await db
      .select({ id: bookings.id, status: bookings.status, createdAt: bookings.createdAt })
      .from(bookings)
      .orderBy(require("drizzle-orm").desc(bookings.createdAt))
      .limit(5);

    for (const b of recentBookings) {
      const statusText: Record<string, string> = {
        pending_confirmation: "等待咨询师确认",
        pending_payment: "等待来访支付",
        paid: "已支付待咨询",
        completed: "咨询已完成",
        cancelled: "订单已取消",
        rejected: "订单已拒绝",
      };
      actions.push({
        time: timeAgo(b.createdAt),
        text: `订单 #${b.id.slice(-6)} ${statusText[b.status] ?? b.status}`,
        href: `/admin/orders/${b.id}`,
        type: "order",
        targetId: b.id,
        _ts: b.createdAt,
      });
    }

    // 按时间排序，取最新10条
    actions.sort((a, b) => new Date(b._ts ?? 0).getTime() - new Date(a._ts ?? 0).getTime());
    const result = actions.slice(0, 10).map(({ _ts, ...rest }) => rest);

    return NextResponse.json(result);
  } catch (e) {
    console.error("[recent-actions]", e);
    return NextResponse.json([]);
  }
}

function timeAgo(date: Date | string | null): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  const d = Math.floor(hr / 24);
  return `${d}天前`;
}
