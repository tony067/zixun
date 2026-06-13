// Re-export Eazo SDK's requireAuth for use in API routes
export { requireAuth } from "@eazo/sdk/server";
export type { User } from "@eazo/sdk/server";

import { NextResponse } from "next/server";

export interface AuthResult {
  ok: true;
  user: { id: string; email: string; name?: string; avatarUrl?: string };
}

export interface AuthError {
  ok: false;
  response: NextResponse;
}
