import Link from "next/link";
import { BannerEditor } from "@/components/admin/banner-editor";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { RegistrationsChart } from "@/components/admin/registrations-chart";
import {
  fetchOverviewStats,
  fetchRegistrationChartData,
} from "@/lib/admin/queries";
import { formatPkr, getStatusBannerSettings } from "@/lib/admin/helpers";

export default async function AdminOverviewPage() {
  const [stats, chartData, banner] = await Promise.all([
    fetchOverviewStats(),
    fetchRegistrationChartData(),
    getStatusBannerSettings(),
  ]);

  return (
    <>
      <header className="admin-page-header">
        <div className="admin-page-header-text">
          <h1 className="admin-page-title">Overview</h1>
          <p className="admin-page-lede">
            Live registration metrics — delegates, payments, and revenue at a
            glance.
          </p>
        </div>
        <div className="admin-page-toolbar">
          <Link
            href="/admin/registrations?payment=pending"
            className="admin-action-chip"
          >
            Pending payments
            <span className="admin-action-chip-count">
              {stats.paymentPending}
            </span>
          </Link>
          <Link href="/admin/queries?status=open" className="admin-action-chip">
            Open queries
            <span className="admin-action-chip-count">{stats.openQueries}</span>
          </Link>
          <ExportCsvButton />
        </div>
      </header>

      <div className="admin-metrics">
        <div className="admin-metric admin-metric-static">
          <div className="admin-metric-head">
            <p className="admin-metric-label">Total delegates</p>
          </div>
          <p className="admin-metric-value">{stats.totalDelegates}</p>
          <p className="admin-metric-sub">Across all applications</p>
        </div>

        <Link href="/admin/registrations" className="admin-metric">
          <div className="admin-metric-head">
            <p className="admin-metric-label">Registrations</p>
          </div>
          <p className="admin-metric-value">{stats.totalRegistrations}</p>
          <p className="admin-metric-sub">
            {stats.delegateCount} individual · {stats.delegationCount}{" "}
            delegation
          </p>
        </Link>

        <Link
          href="/admin/registrations?payment=pending"
          className="admin-metric admin-metric-pending"
        >
          <div className="admin-metric-head">
            <p className="admin-metric-label">Payment pending</p>
            <span className="admin-stat-pill admin-stat-pill-pending">
              Review
            </span>
          </div>
          <p className="admin-metric-value">{stats.paymentPending}</p>
        </Link>

        <Link
          href="/admin/registrations?payment=confirmed"
          className="admin-metric admin-metric-confirmed"
        >
          <div className="admin-metric-head">
            <p className="admin-metric-label">Payment confirmed</p>
            <span className="admin-stat-pill admin-stat-pill-confirmed">
              Paid
            </span>
          </div>
          <p className="admin-metric-value">{stats.paymentConfirmed}</p>
        </Link>

        <div className="admin-metric admin-metric-static admin-metric-revenue">
          <div className="admin-metric-head">
            <p className="admin-metric-label">Total amount</p>
          </div>
          <p className="admin-metric-value">{formatPkr(stats.totalAmount)}</p>
          <p className="admin-metric-sub">Confirmed payments only</p>
        </div>
      </div>

      <div className="admin-overview-split">
        <section className="admin-panel">
          <h2 className="admin-panel-title">Registrations — last 30 days</h2>
          <RegistrationsChart data={chartData} />
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel-title">Public status banner</h2>
          <BannerEditor initial={banner} />
        </section>
      </div>
    </>
  );
}
