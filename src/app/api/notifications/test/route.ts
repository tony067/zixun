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

/**
 * Publishes a push to every subscriber of this app, body composed from
 * the caller's pending todos. v1 `audience: "subscribers"` broadcasts —
 * other subscribers receive the same caller-derived text. Acceptable for
 * dogfooding (caller is usually the only subscriber); switch to
 * per-recipient publishing when the platform exposes it.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const userTodos = await getTodos(auth.user.id);
  const pending = userTodos.filter((t) => !t.completed);
  const completedCount = userTodos.filter((t) => t.completed).length;
  // getTodos returns DESC by createdAt; oldest pending sits at the tail.
  const oldestPending = pending[pending.length - 1];
  const callerLabel =
    auth.user.name?.trim() || auth.user.email?.split("@")[0] || "there";

  let title: string;
  let body: string;
  if (pending.length === 0) {
    title = `All caught up, ${callerLabel} 🎉`;
    body =
      completedCount > 0
        ? `${completedCount} task${completedCount === 1 ? "" : "s"} done — add the next thing on your mind.`
        : "No pending tasks yet. Add one to get started.";
  } else if (pending.length === 1 && oldestPending) {
    title = "1 task waiting for you";
    body = `Don't forget: "${truncate(oldestPending.title, 80)}"`;
  } else if (oldestPending) {
    title = `${pending.length} tasks waiting for you`;
    body = `Oldest still open: "${truncate(oldestPending.title, 64)}"`;
  } else {
    title = `${pending.length} tasks waiting for you`;
    body = "Tap to review your list.";
  }

  try {
    const result = await notifications.publish({
      title,
      body,
      data: {
        source: "test-button",
        triggeredByUserId: auth.user.id,
        pendingCount: pending.length,
        completedCount,
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof EazoNotificationPublishError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.code >= 400 && err.code < 600 ? err.code : 500 },
      );
    }
    console.error("[notifications/test] unexpected error", err);
    return NextResponse.json({ error: "publish failed" }, { status: 500 });
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}
