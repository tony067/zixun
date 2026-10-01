import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";

/** staff 进入订单管理页时调用：记录查看时间，之后「新增订单」红点归零 */
export async function PATCH(req: NextRequest) {
  const r = await requireStaff(req);
  if (!r.ok) return r.response;
  await db.update(users)
    .set({ ordersLastSeenAt: new Date() })
    .where(eq(users.id, r.user.id));
  return NextResponse.json({ ok: true });
}
