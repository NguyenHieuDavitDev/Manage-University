import AdminClassroomsClient from "@/components/admin-lte/AdminClassroomsClient";
import { Suspense } from "react";

export default function AdminClassroomsPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải…</p>}>
      <AdminClassroomsClient />
    </Suspense>
  );
}
