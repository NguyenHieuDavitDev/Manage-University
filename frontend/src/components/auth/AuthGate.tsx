"use client";

import { getAccessToken } from "@/lib/auth-storage";
import { getJwtRoles, isJwtExpired } from "@/lib/jwt";
import { canAccessAdminPortal } from "@/lib/portalRouting";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  mode: "admin" | "user";
  children: React.ReactNode;
};

export function AuthGate({ mode, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const nextPath = pathname || (mode === "admin" ? "/admin" : "/user");
    if (!token || isJwtExpired(token)) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    const roles = getJwtRoles(token);
    if (mode === "admin" && !canAccessAdminPortal(roles)) {
      router.replace("/user");
      return;
    }
    setReady(true);
  }, [mode, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-[#6c757d]">
        <p className="text-sm font-medium">Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  }

  return <>{children}</>;
}
