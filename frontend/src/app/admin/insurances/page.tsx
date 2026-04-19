import AdminUserRecordsClient from "@/components/admin-lte/AdminUserRecordsClient";
import { Suspense } from "react";

export default function AdminInsurancesPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải…</p>}>
      <AdminUserRecordsClient kind="insurance" />
    </Suspense>
  );
}
