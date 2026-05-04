import AdminStudentTuitionsClient from "@/components/admin-lte/AdminStudentTuitionsClient";
import { Suspense } from "react";

export default function AdminStudentTuitionsPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải...</p>}>
      <AdminStudentTuitionsClient />
    </Suspense>
  );
}
