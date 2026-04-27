import AdminGradeScalesClient from "@/components/admin-lte/AdminGradeScalesClient";
import { Suspense } from "react";

export default function AdminGradeScalesPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải…</p>}>
      <AdminGradeScalesClient />
    </Suspense>
  );
}
