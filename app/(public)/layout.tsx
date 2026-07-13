import {
  getRegistrationStatus,
  getScheduleStatus,
  getStatusBannerSettings,
} from "@/lib/admin/helpers";
import { StatusBanner } from "@/components/status-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [banner, registration, schedule] = await Promise.all([
    getStatusBannerSettings(),
    getRegistrationStatus(),
    getScheduleStatus(),
  ]);

  return (
    <>
      <StatusBanner
        message={banner.message}
        href={banner.href}
        visible={banner.visible}
      />
      <SiteNav
        registration={registration}
        scheduleEnabled={schedule.enabled}
      />
      {children}
      <SiteFooter />
    </>
  );
}
