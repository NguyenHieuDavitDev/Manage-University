import { AuthGate } from "@/components/auth/AuthGate";
import { UserPortalShell } from "@/components/user-portal/UserPortalShell";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate mode="user">
      <UserPortalShell>{children}</UserPortalShell>
    </AuthGate>
  );
}
