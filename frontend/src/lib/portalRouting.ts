/** Đồng bộ logic với backend `PortalRouting` (chuẩn hóa mã vai trò, gồm tiền tố ROLE_). */

function normalizeRoleCode(raw: string): string {
  const t = raw.trim().toUpperCase();
  if (t.startsWith("ROLE_")) return t.slice(5);
  return t;
}

export function normalizedRoleCodes(roleCodes: string[]): Set<string> {
  return new Set(
    roleCodes.map(normalizeRoleCode).filter((s) => s.length > 0)
  );
}

export function defaultRouteFromRoles(roleCodes: string[]): string {
  const up = normalizedRoleCodes(roleCodes);
  if (up.has("ADMIN") || up.has("TEACHER")) return "/admin";
  return "/user";
}

/** Chỉ ADMIN hoặc TEACHER được vào cổng quản trị. */
export function canAccessAdminPortal(roleCodes: string[]): boolean {
  const up = normalizedRoleCodes(roleCodes);
  if (up.size === 0) return false;
  return up.has("ADMIN") || up.has("TEACHER");
}
