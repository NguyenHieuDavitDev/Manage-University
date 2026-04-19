import { getAccessToken } from "@/lib/auth-storage";

/**
 * Fetch kèm Bearer JWT (nếu có). Dùng cho API cần đăng nhập.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  return fetch(input, { ...init, headers });
}
