import type { Committee } from "@/lib/types/admin";
import { CommitteePicker } from "@/components/registration/committee-picker";

type CommitteePrefFieldsProps = {
  committees: Committee[];
  pref1: string;
  pref2: string;
  pref3: string;
  munExperience: string;
  onPref1Change: (value: string) => void;
  onPref2Change: (value: string) => void;
  onPref3Change: (value: string) => void;
  onMunExperienceChange: (value: string) => void;
};

export function CommitteePrefFields({
  committees,
  pref1,
  pref2,
  pref3,
  munExperience,
  onPref1Change,
  onPref2Change,
  onPref3Change,
  onMunExperienceChange,
}: CommitteePrefFieldsProps) {
  return (
    <div className="registration-field-group">
      <CommitteePicker
        id="committee_pref_1"
        label="Committee preference 1"
        committees={committees}
        value={pref1}
        onChange={onPref1Change}
        required
      />

      <CommitteePicker
        id="committee_pref_2"
        label="Committee preference 2"
        committees={committees}
        value={pref2}
        onChange={onPref2Change}
      />

      <CommitteePicker
        id="committee_pref_3"
        label="Committee preference 3"
        committees={committees}
        value={pref3}
        onChange={onPref3Change}
      />

      <div>
        <label htmlFor="mun_experience" className="registration-label">
          MUN experience
        </label>
        <textarea
          id="mun_experience"
          className="registration-field"
          rows={5}
          value={munExperience}
          onChange={(event) => onMunExperienceChange(event.target.value)}
          placeholder="Describe your prior MUN experience, awards, and committee interests."
        />
      </div>
    </div>
  );
}
