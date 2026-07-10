"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Tab = "delegate" | "delegation";

type Props = {
  payment?: string;
  q?: string;
};

export function RegistrationsTypeTabs({ payment, q }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("type") as Tab) || "delegate";

  function setTab(type: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    if (payment) params.set("payment", payment);
    if (q) params.set("q", q);
    router.push(`/admin/registrations?${params.toString()}`);
  }

  return (
    <>
      <p className="admin-field-hint admin-allotment-tabs-lede">
        Switch between individual delegates and delegations.
      </p>
      <div
        className="admin-allotment-tabs"
        role="tablist"
        aria-label="Registration type"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "delegate"}
          className={`admin-allotment-tab${activeTab === "delegate" ? " admin-allotment-tab-active" : ""}`}
          onClick={() => setTab("delegate")}
        >
          Individual delegates
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "delegation"}
          className={`admin-allotment-tab${activeTab === "delegation" ? " admin-allotment-tab-active" : ""}`}
          onClick={() => setTab("delegation")}
        >
          Delegations
        </button>
      </div>
    </>
  );
}
