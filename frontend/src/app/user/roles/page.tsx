import { UserRolesSearchBar } from "@/components/role/UserRolesSearchBar";
import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import { FaIcon } from "@/components/FaIcon";
import { fetchRolePage } from "@/lib/api/roles";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function UserRolesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page || 0) || 0);
  const q = (sp.q || "").trim();

  let pageData = null;
  let err: string | null = null;
  try {
    pageData = await fetchRolePage(page, 15, "roleName,asc", q || undefined);
  } catch (e) {
    err = e instanceof Error ? e.message : "Lỗi tải dữ liệu";
  }

  const qSuffix = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <>
      <UserPageHeading
        title="Vai trò trong hệ thống"
        description="Chỉ xem: tra cứu mã, tên và mô tả. Dữ liệu do quản trị viên cập nhật."
        breadcrumbs={[
          { label: "Trang chủ", href: "/user" },
          { label: "Vai trò" },
        ]}
      />
      <UserSurface title="Tra cứu" titleIcon="fa-solid fa-magnifying-glass">
        <UserRolesSearchBar initialQ={q} variant="user" />

        {err && (
          <p className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <FaIcon icon="fa-solid fa-plug-circle-xmark" className="mt-0.5 shrink-0" />
            {err}
          </p>
        )}
        {pageData && (
          <>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90">
                      <th className="px-4 py-3.5 font-semibold text-slate-700 sm:px-5">
                        Mã
                      </th>
                      <th className="px-4 py-3.5 font-semibold text-slate-700 sm:px-5">
                        Tên
                      </th>
                      <th className="px-4 py-3.5 font-semibold text-slate-700 sm:px-5">
                        Mô tả
                      </th>
                      <th className="px-4 py-3.5 sm:px-5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pageData.content.map((r) => (
                      <tr key={r.id} className="transition hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-600 sm:px-5">
                          {r.roleCode}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-900 sm:px-5">
                          {r.roleName}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3.5 text-slate-600 sm:px-5">
                          {r.description || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 sm:px-5">
                          <Link
                            href={`/user/roles/${r.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-100"
                          >
                            <FaIcon icon="fa-solid fa-circle-info" />
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {pageData.totalPages > 1 && (
              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Trang {pageData.number + 1}/{pageData.totalPages} —{" "}
                  <span className="font-medium text-slate-800">
                    {pageData.totalElements}
                  </span>{" "}
                  vai trò
                </span>
                <div className="flex flex-wrap gap-2">
                  {!pageData.first && (
                    <Link
                      href={`/user/roles?page=${page - 1}${qSuffix}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <FaIcon icon="fa-solid fa-chevron-left" />
                      Trước
                    </Link>
                  )}
                  {!pageData.last && (
                    <Link
                      href={`/user/roles?page=${page + 1}${qSuffix}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Sau
                      <FaIcon icon="fa-solid fa-chevron-right" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </UserSurface>
    </>
  );
}
