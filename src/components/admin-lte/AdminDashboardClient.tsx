"use client";

import { LteCard } from "@/components/admin-lte/Card";
import { ContentHeader } from "@/components/admin-lte/ContentHeader";
import { FaIcon } from "@/components/FaIcon";
import { fetchRolePage } from "@/lib/api/roles";
import { fetchUserPage } from "@/lib/api/users";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboardClient() {
  const [totalRoles, setTotalRoles] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [apiOk, setApiOk] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rolesPage, usersPage] = await Promise.all([
          fetchRolePage(0, 1, "id,desc"),
          fetchUserPage(0, 1, "createdAt,desc"),
        ]);
        if (!cancelled) {
          setTotalRoles(rolesPage.totalElements);
          setTotalUsers(usersPage.totalElements);
          setApiOk(true);
        }
      } catch {
        if (!cancelled) {
          setApiOk(false);
          setTotalRoles(null);
          setTotalUsers(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <ContentHeader
        title="Bảng điều khiển"
        titleIcon="fa-solid fa-chart-pie"
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Tổng quan" },
        ]}
      />
      <div className="grid gap-5 md:grid-cols-3">
        <LteCard title="Người dùng" titleIcon="fa-solid fa-users">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#28a745]/12">
              <FaIcon icon="fa-solid fa-user-group" className="text-2xl text-[#28a745]" />
            </div>
            <div>
              <p className="text-4xl font-light tabular-nums tracking-tight text-[#28a745]">
                {apiOk && totalUsers != null ? totalUsers : "—"}
              </p>
              <p className="mt-1 text-sm text-[#6c757d]">
                Tổng số tài khoản (chưa xóa mềm)
              </p>
              {!apiOk && (
                <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <FaIcon
                    icon="fa-solid fa-triangle-exclamation"
                    className="mt-0.5 shrink-0"
                  />
                  Không tải được API. Kiểm tra đăng nhập và{" "}
                  <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_API_BASE_URL</code>.
                </p>
              )}
            </div>
          </div>
        </LteCard>
        <LteCard title="Vai trò" titleIcon="fa-solid fa-user-shield">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#3c8dbc]/12">
              <FaIcon icon="fa-solid fa-database" className="text-2xl text-[#3c8dbc]" />
            </div>
            <div>
              <p className="text-4xl font-light tabular-nums tracking-tight text-[#3c8dbc]">
                {apiOk && totalRoles != null ? totalRoles : "—"}
              </p>
              <p className="mt-1 text-sm text-[#6c757d]">Tổng số vai trò trong hệ thống</p>
            </div>
          </div>
        </LteCard>
        <LteCard title="Thao tác nhanh" titleIcon="fa-solid fa-bolt">
          <p className="mb-4 text-sm text-[#6c757d]">
            Mở màn hình quản lý người dùng hoặc vai trò (CRUD, tìm kiếm, phân trang).
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href="/admin/users"
              className="lte-btn lte-btn-primary w-full sm:w-auto"
            >
              <FaIcon icon="fa-solid fa-users" />
              Quản lý người dùng
            </Link>
            <Link
              href="/admin/roles"
              className="lte-btn lte-btn-ghost w-full border border-[#d0d7de] sm:w-auto"
            >
              <FaIcon icon="fa-solid fa-user-shield" />
              Quản lý vai trò
            </Link>
          </div>
        </LteCard>
        <LteCard title="Giao diện" titleIcon="fa-solid fa-palette">
          <p className="text-sm leading-relaxed text-[#495057]">
            Layout theo phong cách AdminLTE với Font Awesome, sidebar tối và thẻ nội dung có đổ bóng
            nhẹ để dễ đọc.
          </p>
        </LteCard>
      </div>
    </>
  );
}
