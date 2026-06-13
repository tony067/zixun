/**
 * JWT 工具层 — 使用 jose 库，无任何 Eazo 平台依赖
 * 签发和验证 HS256 JWT，payload 固定为 { sub, email, name, avatarUrl }
 */
import { SignJWT, jwtVerify } from "jose";

export interface JwtPayload {
  sub: string;       // user.id
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/** 签发 JWT，默认 7 天有效期 */
export async function signToken(payload: JwtPayload, expiresIn = "7d"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

/** 验证并返回 payload，验证失败返回 null */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.email) return null;
    return {
      sub: payload.sub,
      email: payload.email as string,
      name: (payload.name as string | undefined) ?? null,
      avatarUrl: (payload.avatarUrl as string | undefined) ?? null,
    };
  } catch {
    return null;
  }
}
