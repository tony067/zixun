/**
 * Drop-in replacement for `fetch` that automatically injects the Eazo session token.
 * Uses auth.getSessionHeader() from @eazo/sdk to get the session value for x-eazo-session.
 */
import { auth } from "@eazo/sdk";

export async function request(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  let sessionHeader: string | null = null;
  try {
    // getSessionHeader() returns the raw session JSON that requireAuth expects
    sessionHeader = await (auth as any).getSessionHeader?.() ?? await auth.getToken();
  } catch {
    // not authenticated or SDK not ready
  }

  const hasBody = init.body != null;
  return fetch(input, {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      ...(sessionHeader ? { "x-eazo-session": sessionHeader } : {}),
    },
  });
}
