import {
  DELEGATION_MAX_DELEGATES,
  DELEGATION_MIN_DELEGATES,
  type DelegateMember,
} from "@/lib/registration/types";

type DelegateListEditorProps = {
  members: DelegateMember[];
  onChange: (members: DelegateMember[]) => void;
};

export function DelegateListEditor({ members, onChange }: DelegateListEditorProps) {
  const totalDelegates = 1 + members.length;

  const updateMember = (index: number, patch: Partial<DelegateMember>) => {
    onChange(
      members.map((member, memberIndex) =>
        memberIndex === index ? { ...member, ...patch } : member,
      ),
    );
  };

  const addMember = () => {
    if (totalDelegates >= DELEGATION_MAX_DELEGATES) return;
    onChange([...members, { fullName: "", email: "" }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    onChange(members.filter((_, memberIndex) => memberIndex !== index));
  };

  return (
    <div>
      <p className="registration-member-count">
        {totalDelegates} delegate{totalDelegates === 1 ? "" : "s"} (
        {DELEGATION_MIN_DELEGATES}–{DELEGATION_MAX_DELEGATES} total including head)
      </p>

      {members.map((member, index) => (
        <div key={index} className="registration-delegate-row">
          <div>
            <label
              htmlFor={`member_name_${index}`}
              className="registration-label"
            >
              Member {index + 1} — full name
            </label>
            <input
              id={`member_name_${index}`}
              className="registration-field"
              value={member.fullName}
              onChange={(event) =>
                updateMember(index, { fullName: event.target.value })
              }
              required
            />
          </div>
          <div>
            <label
              htmlFor={`member_email_${index}`}
              className="registration-label"
            >
              Email (optional)
            </label>
            <input
              id={`member_email_${index}`}
              type="email"
              className="registration-field"
              value={member.email}
              onChange={(event) =>
                updateMember(index, { email: event.target.value })
              }
            />
          </div>
          <button
            type="button"
            className="registration-btn-back min-h-[2.75rem] justify-self-start sm:justify-self-auto"
            onClick={() => removeMember(index)}
            disabled={members.length <= 1}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        className="registration-btn-back registration-add-member min-h-[2.75rem]"
        onClick={addMember}
        disabled={totalDelegates >= DELEGATION_MAX_DELEGATES}
      >
        + Add delegate
      </button>
    </div>
  );
}
