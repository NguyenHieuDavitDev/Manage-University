import AdminAttendanceClient from "@/components/admin-lte/AdminAttendanceClient";
import { Suspense } from "react";

export default function AdminAttendancePage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải…</p>}>
      <AdminAttendanceClient />
    </Suspense>
  );
}
