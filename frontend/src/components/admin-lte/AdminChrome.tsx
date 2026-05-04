"use client";

import { AdminLteShell } from "@/components/admin-lte/AdminLteShell";
import { fetchMe } from "@/lib/api/auth";
import { readAuthMeSnapshot, writeAuthMeSnapshot } from "@/lib/auth-me-snapshot";
import { ADMIN_SIDEBAR_GROUPS } from "@/lib/adminSidebarNav";
import { filterNavGroupsByDisplayPermissions } from "@/lib/navFilter";
import { normalizedRoleCodes } from "@/lib/portalRouting";
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

  const navGroups = useMemo(() => {
    const base = filterNavGroupsByDisplayPermissions(ADMIN_SIDEBAR_GROUPS, me, "admin").map((g) => ({
      label: g.groupLabel,
      items: g.items,
    }));
    if (me == null) return base;
    const isAdmin = normalizedRoleCodes(me.roles).has("ADMIN");
    if (isAdmin) return base;
    const hidden = new Set(["/admin/users", "/admin/permissions", "/admin/roles"]);
    return base
      .map((g) => ({
        label: g.label,
        items: g.items.filter((item) => !hidden.has(item.href)),
      }))
      .filter((g) => g.items.length > 0);
  }, [me]);

  return (
    <AdminLteShell
      area="admin"
      brandSubtitle="Quản trị"
      navGroups={navGroups}
      showLogoutButton
    >
      {children}
    </AdminLteShell>
  );
}
