"use client";

import { FaIcon } from "@/components/FaIcon";
import { clearAccessToken } from "@/lib/auth-storage";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";

const SIDEBAR_COLLAPSED_KEY = "lte-sidebar-collapsed";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Nếu có: menu chỉ hiện khi tài khoản được cấp quyền tương ứng (trừ ADMIN). */
  permissionCode?: string;
};

/** Nhóm mục sidebar (quản trị: theo nghiệp vụ). */
export type NavGroup = { label: string; items: NavItem[] };

type Props = {
  area: "user" | "admin";
  brandSubtitle: string;
  /** Menu phẳng (một cột) — dùng khi không truyền `navGroups`. */
  navItems?: NavItem[];
  /** Menu theo nhóm (ưu tiên hơn `navItems` khi có phần tử). */
  navGroups?: NavGroup[];
  children: React.ReactNode;
  /** Hiện nút đăng xuất (xóa JWT). Mặc định bật. */
  showLogoutButton?: boolean;
};

function renderNavLink(
  item: NavItem,
  pathname: string | null,
  sidebarCollapsed: boolean,
  onNavigate: () => void
) {
  const active =
    pathname === item.href ||
    (item.href !== "/user" && item.href !== "/admin" && (pathname?.startsWith(item.href) ?? false));
  return (
    <li key={`${item.href}::${item.label}`}>
      <Link
        href={item.href}
        title={item.label}
        aria-label={item.label}
        onClick={onNavigate}
        className={`flex items-center rounded-lg border-l-[3px] py-2.5 text-sm font-medium transition-colors duration-150 ${
          sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
        } ${
          active
            ? "border-[#3c8dbc] bg-[#1e282c] text-white shadow-inner"
            : "border-transparent text-[#b8c7ce] hover:bg-[#1e282c] hover:text-white"
        }`}
      >
        <FaIcon
          icon={item.icon}
          className={`w-5 shrink-0 text-center text-base ${active ? "text-[#7ec8e8]" : "text-[#7a8793]"}`}
        />
        {!sidebarCollapsed && (
          <>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {active && <FaIcon icon="fa-solid fa-chevron-right" className="text-[10px] opacity-70" />}
          </>
        )}
      </Link>
    </li>
  );
}

