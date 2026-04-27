import AdminStudentGradesClient from "@/components/admin-lte/AdminStudentGradesClient";
import { Suspense } from "react";

export default function AdminStudentGradesPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải…</p>}>
      <AdminStudentGradesClient />
    </Suspense>
  );
}
