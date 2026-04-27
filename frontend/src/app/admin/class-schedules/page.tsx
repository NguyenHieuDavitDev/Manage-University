import AdminClassSchedulesClient from "../../../components/admin-lte/AdminClassSchedulesClient";
import { Suspense } from "react";

export default function AdminClassSchedulesPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải…</p>}>
      <AdminClassSchedulesClient />
    </Suspense>
  );
}
