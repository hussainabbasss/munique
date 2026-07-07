import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminUser } from "@/lib/admin/helpers";
import "./admin.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();

  return (
    <AdminShell
      adminEmail={admin?.email ?? null}
      adminRole={admin?.role ?? "reviewer"}
    >
      {children}
    </AdminShell>
  );
}
