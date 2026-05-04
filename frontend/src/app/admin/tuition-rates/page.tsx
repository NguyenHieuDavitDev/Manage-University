import AdminTuitionRatesClient from "@/components/admin-lte/AdminTuitionRatesClient";
import { Suspense } from "react";

export default function AdminTuitionRatesPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#777]">Đang tải...</p>}>
      <AdminTuitionRatesClient />
    </Suspense>
  );
}
