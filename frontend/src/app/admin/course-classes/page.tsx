import AdminCourseClassesClient from "@/components/admin-lte/AdminCourseClassesClient";
import { Suspense } from "react";

export default function AdminCourseClassesPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải…</p>}>
      <AdminCourseClassesClient />
    </Suspense>
  );
}
