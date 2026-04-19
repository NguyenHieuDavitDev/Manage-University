/** Giải payload JWT (không xác thực chữ ký — chỉ đọc claim phía client). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    if (typeof atob === "undefined") return null;
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getJwtRoles(token: string | null): string[] {
  if (!token) return [];
  const p = decodeJwtPayload(token);
  const r = p?.roles;
  if (!Array.isArray(r)) return [];
  return r.map((x) => String(x));
}

export function isJwtExpired(token: string | null, skewSeconds = 30): boolean {
  if (!token) return true;
  const p = decodeJwtPayload(token);
  const exp = p?.exp;
  if (typeof exp !== "number") return false;
  return Date.now() / 1000 >= exp - skewSeconds;
}
