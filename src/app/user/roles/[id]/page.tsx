import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import { FaIcon } from "@/components/FaIcon";
import { fetchRoleById } from "@/lib/api/roles";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function UserRoleDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    notFound();
  }

  let role = null;
  try {
    role = await fetchRoleById(numId);
  } catch {
    notFound();
  }

  if (!role) notFound();

  const rows: { label: string; value: string; icon: string }[] = [
    { label: "Mã vai trò", value: role.roleCode, icon: "fa-solid fa-tag" },
    { label: "Tên hiển thị", value: role.roleName, icon: "fa-solid fa-signature" },
    {
      label: "Mô tả",
      value: role.description || "—",
      icon: "fa-solid fa-align-left",
    },
    {
      label: "Cập nhật",
      value: role.updatedAt?.slice(0, 10) || "—",
      icon: "fa-solid fa-clock-rotate-left",
    },
  ];

  return (
    <>
      <UserPageHeading
        title={role.roleName}
        description={`Mã vai trò: ${role.roleCode}`}
        breadcrumbs={[
          { label: "Trang chủ", href: "/user" },
          { label: "Vai trò", href: "/user/roles" },
          { label: role.roleCode },
        ]}
      />
      <UserSurface title="Thông tin chi tiết" titleIcon="fa-solid fa-circle-info">
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-5 transition hover:border-indigo-200/60 hover:bg-indigo-50/30"
            >
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <FaIcon icon={row.icon} className="text-indigo-600" />
                {row.label}
              </dt>
              <dd className="mt-2 text-sm font-semibold text-slate-900">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 border-t border-slate-100 pt-6">
          <Link
            href="/user/roles"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            <FaIcon icon="fa-solid fa-arrow-left-long" />
            Quay lại danh sách
          </Link>
        </div>
      </UserSurface>
    </>
  );
}
