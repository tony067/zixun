import { type NextRequest, NextResponse } from "next/server";

/** Scheduled job — disabled in standalone mode */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  return NextResponse.json({ ok: true, message: "Notifications not configured in standalone mode" });
}
