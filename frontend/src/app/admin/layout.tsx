import { AdminChrome } from "@/components/admin-lte/AdminChrome";
import { AuthGate } from "@/components/auth/AuthGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate mode="admin">
      <AdminChrome>{children}</AdminChrome>
    </AuthGate>
  );
}
