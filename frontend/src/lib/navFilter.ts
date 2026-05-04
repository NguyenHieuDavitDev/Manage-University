import type { NavItem } from "@/components/admin-lte/AdminLteShell";
import type { AuthMeResponse } from "@/lib/types/auth";
import { normalizedRoleCodes } from "@/lib/portalRouting";

export type NavItemWithPermission = NavItem & { permissionCode?: string };

export type NavGroupWithPermission = { groupLabel: string; items: NavItemWithPermission[] };

/**
 * Lọc sidebar theo Permission + vai trò (từ `/me` → `displayPermissions`).
 *
 * - **ADMIN**: luôn thấy đủ menu.
 * - **Chưa tải xong `me`** (`me === null`): hiện đủ menu (tránh nhấp nháy khi đang fetch).
 * - **Đã tải `me`, không phải ADMIN**:
 *   - Quyền hiển thị trên cổng này (`visibleInAdminPortal` / `visibleInUserPortal`) tạo tập `allowed`.
 *   - Nếu `allowed` rỗng: chỉ giữ các mục **không** có `permissionCode` (thường là link “Trang chủ”).
 *   - Nếu `allowed` có phần tử: giữ mục không có mã **hoặc** mã thuộc `allowed`.
 */
export function filterNavByDisplayPermissions(
  items: NavItemWithPermission[],
  me: AuthMeResponse | null,
  portal: "admin" | "user"
): NavItem[] {
  const jwtRoles = me?.roles ?? [];
  if (normalizedRoleCodes(jwtRoles).has("ADMIN")) {
    return items;
  }
  if (me == null) {
    return items;
  }
  const raw = me.displayPermissions ?? [];
  const granted = raw.filter((p) =>
    portal === "admin" ? p.visibleInAdminPortal : p.visibleInUserPortal
  );
  const allowed = new Set(
    granted.map((p) => (p.permissionCode || "").trim().toLowerCase()).filter((c) => c.length > 0)
  );
  if (allowed.size === 0) {
    return items.filter((it) => !it.permissionCode);
  }
  return items.filter((it) => {
    if (!it.permissionCode) return true;
    return allowed.has(it.permissionCode.trim().toLowerCase());
  });
}

/** Lọc sidebar theo nhóm: bỏ nhóm rỗng sau khi lọc từng mục. */
export function filterNavGroupsByDisplayPermissions(
  groups: NavGroupWithPermission[],
  me: AuthMeResponse | null,
  portal: "admin" | "user"
): { groupLabel: string; items: NavItem[] }[] {
  return groups
    .map((g) => ({
      groupLabel: g.groupLabel,
      items: filterNavByDisplayPermissions(g.items, me, portal),
    }))
    .filter((g) => g.items.length > 0);
}
