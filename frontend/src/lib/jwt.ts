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

/**
 * exp trong JWT chuẩn là seconds (UNIX). Một số nguồn trả dạng chuỗi hoặc ms — chuẩn hoá về seconds.
 */
function expClaimToSeconds(payload: Record<string, unknown> | null): number | null {
  if (!payload) return null;
  const raw = payload.exp;
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 1e12 ? raw / 1000 : raw;
  }
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n)) {
      return n > 1e12 ? n / 1000 : n;
    }
  }
  return null;
}

export function getJwtRoles(token: string | null): string[] {
  if (!token) return [];
  const p = decodeJwtPayload(token);
  const r = p?.roles;
  if (!Array.isArray(r)) return [];
  return r.map((x) => String(x));
}

export function isJwtExpired(token: string | null, skewSeconds = 120): boolean {
  if (!token) return true;
  const p = decodeJwtPayload(token);
  if (!p) return false;
  const expSec = expClaimToSeconds(p);
  if (expSec == null) return false;
  const now = Date.now() / 1000;
  return now >= expSec - skewSeconds;
}
