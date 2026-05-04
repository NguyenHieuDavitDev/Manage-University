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
    href: "/user/study-schedule",
    label: "Lịch học",
    icon: "fa-solid fa-calendar-days",
  },
  {
    href: "/user/exam-schedule",
    label: "Lịch thi",
    icon: "fa-solid fa-calendar-check",
  },
  {
    href: "/user/scores",
    label: "Điểm số",
    icon: "fa-solid fa-square-poll-vertical",
  },
  {
    href: "/user/tuition",
    label: "Học phí",
    icon: "fa-solid fa-money-check-dollar",
  },
  {
    href: "/user/tuition#payment-history-stats",
    label: "Thống kê lịch sử thanh toán",
    icon: "fa-solid fa-chart-line",
  },
  {
    href: "/user/roles",
    label: "Vai trò",
    icon: "fa-solid fa-shield-halved",
    permissionCode: "user:roles",
  },
  {
    href: "/user/chat",
    label: "Trợ lý AI",
    icon: "fa-solid fa-robot",
  },
];

export function userSidebarPermissionCodes(): { code: string; label: string }[] {
  return USER_SIDEBAR_NAV.filter((i) => i.permissionCode).map((i) => ({
    code: i.permissionCode as string,
    label: i.label,
  }));
}
