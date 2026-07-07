import { AdminThemeProvider } from "@/components/admin/admin-theme-context";
import { ADMIN_THEME_STORAGE_KEY } from "@/lib/admin/theme";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem(${JSON.stringify(ADMIN_THEME_STORAGE_KEY)});if(t==='dark'){document.documentElement.dataset.adminBootTheme='dark';}}catch(e){}})();`,
        }}
      />
      <AdminThemeProvider>{children}</AdminThemeProvider>
    </>
  );
}
