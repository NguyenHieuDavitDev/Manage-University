import AdminSidebarConfigClient from "@/components/admin-lte/AdminSidebarConfigClient";
import { Suspense } from "react";

export default function AdminSidebarConfigPage() {
  return (
    <Suspense
      fallback={<p className="p-4 text-sm text-[#777]">Đang tải cấu hình menu…</p>}
    >
      <AdminSidebarConfigClient />
    </Suspense>
  );
}
