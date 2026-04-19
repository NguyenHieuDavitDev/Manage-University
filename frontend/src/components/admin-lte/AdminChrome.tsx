"use client";

import { AdminLteShell } from "@/components/admin-lte/AdminLteShell";
import { fetchMe } from "@/lib/api/auth";
import { readAuthMeSnapshot, writeAuthMeSnapshot } from "@/lib/auth-me-snapshot";
import { ADMIN_SIDEBAR_NAV } from "@/lib/adminSidebarNav";
import { filterNavByDisplayPermissions } from "@/lib/navFilter";
import type { AuthMeResponse } from "@/lib/types/auth";
import { useEffect, useMemo, useState } from "react";

function initialMe(): AuthMeResponse | null {
  if (typeof window === "undefined") return null;
  return readAuthMeSnapshot();
}

type Props = { children: React.ReactNode };

export function AdminChrome({ children }: Props) {
  const [me, setMe] = useState<AuthMeResponse | null>(initialMe);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const m = await fetchMe();
        if (!cancelled) {
          setMe(m);
          writeAuthMeSnapshot(m);
        }
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = useMemo(
    () => filterNavByDisplayPermissions(ADMIN_SIDEBAR_NAV, me, "admin"),
    [me]
  );

  return (
    <AdminLteShell
      area="admin"
      brandSubtitle="Quản trị"
      navItems={navItems}
      showLogoutButton
    >
      {children}
    </AdminLteShell>
  );
}
