import type { NavItemWithPermission } from "@/lib/navFilter";

/** Sidebar cổng /user — “Trang chủ” không gắn mã để luôn có đường về /user. */
export const USER_SIDEBAR_NAV: NavItemWithPermission[] = [
  { href: "/user", label: "Trang chủ", icon: "fa-solid fa-house" },
  {
    href: "/user/course-enrollment",
    label: "Đăng ký học phần",
    icon: "fa-solid fa-book-open",
  },
  {
    href: "/user/roles",
    label: "Vai trò",
    icon: "fa-solid fa-shield-halved",
    permissionCode: "user:roles",
  },
];

export function userSidebarPermissionCodes(): { code: string; label: string }[] {
  return USER_SIDEBAR_NAV.filter((i) => i.permissionCode).map((i) => ({
    code: i.permissionCode as string,
    label: i.label,
  }));
}
