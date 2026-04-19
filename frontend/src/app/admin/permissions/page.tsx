import AdminPermissionsClient from "@/components/admin-lte/AdminPermissionsClient";
import { Suspense } from "react";

export default function AdminPermissionsPage() {
  return (
    <Suspense
      fallback={
        <p className="p-4 text-sm text-[#777]">Đang tải quản lý quyền…</p>
      }
    >
      <AdminPermissionsClient />
    </Suspense>
  );
}
