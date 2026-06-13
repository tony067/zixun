/**
 * Drop-in replacement for `fetch`
 * 自动从 localStorage 读取 JWT token 并注入 Authorization header
 * 替换原来依赖 @eazo/sdk 的 auth.getToken() 实现
 */
import { getStoredToken } from "@/contexts/auth-context";

export async function request(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = getStoredToken();

  const hasBody = init.body != null;
  return fetch(input, {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
