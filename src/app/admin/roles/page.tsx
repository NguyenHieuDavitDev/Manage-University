import AdminRolesClient from "@/components/admin-lte/AdminRolesClient";
import { Suspense } from "react";

export default function AdminRolesPage() {
  return (
    <Suspense
      fallback={
        <p className="p-4 text-sm text-[#777]">Đang tải quản lý vai trò…</p>
      }
    >
      <AdminRolesClient />
    </Suspense>
  );
}
