import AdminDutyAssignmentsClient from "@/components/admin-lte/AdminDutyAssignmentsClient";
import { Suspense } from "react";

export default function AdminDutyAssignmentsPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải…</p>}>
      <AdminDutyAssignmentsClient />
    </Suspense>
  );
}
