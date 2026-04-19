import AdminMasterDataClient from "@/components/admin-lte/AdminMasterDataClient";
import { Suspense } from "react";

export default function AdminCoursesPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải…</p>}>
      <AdminMasterDataClient kind="course" />
    </Suspense>
  );
}
