import { CommitteePrefFields } from "@/components/registration/committee-pref-fields";
import type { Committee } from "@/lib/types/admin";
import {
  emptyDelegateMember,
  DELEGATION_MAX_DELEGATES,
  DELEGATION_MIN_DELEGATES,
  type DelegateMember,
} from "@/lib/registration/types";

type DelegateListEditorProps = {
  members: DelegateMember[];
  committees: Committee[];
  onChange: (members: DelegateMember[]) => void;
};

export function DelegateListEditor({
  members,
  committees,
  onChange,
}: DelegateListEditorProps) {
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
    onChange([...members, emptyDelegateMember()]);
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
          <div className="registration-delegate-row-top">
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
              className="btn btn-outline registration-member-remove"
              onClick={() => removeMember(index)}
              disabled={members.length <= 1}
            >
              Remove
            </button>
          </div>

          <CommitteePrefFields
            idPrefix={`member_${index}`}
            committees={committees}
            pref1={member.committeePref1}
            pref2={member.committeePref2}
            pref3={member.committeePref3}
            munExperience={member.munExperience}
            hideIntro
            onPref1Change={(value) =>
              updateMember(index, { committeePref1: value })
            }
            onPref2Change={(value) =>
              updateMember(index, { committeePref2: value })
            }
            onPref3Change={(value) =>
              updateMember(index, { committeePref3: value })
            }
            onMunExperienceChange={(value) =>
              updateMember(index, { munExperience: value })
            }
          />
        </div>
      ))}

      <button
        type="button"
        className="btn btn-outline registration-add-member"
        onClick={addMember}
        disabled={totalDelegates >= DELEGATION_MAX_DELEGATES}
      >
        + Add delegate
      </button>
    </div>
  );
}
