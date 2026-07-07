"use client";

import { useCallback, useEffect, useState } from "react";
import type { Portal } from "@/lib/registration/types";
import {
  emptyDelegateDraft,
  emptyDelegationDraft,
  type DelegateDraft,
  type DelegationDraft,
  type RegistrationDraft,
} from "@/lib/registration/types";

const STORAGE_PREFIX = "munique-registration-draft";

function storageKey(portal: Portal) {
  return `${STORAGE_PREFIX}:${portal}`;
}

function readDraft(portal: Portal): RegistrationDraft {
  if (typeof window === "undefined") {
    return portal === "delegate" ? emptyDelegateDraft() : emptyDelegationDraft();
  }

  try {
    const raw = sessionStorage.getItem(storageKey(portal));
    if (!raw) {
      return portal === "delegate" ? emptyDelegateDraft() : emptyDelegationDraft();
    }

    const parsed = JSON.parse(raw) as RegistrationDraft;
    if (portal === "delegate") {
      return { ...emptyDelegateDraft(), ...parsed };
    }

    const base = emptyDelegationDraft();
    return {
      ...base,
      ...parsed,
      members:
        Array.isArray((parsed as DelegationDraft).members) &&
        (parsed as DelegationDraft).members.length > 0
          ? (parsed as DelegationDraft).members
          : base.members,
    };
  } catch {
    return portal === "delegate" ? emptyDelegateDraft() : emptyDelegationDraft();
  }
}

function writeDraft(portal: Portal, draft: RegistrationDraft) {
  sessionStorage.setItem(storageKey(portal), JSON.stringify(draft));
}

export function clearRegistrationDraft(portal: Portal) {
  sessionStorage.removeItem(storageKey(portal));
}

export function useRegistrationDraft(portal: Portal) {
  const [draft, setDraft] = useState<RegistrationDraft>(() =>
    portal === "delegate" ? emptyDelegateDraft() : emptyDelegationDraft(),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setDraft(readDraft(portal));
      setHydrated(true);
    });
  }, [portal]);

  useEffect(() => {
    if (!hydrated) return;
    writeDraft(portal, draft);
  }, [draft, hydrated, portal]);

  const updateDraft = useCallback(
    (patch: Partial<DelegateDraft> | Partial<DelegationDraft>) => {
      setDraft((current) => ({ ...current, ...patch }));
    },
    [],
  );

  return { draft, updateDraft, hydrated };
}
