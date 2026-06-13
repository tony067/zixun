/**
 * Drop-in replacement for `fetch` that automatically injects the Eazo session token.
 * Uses auth.getToken() from @eazo/sdk to get the current session JWT.
 */
import { auth } from "@eazo/sdk";

export async function request(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  let token: string | null = null;
  try {
    token = await auth.getToken();
  } catch {
    // not authenticated or SDK not ready
  }

  const hasBody = init.body != null;
  return fetch(input, {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      ...(token ? { "x-eazo-session": token } : {}),
    },
  });
}
