import type { NavGroupWithPermission, NavItemWithPermission } from "@/lib/navFilter";

/**
 * Cấu hình sidebar admin theo **nhóm chức năng**. Mỗi mục có `permissionCode` khớp Permission trong DB
 * (bật “Cổng quản trị” + gán cho đúng vai trò). Mục không có mã luôn hiển thị (ví dụ bảng điều khiển).
 */
export const ADMIN_SIDEBAR_GROUPS: NavGroupWithPermission[] = [
  {
    groupLabel: "Tổng quan & hệ thống",
    items: [
      { href: "/admin", label: "Bảng điều khiển", icon: "fa-solid fa-chart-pie" },
      {
        href: "/admin/users",
        label: "Quản lý người dùng",
        icon: "fa-solid fa-users",
        permissionCode: "admin:users",
      },
      {
        href: "/admin/duty-assignments",
        label: "Phân công nhiệm vụ",
        icon: "fa-solid fa-id-badge",
        permissionCode: "admin:duty_assignments",
      },
      {
        href: "/admin/roles",
        label: "Quản lý vai trò",
        icon: "fa-solid fa-user-shield",
        permissionCode: "admin:roles",
      },
      {
        href: "/admin/permissions",
        label: "Quản lý quyền",
        icon: "fa-solid fa-key",
        permissionCode: "admin:permissions",
      },
      {
        href: "/admin/sidebar-config",
        label: "Cấu hình menu sidebar",
        icon: "fa-solid fa-list-check",
        permissionCode: "admin:permissions",
      },
    ],
  },
  {
    groupLabel: "Danh mục & đào tạo",
    items: [
      {
        href: "/admin/academic-ranks",
        label: "Học hàm / học vị",
        icon: "fa-solid fa-award",
        permissionCode: "admin:academic_ranks",
      },
      {
        href: "/admin/faculties",
        label: "Khoa / đơn vị",
        icon: "fa-solid fa-building-columns",
        permissionCode: "admin:faculties",
      },
      {
        href: "/admin/buildings",
        label: "Quản lý tòa nhà",
        icon: "fa-solid fa-building",
        permissionCode: "admin:buildings",
      },
      {
        href: "/admin/classrooms",
        label: "Quản lý phòng học",
        icon: "fa-solid fa-door-open",
        permissionCode: "admin:classrooms",
      },
      {
        href: "/admin/courses",
        label: "Học phần",
        icon: "fa-solid fa-book",
        permissionCode: "admin:courses",
      },
      {
        href: "/admin/training-programs",
        label: "Chương trình đào tạo",
        icon: "fa-solid fa-diagram-project",
        permissionCode: "admin:training_programs",
      },
      {
        href: "/admin/tuition-rates",
        label: "Mức học phí",
        icon: "fa-solid fa-money-bill-trend-up",
        permissionCode: "admin:tuition_rates",
      },
      {
        href: "/admin/student-tuitions",
        label: "Học phí sinh viên",
        icon: "fa-solid fa-file-invoice-dollar",
        permissionCode: "admin:student_tuitions",
      },
      {
        href: "/admin/student-tuitions#payment-history-stats",
        label: "Thống kê lịch sử thanh toán",
        icon: "fa-solid fa-chart-line",
        permissionCode: "admin:student_tuitions",
      },
      {
        href: "/admin/course-classes",
        label: "Lớp học phần",
        icon: "fa-solid fa-user-group",
        permissionCode: "admin:course_classes",
      },
      {
        href: "/admin/class-schedules",
        label: "Quản lý lịch học",
        icon: "fa-solid fa-calendar-days",
        permissionCode: "admin:class_schedules",
      },
    ],
  },
  {
    groupLabel: "Điểm số & thi cử",
    items: [
      {
        href: "/admin/grade-components",
        label: "Thành phần điểm",
        icon: "fa-solid fa-percent",
        permissionCode: "admin:grade_components",
      },
      {
        href: "/admin/grade-scales",
        label: "Thang điểm chữ",
        icon: "fa-solid fa-ranking-star",
        permissionCode: "admin:grade_scales",
      },
      {
        href: "/admin/exam-types",
        label: "Loại kỳ thi",
        icon: "fa-solid fa-file-signature",
        permissionCode: "admin:exam_types",
      },
      {
        href: "/admin/student-grades",
        label: "Chấm điểm sinh viên",
        icon: "fa-solid fa-square-poll-vertical",
        permissionCode: "admin:student_grades",
      },
      {
        href: "/admin/exams",
        label: "Lịch thi",
        icon: "fa-solid fa-calendar-check",
        permissionCode: "admin:exams",
      },
    ],
  },
  {
    groupLabel: "Nhân sự & hồ sơ",
    items: [
      {
        href: "/admin/departments",
        label: "Phòng ban",
        icon: "fa-solid fa-sitemap",
        permissionCode: "admin:departments",
      },
      {
        href: "/admin/positions",
        label: "Chức vụ",
        icon: "fa-solid fa-briefcase",
        permissionCode: "admin:positions",
      },
      {
        href: "/admin/credentials",
        label: "Chứng chỉ",
        icon: "fa-solid fa-certificate",
        permissionCode: "admin:credentials",
      },
      {
        href: "/admin/insurances",
        label: "Bảo hiểm",
        icon: "fa-solid fa-hand-holding-medical",
        permissionCode: "admin:insurances",
      },
      {
        href: "/admin/labor-contracts",
        label: "Hợp đồng lao động",
        icon: "fa-solid fa-file-contract",
        permissionCode: "admin:labor_contracts",
      },
      {
        href: "/admin/research-works",
        label: "Công trình nghiên cứu",
        icon: "fa-solid fa-book-open",
        permissionCode: "admin:research_works",
      },
    ],
  },
];

/** Danh sách phẳng (dùng cho gợi ý mã quyền, v.v.) */
export const ADMIN_SIDEBAR_NAV: NavItemWithPermission[] = ADMIN_SIDEBAR_GROUPS.flatMap(
  (g) => g.items
);

/** Danh sách mã để hiển thị gợi ý khi cấu hình Permission trong UI quản trị (gộp trùng mã). */
export function adminSidebarPermissionCodes(): { code: string; label: string }[] {
  const byCode = new Map<string, string>();
  for (const i of ADMIN_SIDEBAR_NAV) {
    const code = i.permissionCode;
    if (!code) continue;
    const prev = byCode.get(code);
    byCode.set(code, prev ? `${prev}; ${i.label}` : i.label);
  }
  return [...byCode.entries()].map(([code, label]) => ({ code, label }));
}
