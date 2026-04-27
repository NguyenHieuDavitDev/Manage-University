import AdminExamsClient from "@/components/admin-lte/AdminExamsClient";
import { Suspense } from "react";

export default function AdminExamsPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải…</p>}>
      <AdminExamsClient />
    </Suspense>
  );
}
