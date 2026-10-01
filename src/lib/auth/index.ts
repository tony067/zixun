/**
 * 服务端认证工具 — 替换 @eazo/sdk/server 的 requireAuth
 *
 * 读取 request header: Authorization: Bearer <jwt>
 * 用 jose 验证签名，返回 { ok: true, user } 或 { ok: false, response }
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
}

export interface AuthResult {
  ok: true;
  user: User;
}

export interface AuthError {
  ok: false;
  response: NextResponse;
}

export async function requireAuth(req: NextRequest): Promise<AuthResult | AuthError> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
    };
  }

  return {
    ok: true,
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.avatarUrl,
      role: payload.role,
    },
  };
}

/** 管理员专用鉴权：登录 + role === "admin"（客服 support 不放行） */
export async function requireAdmin(req: NextRequest): Promise<AuthResult | AuthError> {
  const r = await requireAuth(req);
  if (!r.ok) return r;
  if (r.user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return r;
}

/** 管理员或客服鉴权：用于订单促进类接口（标记已支付/退款等） */
export async function requireStaff(req: NextRequest): Promise<AuthResult | AuthError> {
  const r = await requireAuth(req);
  if (!r.ok) return r;
  if (r.user.role !== "admin" && r.user.role !== "support") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return r;
}
