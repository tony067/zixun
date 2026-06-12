import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthResult {
  ok: true;
  user: User;
}

export interface AuthError {
  ok: false;
  response: NextResponse;
}

const JWT_SECRET = process.env.JWT_SECRET || "mindpace-secret-key-2026";

export async function requireAuth(req: NextRequest): Promise<AuthResult | AuthError> {
  const token =
    req.headers.get("x-session-token") ||
    req.headers.get("x-eazo-session") ||
    req.cookies.get("session_token")?.value;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return {
      ok: true,
      user: {
        id: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string | undefined,
        avatarUrl: payload.avatarUrl as string | undefined,
      },
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}

export async function signToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new jose.SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}
