import { DelegateListEditor } from "@/components/registration/delegate-list-editor";
import type { Committee } from "@/lib/types/admin";
import type { DelegationDraft } from "@/lib/registration/types";

type DelegationMembersStepProps = {
  draft: DelegationDraft;
  committees: Committee[];
  onChange: (patch: Partial<DelegationDraft>) => void;
};

export function DelegationMembersStep({
  draft,
  committees,
  onChange,
}: DelegationMembersStepProps) {
  return (
    <DelegateListEditor
      members={draft.members}
      committees={committees}
      onChange={(members) => onChange({ members })}
    />
  );
}
