/**
 * Drop-in replacement for `fetch` that automatically injects session token.
 * Reads JWT token from localStorage for standalone deployment.
 */
export async function request(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("mindpace_token")
    : null;

  const hasBody = init.body != null;
  return fetch(input, {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      ...(token ? { "x-session-token": token } : {}),
    },
  });
}
