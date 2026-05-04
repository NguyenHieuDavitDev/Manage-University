import AdminTrainingProgramsClient from "@/components/admin-lte/AdminTrainingProgramsClient";
import { Suspense } from "react";

export default function AdminTrainingProgramsPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải...</p>}>
      <AdminTrainingProgramsClient />
    </Suspense>
  );
}
