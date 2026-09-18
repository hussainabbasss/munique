import { resolveCommitteePool } from "@/lib/allotments/countries";

export type SeatHolder = {
  allotmentId: string;
  delegateId: string;
  registrationUuid: string;
  registrationId: string;
  fullName: string;
  school: string | null;
  type: "delegate" | "delegation";
  isHeadDelegate: boolean;
  status: string;
};

export type CountrySeat = {
  country: string;
  /** False when the country was assigned manually and is not in the committee pool. */
  inPool: boolean;
  holders: SeatHolder[];
};

export type CommitteeMatrix = {
  id: string;
  name: string;
  isPublished: boolean;
  seats: CountrySeat[];
  total: number;
  taken: number;
  left: number;
  offPool: number;
};

export type MatrixCommitteeInput = {
  id: string;
  name: string;
  is_published: boolean;
  country_pool: string[] | null;
};

export type MatrixAllotmentInput = {
  id: string;
  registration_id: string;
  delegate_id: string;
  committee_id: string | null;
  country: string | null;
  status: string;
  registrations: {
    registration_id: string;
    type: "delegate" | "delegation";
    school: string | null;
  } | null;
  delegates: {
    full_name: string;
    is_head_delegate: boolean;
  } | null;
};

const seatKey = (country: string) => country.trim().toLowerCase();

/** Per-committee view of which pool countries are taken (and by whom) and which are left. */
export function buildCountryMatrix(
  committees: MatrixCommitteeInput[],
  allotments: MatrixAllotmentInput[],
): CommitteeMatrix[] {
  const holdersByCommittee = new Map<string, Map<string, SeatHolder[]>>();
  const labelByKey = new Map<string, string>();

  for (const allotment of allotments) {
    const country = allotment.country?.trim();
    if (!country || !allotment.committee_id) continue;

    const key = seatKey(country);
    if (!labelByKey.has(key)) labelByKey.set(key, country);

    const byCountry =
      holdersByCommittee.get(allotment.committee_id) ??
      new Map<string, SeatHolder[]>();
    holdersByCommittee.set(allotment.committee_id, byCountry);

    const holders = byCountry.get(key) ?? [];
    byCountry.set(key, holders);
    holders.push({
      allotmentId: allotment.id,
      delegateId: allotment.delegate_id,
      registrationUuid: allotment.registration_id,
      registrationId: allotment.registrations?.registration_id ?? "—",
      fullName: allotment.delegates?.full_name ?? "Unknown delegate",
      school: allotment.registrations?.school ?? null,
      type: allotment.registrations?.type ?? "delegate",
      isHeadDelegate: allotment.delegates?.is_head_delegate ?? false,
      status: allotment.status,
    });
  }

  return committees.map((committee) => {
    const byCountry = holdersByCommittee.get(committee.id) ?? new Map();
    const pool = resolveCommitteePool(committee.country_pool);
    const poolKeys = new Set<string>();
    const seats: CountrySeat[] = [];

    for (const country of pool) {
      const key = seatKey(country);
      if (poolKeys.has(key)) continue;
      poolKeys.add(key);
      seats.push({
        country,
        inPool: true,
        holders: byCountry.get(key) ?? [],
      });
    }

    for (const [key, holders] of byCountry) {
      if (poolKeys.has(key)) continue;
      seats.push({
        country: labelByKey.get(key) ?? key,
        inPool: false,
        holders,
      });
    }

    const total = poolKeys.size;
    const taken = seats.filter(
      (seat) => seat.inPool && seat.holders.length > 0,
    ).length;

    return {
      id: committee.id,
      name: committee.name,
      isPublished: committee.is_published,
      seats,
      total,
      taken,
      left: total - taken,
      offPool: seats.filter((seat) => !seat.inPool).length,
    };
  });
}
