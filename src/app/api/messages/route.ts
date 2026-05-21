import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserConversations, getOrCreateConversation } from "@/lib/db/queries/messages";

export async function GET(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const convs = await getUserConversations(r.user.id);
  return NextResponse.json(convs);
}

export async function POST(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const { otherUserId } = await req.json();
  const conv = await getOrCreateConversation(r.user.id, otherUserId);
  return NextResponse.json(conv);
}
