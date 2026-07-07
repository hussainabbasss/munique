import { DelegateListEditor } from "@/components/registration/delegate-list-editor";
import type { DelegationDraft } from "@/lib/registration/types";

type DelegationMembersStepProps = {
  draft: DelegationDraft;
  onChange: (patch: Partial<DelegationDraft>) => void;
};

export function DelegationMembersStep({
  draft,
  onChange,
}: DelegationMembersStepProps) {
  return (
    <DelegateListEditor
      members={draft.members}
      onChange={(members) => onChange({ members })}
    />
  );
}