export function AdminLteShell({
  area,
  brandSubtitle,
  navItems = [],
  navGroups,
  children,
  showLogoutButton = true,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc preference sidebar từ localStorage sau mount
      setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const areaLabel = area === "admin" ? "Quản trị" : "Người dùng";
  const areaIcon =
    area === "admin" ? "fa-solid fa-shield-halved" : "fa-solid fa-circle-user";
  const otherHref = area === "admin" ? "/user" : "/admin";
  const otherLabel = area === "admin" ? "Cổng người dùng" : "Cổng quản trị";
  const otherIcon =
    area === "admin" ? "fa-solid fa-user-group" : "fa-solid fa-screwdriver-wrench";

  const useGrouped = navGroups != null && navGroups.length > 0;
  const flatForLegacy = !useGrouped ? navItems : [];

  return (
    <div className="adminlte-app flex min-h-screen flex-col text-[#2c3e50]">
      <header className="lte-navbar sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-[#dee2e6] bg-white/95 px-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-4">
        <button
          type="button"
          className="lte-btn lte-btn-ghost lte-btn-sm inline-flex h-10 w-10 shrink-0 p-0 md:hidden"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <FaIcon icon="fa-solid fa-bars" className="text-lg text-[#444]" />
        </button>

        <button
          type="button"
          className="lte-btn lte-btn-ghost lte-btn-sm hidden h-10 w-10 shrink-0 p-0 md:inline-flex"
          onClick={toggleSidebarCollapsed}
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          title={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          <FaIcon
            icon={
              sidebarCollapsed ? "fa-solid fa-angles-right" : "fa-solid fa-angles-left"
            }
            className="text-base text-[#555]"
          />
        </button>

        <Link
          href={area === "admin" ? "/admin" : "/user"}
          className="lte-brand mr-auto flex min-w-0 items-center gap-2.5 font-semibold text-[#2c3e50] sm:mr-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a9ac7] to-[#2f7494] text-lg text-white shadow-md ring-2 ring-white/30">
            <FaIcon icon="fa-solid fa-graduation-cap" />
          </span>
          <span className="min-w-0 truncate sm:whitespace-normal">
            <span className="block leading-tight">ST Manager</span>
            <span className="hidden text-xs font-normal text-[#6c757d] sm:block">
              {brandSubtitle}
            </span>
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-sm">
          <span className="hidden items-center gap-1.5 rounded-full border border-[#e3e8ec] bg-[#f8fafc] px-3 py-1.5 text-xs font-medium text-[#5a6c7d] sm:inline-flex">
            <FaIcon icon={areaIcon} className="text-[#3c8dbc]" />
            {areaLabel}
          </span>
          <Link
            href={otherHref}
            className="lte-btn lte-btn-ghost lte-btn-sm whitespace-nowrap px-3 py-2 sm:px-4"
          >
            <FaIcon icon={otherIcon} className="text-[#3c8dbc]" />
            <span className="hidden sm:inline">{otherLabel}</span>
            <span className="sm:hidden">Đổi cổng</span>
          </Link>
          {showLogoutButton && (
            <button
              type="button"
              onClick={() => {
                clearAccessToken();
                router.push("/login");
              }}
              className="lte-btn lte-btn-ghost lte-btn-sm whitespace-nowrap px-3 py-2 text-[#6c757d] hover:text-red-600"
            >
              <FaIcon icon="fa-solid fa-right-from-bracket" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          )}
          <Link
            href="/"
            className="lte-btn lte-btn-ghost lte-btn-sm hidden px-3 py-2 text-[#6c757d] hover:text-[#3c8dbc] sm:inline-flex"
          >
            <FaIcon icon="fa-solid fa-house" />
            Trang chủ
          </Link>
        </nav>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`lte-sidebar fixed inset-y-0 left-0 z-30 flex min-h-0 w-[15.5rem] shrink-0 flex-col overflow-hidden border-r border-black/10 bg-[#222d32] pt-14 text-[#b8c7ce] shadow-[4px_0_24px_rgba(0,0,0,0.12)] transition-[transform,width] duration-300 ease-out md:sticky md:top-14 md:z-10 md:h-[calc(100vh-3.5rem)] md:self-start md:translate-x-0 md:pt-0 md:shadow-none ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } ${sidebarCollapsed ? "md:w-[4.25rem]" : "md:w-56"}`}
        >
          <div
            className={`lte-sidebar-brand hidden h-14 shrink-0 items-center gap-2 border-b border-black/15 bg-[#1a2226] text-sm font-semibold text-white md:flex ${
              sidebarCollapsed ? "justify-center px-2" : "px-4"
            }`}
          >
            <FaIcon icon="fa-solid fa-layer-group" className="shrink-0 text-[#3c8dbc]" />
            {!sidebarCollapsed && <span className="truncate">{brandSubtitle}</span>}
          </div>
          <ul className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-3 [scrollbar-gutter:stable]">
            {useGrouped
              ? navGroups!.map((group, gi) => (
                  <Fragment key={group.label}>
                    {gi > 0 && (
                      <li className="px-1 py-2" aria-hidden>
                        <div
                          className={`h-px ${sidebarCollapsed ? "mx-1.5 bg-white/10" : "bg-white/10"}`}
                        />
                      </li>
                    )}
                    {!sidebarCollapsed && (
                      <li className={`px-2 pb-1.5 ${gi === 0 ? "pt-0" : "pt-2"}`}>
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6d7a86]">
                          {group.label}
                        </span>
                      </li>
                    )}
                    {group.items.map((item) =>
                      renderNavLink(item, pathname, sidebarCollapsed, () => setMobileOpen(false))
                    )}
                  </Fragment>
                ))
              : flatForLegacy.map((item) =>
                  renderNavLink(item, pathname, sidebarCollapsed, () => setMobileOpen(false))
                )}
          </ul>

          <div className="hidden border-t border-black/15 p-2 md:block">
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className={`flex w-full items-center gap-2 rounded-lg bg-[#1e282c] py-2.5 text-xs font-medium text-[#b8c7ce] transition-colors hover:bg-[#2a353c] hover:text-white ${
                sidebarCollapsed ? "justify-center px-2" : "px-3"
              }`}
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              <FaIcon
                icon={
                  sidebarCollapsed ? "fa-solid fa-angles-right" : "fa-solid fa-angles-left"
                }
                className="text-sm text-[#3c8dbc]"
              />
              {!sidebarCollapsed && <span>Thu / phóng menu</span>}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="mt-auto hidden border-t border-black/15 p-3 text-[10px] leading-relaxed text-[#6d7a86] md:block">
              <FaIcon icon="fa-solid fa-circle-info" className="mr-1 text-[#3c8dbc]" />
              {area === "user"
                ? "Chỉ xem dữ liệu. Sửa/xóa tại cổng quản trị."
                : "Đang ở chế độ quản trị viên."}
            </div>
          )}
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="lte-modal-overlay fixed inset-0 z-20 bg-black/45 backdrop-blur-[2px] md:hidden"
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <main className="lte-content min-w-0 flex-1 p-3 transition-[padding] duration-300 sm:p-5 md:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <footer className="lte-footer shrink-0 border-t border-[#dee2e6] bg-white/90 px-4 py-3.5 text-center text-xs text-[#6c757d] backdrop-blur-sm">
        <FaIcon icon="fa-regular fa-copyright" className="mr-1 opacity-80" />
        <strong className="text-[#444]">ST Manager</strong>
        <span className="mx-2 hidden text-[#ccc] sm:inline">|</span>
        <span className="block sm:inline">Quản lý vai trò</span>
      </footer>
    </div>
  );
}
