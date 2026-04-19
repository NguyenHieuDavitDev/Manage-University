import type { AuthMeResponse, AuthResponse } from "@/lib/types/auth";

const SNAPSHOT_KEY = "st_me_snapshot";

function safeParse(json: string): AuthMeResponse | null {
  try {
    const o = JSON.parse(json) as AuthMeResponse;
    if (!o || typeof o.userId !== "string" || !Array.isArray(o.roles)) {
      return null;
    }
    if (!Array.isArray(o.displayPermissions)) {
      o.displayPermissions = [];
    }
    return o;
  } catch {
    return null;
  }
}

/** Đọc snapshot phiên (sau đăng nhập hoặc lần /me gần nhất) để sidebar lọc ngay, không chờ fetch. */
export function readAuthMeSnapshot(): AuthMeResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    return safeParse(raw);
  } catch {
    return null;
  }
}

export function writeAuthMeSnapshot(me: AuthMeResponse): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(me));
  } catch {
    /* ignore */
  }
}

/** Ghi từ body đăng nhập / đăng ký — đồng bộ menu theo quyền ngay sau khi vào app. */
export function writeAuthMeSnapshotFromAuthResponse(res: AuthResponse): void {
  const me: AuthMeResponse = {
    userId: res.userId,
    username: res.username,
    email: res.email,
    fullName: res.fullName,
    roles: res.roles ?? [],
    defaultRoute: res.defaultRoute,
    displayPermissions: res.displayPermissions ?? [],
  };
  writeAuthMeSnapshot(me);
}

export function clearAuthMeSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
}
