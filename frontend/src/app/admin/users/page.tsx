import AdminUsersClient from "@/components/admin-lte/AdminUsersClient";
import { Suspense } from "react";

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <p className="p-4 text-sm text-[#777]">Đang tải quản lý người dùng…</p>
      }
    >
      <AdminUsersClient />
    </Suspense>
  );
}
