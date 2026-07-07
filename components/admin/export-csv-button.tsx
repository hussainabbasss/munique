"use client";

export function ExportCsvButton() {
  async function handleExport() {
    const { exportRegistrationsCsvAction } = await import(
      "@/lib/admin/actions/overview"
    );
    const csv = await exportRegistrationsCsvAction();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `munique-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      className="admin-action-chip"
      onClick={handleExport}
    >
      Export CSV
    </button>
  );
}
