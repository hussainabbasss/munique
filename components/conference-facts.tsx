import { Reveal } from "@/components/reveal";

const facts = [
  { label: "Conference dates", value: null },
  { label: "Venue", value: null },
  { label: "Delegate capacity", value: "250–300" },
  { label: "Edition", value: "I" },
] as const;

export function ConferenceFacts() {
  return (
    <section className="home-facts" aria-label="Conference facts">
      <div className="sheet">
        <div className="home-facts-grid">
          {facts.map((fact, index) => (
            <Reveal
              key={fact.label}
              delay={index * 70}
              className="home-facts-cell"
            >
              <p className="mono-label">{fact.label}</p>
              {fact.value ? (
                <p className="home-facts-value">{fact.value}</p>
              ) : (
                <p className="home-facts-value home-facts-value-tba">
                  <span className="tag tag-signal home-facts-stamp">TBA</span>
                </p>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
