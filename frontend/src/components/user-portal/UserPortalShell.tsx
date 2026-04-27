"use client";

import { FaIcon } from "@/components/FaIcon";
import { fetchMe } from "@/lib/api/auth";
import { readAuthMeSnapshot, writeAuthMeSnapshot } from "@/lib/auth-me-snapshot";
import { clearAccessToken } from "@/lib/auth-storage";
import { filterNavByDisplayPermissions } from "@/lib/navFilter";
import { USER_SIDEBAR_NAV } from "@/lib/userSidebarNav";
import type { AuthMeResponse } from "@/lib/types/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Props = { children: React.ReactNode };

function initialMe(): AuthMeResponse | null {
  if (typeof window === "undefined") return null;
  return readAuthMeSnapshot();
}

export function UserPortalShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState<AuthMeResponse | null>(initialMe);

  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      try {
        const m = await fetchMe({ signal: ac.signal });
        if (ac.signal.aborted) return;
        setMe(m);
        writeAuthMeSnapshot(m);
      } catch (err) {
        if (ac.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof Error && err.name === "AbortError") return;
        const status = typeof err === "object" && err != null && "status" in err ? (err as { status?: number }).status : undefined;
        const msg = err instanceof Error ? err.message : "";
        if (status === 401 || msg.includes("hết hạn")) {
          clearAccessToken();
          setMe(null);
          const returnTo =
            typeof window !== "undefined" &&
            window.location.pathname &&
            window.location.pathname !== "/login"
              ? window.location.pathname
              : "/user";
          window.location.replace(`/login?next=${encodeURIComponent(returnTo)}`);
          return;
        }
        setMe(readAuthMeSnapshot());
      }
    })();
    return () => {
      ac.abort();
    };
  }, []);

  const navItems = useMemo(
    () => filterNavByDisplayPermissions(USER_SIDEBAR_NAV, me, "user"),
    [me]
  );

  function logout() {
    clearAccessToken();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <header className="relative sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
          <Link
            href="/user"
            className="group flex shrink-0 items-center gap-3 rounded-xl outline-none ring-indigo-500/0 transition focus-visible:ring-2 focus-visible:ring-offset-2"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg text-white shadow-md transition group-hover:shadow-lg">
              <FaIcon icon="fa-solid fa-graduation-cap" />
            </span>
            <div className="leading-tight">
              <span className="block text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                ST Manager
              </span>
              <span className="text-xs font-medium text-indigo-600">Cổng thành viên</span>
            </div>
          </Link>

          <nav
            id="user-nav"
            className={`absolute left-0 right-0 top-full z-40 flex-col gap-1 border-b border-slate-200 bg-white px-4 py-3 shadow-md md:static md:z-auto md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0 md:shadow-none ${
              menuOpen ? "flex" : "hidden md:flex"
            }`}
            aria-label="Điều hướng chính"
          >
            {navItems.map((item) => {
              const active =
                item.href === "/user"
                  ? pathname === "/user"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition md:px-4 md:py-2 ${
                    active
                      ? "bg-indigo-50 text-indigo-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <FaIcon icon={item.icon} className="text-[0.95em] opacity-90" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={logout}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
            >
              <FaIcon icon="fa-solid fa-right-from-bracket" />
              Đăng xuất
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="user-nav"
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <FaIcon icon={menuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-100 px-4 py-3 md:hidden">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
            >
              <FaIcon icon="fa-solid fa-right-from-bracket" />
              Đăng xuất
            </button>
          </div>
        )}
      </header>

      <main id="user-main" className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">{children}</div>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                ST Manager
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                Cổng thông tin dành cho thành viên: tra cứu vai trò và tài liệu liên
                quan.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <Link href="/" className="text-slate-300 hover:text-white">
                Trang nền tảng
              </Link>
              <Link href="/user/roles" className="text-slate-300 hover:text-white">
                Danh sách vai trò
              </Link>
              <Link href="/admin" className="text-slate-300 hover:text-white">
                Quản trị
              </Link>
            </div>
          </div>
          <p className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} ST Manager. Đã thiết kế riêng cho khu vực
            người dùng.
          </p>
        </div>
      </footer>
    </div>
  );
}
