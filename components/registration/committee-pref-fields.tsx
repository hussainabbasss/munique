import type { Committee } from "@/lib/types/admin";
import { CommitteePicker } from "@/components/registration/committee-picker";

type CommitteePrefFieldsProps = {
  idPrefix?: string;
  committees: Committee[];
  pref1: string;
  pref2: string;
  pref3: string;
  munExperience: string;
  hideMunExperience?: boolean;
  hideIntro?: boolean;
  onPref1Change: (value: string) => void;
  onPref2Change: (value: string) => void;
  onPref3Change: (value: string) => void;
  onMunExperienceChange: (value: string) => void;
};

export function CommitteePrefFields({
  idPrefix = "committee",
  committees,
  pref1,
  pref2,
  pref3,
  munExperience,
  hideMunExperience = false,
  hideIntro = false,
  onPref1Change,
  onPref2Change,
  onPref3Change,
  onMunExperienceChange,
}: CommitteePrefFieldsProps) {
  return (
    <div className="registration-field-group">
      <section className="registration-committee-prefs">
        {!hideIntro && (
          <p className="registration-committee-prefs-intro">
            Rank up to three committee choices. Preference 1 is your top pick.
          </p>
        )}
        <div className="registration-committee-prefs-grid">
          <CommitteePicker
            id={`${idPrefix}_pref_1`}
            label="1st choice"
            committees={committees}
            value={pref1}
            onChange={onPref1Change}
            required
          />

          <CommitteePicker
            id={`${idPrefix}_pref_2`}
            label="2nd choice"
            committees={committees}
            value={pref2}
            onChange={onPref2Change}
          />

          <CommitteePicker
            id={`${idPrefix}_pref_3`}
            label="3rd choice"
            committees={committees}
            value={pref3}
            onChange={onPref3Change}
          />
        </div>
      </section>

      {!hideMunExperience && (
        <div>
          <label htmlFor={`${idPrefix}_mun_experience`} className="registration-label">
            MUN experience
          </label>
          <textarea
            id={`${idPrefix}_mun_experience`}
            className="registration-field"
            rows={4}
            value={munExperience}
            onChange={(event) => onMunExperienceChange(event.target.value)}
            placeholder="Describe your prior MUN experience, awards, and committee interests."
          />
        </div>
      )}
    </div>
  );
}
