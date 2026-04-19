import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[#6c757d]">
          Đang tải…
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
