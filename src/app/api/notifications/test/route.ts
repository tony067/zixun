import { type NextRequest, NextResponse } from "next/server";
import { notifications, EazoNotificationPublishError } from "@eazo/sdk/server";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const callerLabel = auth.user.name?.trim() || auth.user.email?.split("@")[0] || "there";
  try {
    const result = await notifications.publish({
      title: `MindPace 提醒 🌿`,
      body: `Hi ${callerLabel}，记得查看你的最新预约安排。`,
      audience: "subscribers",
      data: {},
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof EazoNotificationPublishError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 500 });
    }
    return NextResponse.json({ error: "publish failed" }, { status: 500 });
  }
}
