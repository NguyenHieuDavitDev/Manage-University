"use client";

import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";
import { getJwtRoles, isJwtExpired } from "@/lib/jwt";
import { canAccessAdminPortal } from "@/lib/portalRouting";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  mode: "admin" | "user";
  children: React.ReactNode;
};

export function AuthGate({ mode, children }: Props) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  // Track if we already redirected to avoid double replace calls
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (redirectingRef.current) return;

    const token = getAccessToken();
    const nextPath = pathname || (mode === "admin" ? "/admin" : "/user");

    if (!token || isJwtExpired(token)) {
      clearAccessToken();
      setReady(false);
      redirectingRef.current = true;
      window.location.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    const roles = getJwtRoles(token);
    if (mode === "admin" && !canAccessAdminPortal(roles)) {
      setReady(false);
      redirectingRef.current = true;
      window.location.replace("/user");
      return;
    }

    setReady(true);
  }, [mode, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-[#6c757d]">
        <p className="text-sm font-medium">Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  }

  return <>{children}</>;
}
